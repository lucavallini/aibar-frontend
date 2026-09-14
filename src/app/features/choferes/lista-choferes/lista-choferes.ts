import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Subject, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ChoferesService } from '../../../core/services/choferes.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import {
  Chofer,
  ChoferCreate,
  ChoferDetalle,
  ResumenPeriodo,
} from '../../../core/models/chofer.model';
import { Empresa } from '../../../core/models/empresa.model';
import { ViajesService } from '../../../core/services/viajes.service';
import { RendimientoCombustible } from '../../../core/models/viaje.model';
import { AuthService } from '../../../core/services/auth.service';
import { TablaPaginada } from '../../../shared/components/tabla-paginada/tabla-paginada';
import { Confirmar } from '../../../shared/components/confirmar/confirmar';
import { FormsModule } from '@angular/forms';
import { ObservacionesService } from '../../../core/services/observaciones.service';
import { Observacion } from '../../../core/models/observacion.model';
import { MiniModalEmpresa } from '../../../shared/components/mini-modal-empresa/mini-modal-empresa';
import { PaginaHeader } from '../../../shared/components/pagina-header/pagina-header';
import { EstadoCarga } from '../../../shared/components/estado-carga/estado-carga';
import { SelectEmpresa } from '../../../shared/components/select-empresa/select-empresa';
import { BuscadorSelect } from '../../../shared/components/buscador-select/buscador-select';
import { Modal } from '../../../shared/components/modal/modal';
import { labelEstadoChofer } from '../../../core/utils/estado-labels';
import { obtenerNombreEmpresa } from '../../../core/utils/entidades';
import { ObservacionesMesComponent } from '../observaciones-mes/observaciones-mes';

/** Lo que se espera desde la última tecla en un campo de fecha antes de consultar. */
const ESPERA_FECHA_MS = 700;

/** Año mínimo aceptable: tipeando "2026" se pasa por 0002, 0020 y 0202. */
const ANIO_MINIMO = 2000;

