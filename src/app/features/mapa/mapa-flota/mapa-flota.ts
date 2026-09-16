import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, interval } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as L from 'leaflet';

import { TelemetriaService } from '../../../core/services/telemetria.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import { ChoferesService } from '../../../core/services/choferes.service';
import { Chofer } from '../../../core/models/chofer.model';
import { Empresa } from '../../../core/models/empresa.model';
import {
  Flota,
  Recorrido,
  ResumenFlota,
  Unidad,
  UnidadConPosicion,
  ViajeHistorico,
  tienePosicion,
} from '../../../core/models/telemetria.model';
import { EstadoCarga } from '../../../shared/components/estado-carga/estado-carga';
import { SelectEmpresa } from '../../../shared/components/select-empresa/select-empresa';

const CENTRO_ARGENTINA: L.LatLngExpression = [-34.6, -62.0];
const ZOOM_INICIAL = 6;
const ZOOM_UNIDAD = 12;
const REFRESCO_MS = 30_000;
const MINUTOS_REPORTE_VIEJO = 30;

/** Desde este zoom las etiquetas quedan fijas: más lejos se pisarían entre ellas. */
const ZOOM_ETIQUETAS = 11;
const COLOR_RECORRIDO = '#106b56';

/**
 * Mapa base. Se evaluaron alternativas con renderizado real y marcadores encima:
 * el IGN (Argenmap) rotula bien las Malvinas y numera las rutas, pero a zoom regional
 * no muestra nombres de localidades, que es lo que hace falta para ubicar una unidad;
 * CARTO ya exige clave y estampa una marca de agua sobre los tiles. OpenStreetMap es la
 * única sin clave que combina rutas, pueblos y buen contraste con los marcadores.
 */
const CAPA_BASE = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  atribucion: '&copy; OpenStreetMap',
  zoomMaximo: 18,
};

/** Contenido de la tarjeta flotante: una sola superficie, sus estados. */
type VistaTarjeta = 'filtros' | 'unidad' | 'sin_gps' | 'historico';

/** El mapa mira el presente o el pasado; no son el mismo trabajo. */
type ModoMapa = 'ahora' | 'historico';

@Component({
  selector: 'app-mapa-flota',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, DecimalPipe, EstadoCarga, SelectEmpresa],
  templateUrl: './mapa-flota.html',
  styleUrl: './mapa-flota.css',
})
export class MapaFlota implements OnInit, AfterViewInit {
  private telemetriaService = inject(TelemetriaService);
  private empresasService = inject(EmpresasService);
  private choferesService = inject(ChoferesService);
  private destroyRef = inject(DestroyRef);

  private lienzo = viewChild.required<ElementRef<HTMLElement>>('lienzo');
  private contenedorMapa = viewChild.required<ElementRef<HTMLElement>>('mapa');
  private mapa?: L.Map;
  private capaMarcadores = L.layerGroup();
  private capaRecorrido = L.layerGroup();
  private marcadores = new Map<string, L.Marker>();
  /** Etiqueta de cada unidad, para poder recrearla al cambiar el zoom. */
  private etiquetas = new Map<string, string>();

  unidades = signal<Unidad[]>([]);
  resumen = signal<ResumenFlota | null>(null);
  generadoEn = signal<string | null>(null);
  seleccionada = signal<Unidad | null>(null);
  empresas = signal<Empresa[]>([]);

  cargando = signal(true);
  error = signal<string | null>(null);
  recorrido = signal<Recorrido | null>(null);
  cargandoRecorrido = signal(false);
  errorRecorrido = signal<string | null>(null);
  pantallaCompleta = signal(false);
  tarjetaVisible = signal(true);
  private vistaManual = signal<VistaTarjeta>('filtros');

  modo = signal<ModoMapa>('ahora');
  choferes = signal<Chofer[]>([]);
  histChoferId = signal('');
  histPatente = signal('');
  histDesde = signal('');
  histHasta = signal('');
  histViajes = signal<ViajeHistorico[]>([]);
  histBuscando = signal(false);
  histBuscado = signal(false);
  histError = signal<string | null>(null);
  viajeElegido = signal<ViajeHistorico | null>(null);

