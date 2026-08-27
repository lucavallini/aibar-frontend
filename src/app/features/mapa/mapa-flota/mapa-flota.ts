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
import { Empresa } from '../../../core/models/empresa.model';
import {
  Flota,
  Recorrido,
  ResumenFlota,
  Unidad,
  UnidadConPosicion,
  tienePosicion,
} from '../../../core/models/telemetria.model';
import { EstadoCarga } from '../../../shared/components/estado-carga/estado-carga';
import { SelectEmpresa } from '../../../shared/components/select-empresa/select-empresa';

const CENTRO_ARGENTINA: L.LatLngExpression = [-34.6, -62.0];
const ZOOM_INICIAL = 6;
const ZOOM_UNIDAD = 12;
const REFRESCO_MS = 30_000;
const MINUTOS_REPORTE_VIEJO = 30;
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

/** Contenido de la tarjeta flotante: una sola superficie, tres estados. */
type VistaTarjeta = 'filtros' | 'unidad' | 'sin_gps';

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
  private destroyRef = inject(DestroyRef);

  private lienzo = viewChild.required<ElementRef<HTMLElement>>('lienzo');
  private contenedorMapa = viewChild.required<ElementRef<HTMLElement>>('mapa');
  private mapa?: L.Map;
  private capaMarcadores = L.layerGroup();
  private capaRecorrido = L.layerGroup();
  private marcadores = new Map<string, L.Marker>();

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
  vista = computed<VistaTarjeta>(() => (this.seleccionada() ? 'unidad' : this.vistaManual()));

  ngOnInit(): void {
    this.busquedaCambio$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => {
        this.busqueda.set(valor);
        this.cargar();
      });

    interval(REFRESCO_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargar(true));

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
        error: () => {
          this.error.set('No se pudo obtener la posición de las unidades.');
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
        continue;
      }

      const marcador = L.marker(posicion, { icon: this.icono(unidad), title: unidad.patente })
        .on('click', () => this.seleccionar(unidad))
        .addTo(this.capaMarcadores);
      this.marcadores.set(unidad.patente, marcador);
    }

    for (const [patente, marcador] of this.marcadores) {
      if (!vigentes.has(patente)) {
        this.capaMarcadores.removeLayer(marcador);
        this.marcadores.delete(patente);
      }
    }
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

  esUbicada = tienePosicion;
}