@Component({
  selector: 'app-lista-choferes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TablaPaginada,
    Confirmar,
    FormsModule,
    MiniModalEmpresa,
    PaginaHeader,
    EstadoCarga,
    SelectEmpresa,
    BuscadorSelect,
    Modal,
    DatePipe,
    DecimalPipe,
    ObservacionesMesComponent,
  ],
  templateUrl: './lista-choferes.html',
  styleUrl: './lista-choferes.css',
})
export class ListaChoferesComponent implements OnInit {
  choferes = signal<Chofer[]>([]);
  empresas = signal<Empresa[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  busquedaInput = signal('');
  busqueda = signal('');
  filtroEmpresaId = signal('');
  filtroFechaDesde = signal('');
  filtroFechaHasta = signal('');
  filtroDias = signal<number | null>(null);
  avisoPeriodo = signal<string | null>(null);
  periodo = signal<ResumenPeriodo | null>(null);

  opcionesDias: { label: string; valor: number | null }[] = [
    { label: 'Mes en curso', valor: null },
    { label: '15 días', valor: 15 },
    { label: '30 días', valor: 30 },
    { label: '60 días', valor: 60 },
  ];
  private busquedaCambio$ = new Subject<string>();

  /**
   * Toda recarga pasa por acá con su espera en milisegundos. Cada emisión cancela a la
   * anterior, así que mientras el usuario todavía está eligiendo una fecha no se dispara
   * ninguna consulta: sale una sola, con la fecha que finalmente eligió.
   */
  private recargar$ = new Subject<number>();

  pagina = signal(1);
  totalPaginas = signal(1);
  total = signal(0);
  tamanoPagina = 20;

  modalEditarAbierto = signal(false);
  modalBajaAbierto = signal(false);
  choferSeleccionado = signal<Chofer | null>(null);
  edicionChofer: Partial<ChoferCreate> = {};

  modalAltaAbierto = signal(false);
  nuevoChofer: ChoferCreate = this.formularioVacioAlta();

  modalDetalleAbierto = signal(false);
  choferDetalle = signal<ChoferDetalle | null>(null);
  rendimiento = signal<RendimientoCombustible | null>(null);

  miniModalEmpresaAbierto = signal(false);

  modalObservacionesAbierto = signal(false);
  choferObservaciones = signal<Observacion[]>([]);
  observacionActual = '';
  choferObsSeleccionado = signal<Chofer | null>(null);
  exitoObs = signal<string | null>(null);

  modalObservacionesMesAbierto = signal(false);

  readonly = computed(() => this.authService.esSoloLectura());

  constructor(
    private choferesService: ChoferesService,
    private empresasService: EmpresasService,
    private viajesService: ViajesService,
    private authService: AuthService,
    private observacionesService: ObservacionesService,
  ) {
    this.busquedaCambio$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((valor) => {
      this.busqueda.set(valor);
      this.pagina.set(1);
      this.recargar$.next(0);
    });

    this.recargar$
      .pipe(switchMap((espera) => timer(espera)))
      .subscribe(() => this.cargarChoferes());
  }

  ngOnInit(): void {
    this.cargarChoferes();
  }

  nombreEmpresa(empresaId: string | null): string {
    return obtenerNombreEmpresa(this.empresas(), empresaId);
  }

  labelEstadoChofer = labelEstadoChofer;

  estaVencido(fecha: string | null): boolean {
    if (!fecha) return false;
    return new Date(fecha + 'T00:00:00') < new Date(new Date().toDateString());
  }

  vencePronto(fecha: string | null): boolean {
    if (!fecha || this.estaVencido(fecha)) return false;
    const vence = new Date(fecha + 'T00:00:00');
    const limite = new Date();
    limite.setDate(limite.getDate() + 30);
    limite.setHours(0, 0, 0, 0);
    return vence <= limite;
  }

  formularioVacioAlta(): ChoferCreate {
    return {
      nombre_completo: '',
      dni: '',
      telefono: '',
      camion_id: undefined,
      empresa_id: undefined,
      carnet_vencimiento: null,
      carga_peligrosa_vencimiento: null,
    };
  }

  abrirAlta(): void {
    this.nuevoChofer = this.formularioVacioAlta();
    this.error.set(null);
    this.modalAltaAbierto.set(true);
  }

  cerrarAlta(): void {
    this.modalAltaAbierto.set(false);
  }

  confirmarAlta(): void {
    if (!this.nuevoChofer.nombre_completo.trim()) {
      this.error.set('El nombre completo es obligatorio');
      return;
    }

    this.choferesService.crear(this.nuevoChofer).subscribe({
      next: () => {
        this.cerrarAlta();
        this.pagina.set(1);
        this.cargarChoferes();
      },
      error: () => this.error.set('No se pudo crear el chofer'),
    });
  }

  abrirDetalle(chofer: Chofer): void {
    this.rendimiento.set(null);
    this.choferesService.obtenerDetalle(chofer.id).subscribe({
      next: (detalle) => {
        this.choferDetalle.set(detalle);
        this.modalDetalleAbierto.set(true);
      },
      error: () => this.error.set('No se pudo cargar el detalle del chofer'),
    });
    this.viajesService.rendimientoCombustible(chofer.id).subscribe({
      next: (r) => this.rendimiento.set(r),
    });
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
    this.choferDetalle.set(null);
    this.rendimiento.set(null);
  }

  abrirEditar(chofer: Chofer): void {
    this.choferSeleccionado.set(chofer);
    this.edicionChofer = {
      nombre_completo: chofer.nombre_completo,
      dni: chofer.dni ?? undefined,
      telefono: chofer.telefono ?? undefined,
      empresa_id: chofer.empresa_id ?? undefined,
      carnet_vencimiento: chofer.carnet_vencimiento ?? null,
      carga_peligrosa_vencimiento: chofer.carga_peligrosa_vencimiento ?? null,
    };
    this.error.set(null);
    this.modalEditarAbierto.set(true);
  }

  cerrarEditar(): void {
    this.modalEditarAbierto.set(false);
    this.choferSeleccionado.set(null);
  }

  confirmarEdicion(): void {
    const chofer = this.choferSeleccionado();
    if (!chofer) return;

    this.choferesService.actualizar(chofer.id, this.edicionChofer).subscribe({
      next: () => {
        this.cerrarEditar();
        this.cargarChoferes();
      },
      error: () => this.error.set('No se pudo editar el chofer'),
    });
  }

  abrirBaja(chofer: Chofer): void {
    this.choferSeleccionado.set(chofer);
    this.modalBajaAbierto.set(true);
  }

  cerrarBaja(): void {
    this.modalBajaAbierto.set(false);
    this.choferSeleccionado.set(null);
  }

  confirmarBaja(): void {
    const chofer = this.choferSeleccionado();
    if (!chofer) return;

    this.choferesService.darDeBaja(chofer.id).subscribe({
      next: () => {
        this.cerrarBaja();
        this.cargarChoferes();
      },
      error: () => this.error.set('No se pudo dar de baja el chofer'),
    });
  }

  cambiarBusqueda(valor: string): void {
    this.busquedaInput.set(valor);
    this.busquedaCambio$.next(valor);
  }

  cambiarFiltroFechaDesde(valor: string): void {
    this.filtroFechaDesde.set(valor);
    this.consultarSiLasFechasEstanListas();
  }

  cambiarFiltroFechaHasta(valor: string): void {
    this.filtroFechaHasta.set(valor);
    this.consultarSiLasFechasEstanListas();
  }

  /**
   * Una fecha a medio escribir igual es una fecha válida para el navegador: tipeando el
   * año se pasa por 0002, 0020 y 0202. Consultar con eso trae resultados sin sentido y,
   * si además invierte el rango, un error del servidor. Se espera a que esté completa.
   */
  private fechaIncompleta(valor: string): boolean {
    return !!valor && (valor.length !== 10 || Number(valor.slice(0, 4)) < ANIO_MINIMO);
  }

  private consultarSiLasFechasEstanListas(): void {
    const desde = this.filtroFechaDesde();
    const hasta = this.filtroFechaHasta();

    if (this.fechaIncompleta(desde) || this.fechaIncompleta(hasta)) {
      this.avisoPeriodo.set(null);
      return;
    }

    if (desde && hasta && desde > hasta) {
      this.avisoPeriodo.set('La fecha hasta es anterior a la fecha desde.');
      return;
    }

    this.avisoPeriodo.set(null);
    this.pagina.set(1);
    this.recargar$.next(ESPERA_FECHA_MS);
  }

  cambiarFiltroDias(valor: number | null): void {
    this.filtroDias.set(valor);
    this.pagina.set(1);
    this.recargar$.next(0);
  }

  limpiarFiltrosPeriodo(): void {
    this.filtroFechaDesde.set('');
    this.filtroFechaHasta.set('');
    this.filtroDias.set(null);
    this.avisoPeriodo.set(null);
    this.pagina.set(1);
    this.recargar$.next(0);
  }

  hayFiltrosPeriodo = computed(
    () => !!this.filtroFechaDesde() || !!this.filtroFechaHasta() || this.filtroDias() !== null,
  );

  seleccionarEmpresa(empresa: Empresa): void {
    this.filtroEmpresaId.set(empresa.id);
    this.pagina.set(1);
    this.cargarChoferes();
  }

  limpiarEmpresa(): void {
    this.filtroEmpresaId.set('');
    this.pagina.set(1);
    this.cargarChoferes();
  }

  cargarChoferes(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.empresasService.listar(1, 1000).subscribe({
      next: (respuesta) => this.empresas.set(respuesta.items),
    });

    this.choferesService
      .listar(this.pagina(), this.tamanoPagina, {
        busqueda: this.busqueda() || undefined,
        empresa_id: this.filtroEmpresaId() || undefined,
        dias: this.filtroDias() ?? undefined,
        fecha_desde: this.filtroFechaDesde() || undefined,
        fecha_hasta: this.filtroFechaHasta() || undefined,
        incluir_estadisticas: true,
      })
      .subscribe({
        next: (respuesta) => {
          this.choferes.set(respuesta.items);
          this.total.set(respuesta.total);
          this.totalPaginas.set(respuesta.total_paginas);
          this.periodo.set(respuesta.periodo);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar los choferes');
          this.cargando.set(false);
        },
      });
  }

  cambiarPagina(nueva: number): void {
    this.pagina.set(nueva);
    this.cargarChoferes();
  }

  mostrarBotonLicencia(chofer: Chofer): boolean {
    return chofer.estado === 'disponible' || chofer.estado === 'licencia';
  }

  textoBotonLicencia(chofer: Chofer): string {
    return chofer.estado === 'disponible' ? 'Licencia' : 'Disponible';
  }

  claseBotonLicencia(chofer: Chofer): string {
    return chofer.estado === 'disponible' ? 'btn-mini-aviso' : 'btn-mini-exito';
  }

  toggleLicencia(chofer: Chofer): void {
    const nuevoEstado = chofer.estado === 'disponible' ? 'licencia' : 'disponible';
    this.choferesService.cambiarEstado(chofer.id, nuevoEstado).subscribe({
      next: () => this.cargarChoferes(),
      error: () => this.error.set('No se pudo cambiar el estado'),
    });
  }

  abrirMiniModalEmpresa(): void {
    this.error.set(null);
    this.miniModalEmpresaAbierto.set(true);
  }

  onEmpresaCreada(nombre: string): void {
    this.empresasService.crear({ nombre }).subscribe({
      next: (empresa) => {
        this.empresas.update((lista) => [...lista, empresa]);
        this.nuevoChofer.empresa_id = empresa.id;
        this.edicionChofer.empresa_id = empresa.id;
        this.miniModalEmpresaAbierto.set(false);
      },
      error: () => this.error.set('No se pudo crear la empresa'),
    });
  }

  cerrarMiniModalEmpresa(): void {
    this.miniModalEmpresaAbierto.set(false);
  }

  // ---- Observaciones ----

  abrirObservacionesMes(): void {
    this.modalObservacionesMesAbierto.set(true);
  }

  cerrarObservacionesMes(): void {
    this.modalObservacionesMesAbierto.set(false);
  }

  abrirObservaciones(chofer: Chofer): void {
    this.choferObsSeleccionado.set(chofer);
    this.observacionActual = '';
    this.error.set(null);
    this.exitoObs.set(null);
    this.modalObservacionesAbierto.set(true);

    this.observacionesService.listar(chofer.id).subscribe({
      next: (lista) => {
        this.choferObservaciones.set(lista);
        const hoy = new Date();
        const actual = lista.find(
          (o) => o.mes === hoy.getMonth() + 1 && o.anio === hoy.getFullYear(),
        );
        if (actual) {
          this.observacionActual = actual.observacion;
        }
      },
    });
  }

  cerrarObservaciones(): void {
    this.modalObservacionesAbierto.set(false);
    this.choferObsSeleccionado.set(null);
    this.choferObservaciones.set([]);
    this.observacionActual = '';
    this.exitoObs.set(null);
  }

  getNombreMes(mes: number): string {
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return meses[mes - 1] || '';
  }

  historicoObservaciones(): Observacion[] {
    const hoy = new Date();
    return this.choferObservaciones().filter(
      (o) => !(o.mes === hoy.getMonth() + 1 && o.anio === hoy.getFullYear()),
    );
  }

  tieneHistorial(): boolean {
    return this.historicoObservaciones().length > 0;
  }

  guardarObservacion(): void {
    const chofer = this.choferObsSeleccionado();
    if (!chofer || !this.observacionActual.trim()) return;

    this.observacionesService
      .guardar(chofer.id, { observacion: this.observacionActual })
      .subscribe({
        next: () => {
          this.exitoObs.set('Observación guardada');
          this.error.set(null);
          setTimeout(() => this.exitoObs.set(null), 2500);
          this.observacionesService.listar(chofer.id).subscribe({
            next: (lista) => {
              this.choferObservaciones.set(lista);
              const hoy = new Date();
              const actual = lista.find(
                (o) => o.mes === hoy.getMonth() + 1 && o.anio === hoy.getFullYear(),
              );
              this.observacionActual = actual ? actual.observacion : '';
            },
          });
        },
        error: () => this.error.set('No se pudo guardar la observación'),
      });
  }
}