  busquedaInput = signal('');
  busqueda = signal('');
  filtroEmpresaId = signal('');
  soloEnViaje = signal(false);
  private busquedaCambio$ = new Subject<string>();

  /** Qué significa cada color, en el mismo orden en que se lee el mapa. */
  readonly referencias = [
    { clase: 'estado-viajando', texto: 'En viaje, en movimiento' },
    { clase: 'estado-detenida', texto: 'En viaje, detenida' },
    { clase: 'estado-libre', texto: 'Sin viaje asignado' },
    { clase: 'estado-sin-senal', texto: 'Sin reportar hace más de 30 min' },
    { clase: 'estado-dada-de-baja', texto: 'Dada de baja, con equipo activo' },
    { clase: 'estado-no-registrada', texto: 'No registrada en el sistema' },
  ];

  sinGps = computed(() => this.unidades().filter((u) => u.categoria === 'sin_gps'));

  /** Seleccionar una unidad manda sobre lo que se estuviera mirando. */
  vista = computed<VistaTarjeta>(() => {
    if (this.seleccionada()) return 'unidad';
    if (this.modo() === 'historico') return 'historico';
    return this.vistaManual();
  });

  ngOnInit(): void {
    this.busquedaCambio$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => {
        this.busqueda.set(valor);
        this.cargar();
      });

    interval(REFRESCO_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.modo() === 'ahora' && this.cargar(true));

    this.empresasService.listar(1, 200).subscribe({
      next: (respuesta) => this.empresas.set(respuesta.items),
      error: () => this.empresas.set([]),
    });
  }

  ngAfterViewInit(): void {
    this.mapa = L.map(this.contenedorMapa().nativeElement, {
      center: CENTRO_ARGENTINA,
      zoom: ZOOM_INICIAL,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(CAPA_BASE.url, { maxZoom: CAPA_BASE.zoomMaximo }).addTo(this.mapa);
    L.control.zoom({ position: 'bottomright' }).addTo(this.mapa);
    L.control
      .attribution({ position: 'bottomleft', prefix: false })
      .addAttribution(CAPA_BASE.atribucion)
      .addTo(this.mapa);
    this.capaMarcadores.addTo(this.mapa);
    this.capaRecorrido.addTo(this.mapa);

    this.observarTamano();
    this.observarPantallaCompleta();
    this.observarZoom();
    this.cargar();
  }

  /** Leaflet necesita saber cuándo cambia el tamaño: sidebar, pantalla completa o resize. */
  private observarTamano(): void {
    if (typeof ResizeObserver === 'undefined') return;

    const observador = new ResizeObserver(() => this.mapa?.invalidateSize());
    observador.observe(this.contenedorMapa().nativeElement);
    this.destroyRef.onDestroy(() => observador.disconnect());
  }

  private observarPantallaCompleta(): void {
    const alCambiar = () =>
      this.pantallaCompleta.set(document.fullscreenElement === this.lienzo().nativeElement);
    document.addEventListener('fullscreenchange', alCambiar);
    this.destroyRef.onDestroy(() => document.removeEventListener('fullscreenchange', alCambiar));
  }

  alternarPantallaCompleta(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    this.lienzo().nativeElement.requestFullscreen?.();
  }

  cargar(silencioso = false): void {
    if (!silencioso) this.cargando.set(true);

    this.telemetriaService
      .obtenerFlota({
        busqueda: this.busqueda(),
        empresa_id: this.filtroEmpresaId(),
        solo_en_viaje: this.soloEnViaje() || undefined,
      })
      .subscribe({
        next: (flota) => this.aplicar(flota),
        error: (respuesta) => {
          // El backend explica qué falló; mostrarlo evita tener que mirar la consola.
          this.error.set(
            respuesta?.error?.detail ?? 'No se pudo obtener la posición de las unidades.',
          );
          this.cargando.set(false);
        },
      });
  }

  private aplicar(flota: Flota): void {
    this.generadoEn.set(flota.generado_en);
    this.resumen.set(flota.resumen);
    this.unidades.set(flota.unidades);
    this.error.set(null);
    this.cargando.set(false);

    this.dibujar(flota.unidades.filter(tienePosicion));
    this.refrescarSeleccion(flota.unidades);
  }

  /** Reutiliza los marcadores existentes para que el mapa no parpadee al refrescar. */
  private dibujar(unidades: UnidadConPosicion[]): void {
    const vigentes = new Set<string>();

    for (const unidad of unidades) {
      vigentes.add(unidad.patente);
      const posicion: L.LatLngExpression = [unidad.posicion.latitud, unidad.posicion.longitud];
      const existente = this.marcadores.get(unidad.patente);

      if (existente) {
        existente.setLatLng(posicion).setIcon(this.icono(unidad));
        this.rotular(existente, unidad);
        continue;
      }

      const marcador = L.marker(posicion, { icon: this.icono(unidad) })
        .on('click', () => this.seleccionar(unidad))
        .addTo(this.capaMarcadores);
      this.rotular(marcador, unidad);
      this.marcadores.set(unidad.patente, marcador);
    }

    for (const [patente, marcador] of this.marcadores) {
      if (!vigentes.has(patente)) {
        this.capaMarcadores.removeLayer(marcador);
        this.marcadores.delete(patente);
        this.etiquetas.delete(patente);
      }
    }
  }

  /** Patente y, si está viajando, quién la maneja. */
  private rotular(marcador: L.Marker, unidad: UnidadConPosicion): void {
    const chofer = 'viaje' in unidad ? (unidad.viaje?.chofer_nombre ?? null) : null;
    const pie =
      chofer ?? (unidad.categoria === 'no_registrada' ? 'No registrada' : 'Sin viaje asignado');

    const html = `<strong>${unidad.patente}</strong><span>${pie}</span>`;

    if (this.etiquetas.get(unidad.patente) === html && marcador.getTooltip()) return;

    this.etiquetas.set(unidad.patente, html);
    this.aplicarEtiqueta(marcador, html);
  }

  private aplicarEtiqueta(marcador: L.Marker, html: string): void {
    const fija = (this.mapa?.getZoom() ?? ZOOM_INICIAL) >= ZOOM_ETIQUETAS;

    marcador.unbindTooltip();
    marcador.bindTooltip(html, {
      permanent: fija,
      direction: 'top',
      offset: [0, -12],
      className: 'etiqueta-mapa',
      opacity: 1,
    });
  }

  /** Al acercarse las etiquetas se fijan; al alejarse vuelven a salir solo con el mouse. */
  private observarZoom(): void {
    if (!this.mapa) return;

    let fijasAntes = this.mapa.getZoom() >= ZOOM_ETIQUETAS;
    this.mapa.on('zoomend', () => {
      const fijasAhora = (this.mapa?.getZoom() ?? 0) >= ZOOM_ETIQUETAS;
      if (fijasAhora === fijasAntes) return;

      fijasAntes = fijasAhora;
      for (const [patente, marcador] of this.marcadores) {
        const html = this.etiquetas.get(patente);
        if (html) this.aplicarEtiqueta(marcador, html);
      }
    });
  }

  private icono(unidad: UnidadConPosicion): L.DivIcon {
    const activo = this.seleccionada()?.patente === unidad.patente ? ' activo' : '';
    return L.divIcon({
      className: '',
      html: `<span class="marcador ${this.claseUnidad(unidad)}${activo}"></span>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }

  claseUnidad(unidad: Unidad): string {
    if (unidad.categoria === 'no_registrada') return 'estado-no-registrada';
    if (unidad.categoria === 'dada_de_baja') return 'estado-dada-de-baja';
    if (unidad.categoria === 'sin_gps') return 'estado-sin-gps';
    if (this.reporteViejo(unidad)) return 'estado-sin-senal';
    if (unidad.viaje)
      return unidad.posicion.velocidad_kph > 0 ? 'estado-viajando' : 'estado-detenida';
    return 'estado-libre';
  }

  reporteViejo(unidad: Unidad): boolean {
    return tienePosicion(unidad) && unidad.posicion.minutos_desde_reporte >= MINUTOS_REPORTE_VIEJO;
  }

  seleccionar(unidad: Unidad): void {
    const anterior = this.seleccionada();
    if (anterior?.patente !== unidad.patente) this.ocultarRecorrido();
    this.seleccionada.set(unidad);
    this.tarjetaVisible.set(true);
    this.repintar(anterior, unidad);

    if (tienePosicion(unidad)) {
      this.mapa?.flyTo([unidad.posicion.latitud, unidad.posicion.longitud], ZOOM_UNIDAD, {
        duration: 0.6,
      });
    }

    // El recorrido se muestra solo; el botón de ocultar queda por si estorba.
    const viaje = 'viaje' in unidad ? unidad.viaje : null;
    if (viaje) this.verRecorrido(viaje.id);
  }

  volverAFiltros(): void {
    this.ocultarRecorrido();
    const anterior = this.seleccionada();
    this.seleccionada.set(null);
    this.vistaManual.set('filtros');
    this.repintar(anterior, null);
  }

  private repintar(...unidades: (Unidad | null)[]): void {
    for (const unidad of unidades) {
      if (unidad && tienePosicion(unidad)) {
        this.marcadores.get(unidad.patente)?.setIcon(this.icono(unidad));
      }
    }
  }

  /** Mantiene la tarjeta abierta con los datos frescos tras cada refresco. */
  private refrescarSeleccion(unidades: Unidad[]): void {
    const actual = this.seleccionada();
    if (!actual) return;
    this.seleccionada.set(unidades.find((u) => u.patente === actual.patente) ?? null);
  }

  verSinGps(): void {
    this.seleccionada.set(null);
    this.vistaManual.set('sin_gps');
    this.tarjetaVisible.set(true);
  }

  alternarTarjeta(): void {
    this.tarjetaVisible.update((v) => !v);
  }

  onBusqueda(valor: string): void {
    this.busquedaInput.set(valor);
    this.busquedaCambio$.next(valor);
  }

  onEmpresa(valor: string | null | undefined): void {
    this.filtroEmpresaId.set(valor ?? '');
    this.cargar();
  }

  alternarSoloEnViaje(): void {
    this.soloEnViaje.update((v) => !v);
    this.cargar();
  }

  verRecorrido(viajeId: string): void {
    this.cargandoRecorrido.set(true);
    this.errorRecorrido.set(null);

    this.telemetriaService.obtenerRecorrido(viajeId).subscribe({
      next: (traza) => {
        this.cargandoRecorrido.set(false);
        this.recorrido.set(traza);
        this.dibujarRecorrido(traza);
      },
      error: (respuesta) => {
        this.cargandoRecorrido.set(false);
        this.errorRecorrido.set(
          respuesta?.error?.detail ?? 'No se pudo obtener el recorrido de este viaje.',
        );
      },
    });
  }

  ocultarRecorrido(): void {
    this.capaRecorrido.clearLayers();
    this.recorrido.set(null);
    this.errorRecorrido.set(null);
  }

  private dibujarRecorrido(traza: Recorrido): void {
    this.capaRecorrido.clearLayers();
    if (!traza.puntos.length || !this.mapa) return;

    const trazado = traza.puntos.map((p) => [p.latitud, p.longitud] as L.LatLngTuple);
    const linea = L.polyline(trazado, { color: COLOR_RECORRIDO, weight: 4, opacity: 0.85 });
    linea.addTo(this.capaRecorrido);

    const primero = traza.puntos[0];
    const ultimo = traza.puntos[traza.puntos.length - 1];
    this.hito('inicio', 'Salida', primero.latitud, primero.longitud, primero.momento);
    if (traza.puntos.length > 1) {
      const enCamino = traza.en_camino;
      this.hito(
        enCamino ? 'camino' : 'fin',
        enCamino ? 'En camino' : 'Llegada',
        ultimo.latitud,
        ultimo.longitud,
        ultimo.momento,
      );
    }

    for (const parada of traza.detenciones) {
      L.circleMarker([parada.latitud, parada.longitud], {
        radius: 5,
        color: '#fff',
        weight: 2,
        fillColor: COLOR_RECORRIDO,
        fillOpacity: 1,
      })
        .bindTooltip(`Detención ${parada.duracion ?? ''}`.trim())
        .addTo(this.capaRecorrido);
    }

    this.mapa.fitBounds(linea.getBounds(), { padding: [50, 50] });
  }

  /** Banderita de salida o de llegada, con la hora exacta en el tooltip. */
  private hito(
    tipo: 'inicio' | 'fin' | 'camino',
    titulo: string,
    lat: number,
    lon: number,
    momento: string,
  ): void {
    const hora = new Date(momento).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    L.marker([lat, lon], {
      zIndexOffset: 1000,
      icon: L.divIcon({
        className: '',
        html: `<span class="hito ${tipo}"><b>${titulo}</b></span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }),
    })
      .bindTooltip(`${titulo}: ${hora}`)
      .addTo(this.capaRecorrido);
  }

  // --- Modo histórico: buscar viajes pasados y dibujar su recorrido ---

  cambiarModo(modo: ModoMapa): void {
    if (this.modo() === modo) return;

    this.modo.set(modo);
    this.ocultarRecorrido();
    this.seleccionada.set(null);
    this.viajeElegido.set(null);

    if (modo === 'historico') {
      this.capaMarcadores.clearLayers();
      this.marcadores.clear();
      this.etiquetas.clear();
      if (!this.choferes().length) {
        this.choferesService.listar(1, 500).subscribe({
          next: (r) => this.choferes.set(r.items),
          error: () => this.choferes.set([]),
        });
      }
      return;
    }

    this.histViajes.set([]);
    this.histBuscado.set(false);
    this.cargar();
  }

  buscarHistorico(): void {
    if (this.histBuscando()) return;

    this.histBuscando.set(true);
    this.histError.set(null);
    this.viajeElegido.set(null);
    this.ocultarRecorrido();

    this.telemetriaService
      .buscarViajes({
        chofer_id: this.histChoferId() || undefined,
        patente: this.histPatente() || undefined,
        fecha_desde: this.histDesde() || undefined,
        fecha_hasta: this.histHasta() || undefined,
      })
      .subscribe({
        next: (viajes) => {
          this.histBuscando.set(false);
          this.histBuscado.set(true);
          this.histViajes.set(viajes);
        },
        error: (respuesta) => {
          this.histBuscando.set(false);
          this.histBuscado.set(true);
          this.histViajes.set([]);
          this.histError.set(respuesta?.error?.detail ?? 'No se pudo buscar los viajes.');
        },
      });
  }

  limpiarHistorico(): void {
    this.histChoferId.set('');
    this.histPatente.set('');
    this.histDesde.set('');
    this.histHasta.set('');
    this.histViajes.set([]);
    this.histBuscado.set(false);
    this.histError.set(null);
    this.viajeElegido.set(null);
    this.ocultarRecorrido();
  }

  elegirViaje(viaje: ViajeHistorico): void {
    this.viajeElegido.set(viaje);
    this.verRecorrido(viaje.id);
  }

  volverAlBuscador(): void {
    this.viajeElegido.set(null);
    this.ocultarRecorrido();
  }

  /**
   * Un viaje guardado puede no tener traza por más de un motivo, y al operario le sirve
   * saber cuál para poder corregirlo.
   */
  motivoSinRecorrido(traza: Recorrido): string | null {
    if (traza.puntos.length) return null;

    if (traza.sin_datos_por_antiguedad) {
      return (
        'El servicio de rastreo conserva alrededor de seis meses de recorridos y este viaje ' +
        'es anterior, así que ya no quedan posiciones para dibujar.'
      );
    }

    return (
      'Este viaje no tiene recorrido satelital. Puede ser que la unidad haya viajado sin ' +
      'equipo de rastreo, que el equipo no haya reportado, o que las fechas del viaje se ' +
      'hayan cargado mal al guardarlo. Revisá las fechas y la patente antes de descartarlo.'
    );
  }

  esUbicada = tienePosicion;
}
