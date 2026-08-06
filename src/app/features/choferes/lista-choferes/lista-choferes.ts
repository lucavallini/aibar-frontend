import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { ChoferesService } from '../../../core/services/choferes.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import { Chofer, ChoferCreate, ChoferDetalle } from '../../../core/models/chofer.model';
import { Empresa } from '../../../core/models/empresa.model';
import { ViajesService } from '../../../core/services/viajes.service';
import { RendimientoCombustible } from '../../../core/models/viaje.model';
import { AuthService } from '../../../core/services/auth.service';
import { TablaPaginada } from '../../../shared/components/tabla-paginada/tabla-paginada';
import { Confirmar } from '../../../shared/components/confirmar/confirmar';
import { FormsModule } from '@angular/forms';
import { ObservacionesService } from '../../../core/services/observaciones.service';
import { Observacion, ObservacionCreate } from '../../../core/models/observacion.model';
import { MiniModalEmpresa } from '../../../shared/components/mini-modal-empresa/mini-modal-empresa';
import { PaginaHeader } from '../../../shared/components/pagina-header/pagina-header';
import { EstadoCarga } from '../../../shared/components/estado-carga/estado-carga';
import { SelectEmpresa } from '../../../shared/components/select-empresa/select-empresa';
import { Modal } from '../../../shared/components/modal/modal';
import { labelEstadoChofer } from '../../../core/utils/estado-labels';
import { obtenerNombreEmpresa } from '../../../core/utils/entidades';

@Component({
  selector: 'app-lista-choferes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TablaPaginada, Confirmar, FormsModule, MiniModalEmpresa, PaginaHeader, EstadoCarga, SelectEmpresa, Modal],
  templateUrl: './lista-choferes.html',
  styleUrl: './lista-choferes.css'
})
export class ListaChoferesComponent implements OnInit {
  choferes = signal<Chofer[]>([]);
  empresas = signal<Empresa[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');

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

  readonly = computed(() => this.authService.getRol() === 'aibar');

  constructor(
    private choferesService: ChoferesService,
    private empresasService: EmpresasService,
    private viajesService: ViajesService,
    private authService: AuthService,
    private observacionesService: ObservacionesService
  ) {}

  ngOnInit(): void {
    this.cargarChoferes();
  }

  nombreEmpresa(empresaId: string | null): string {
    return obtenerNombreEmpresa(this.empresas(), empresaId);
  }

  labelEstadoChofer = labelEstadoChofer;

  formularioVacioAlta(): ChoferCreate {
    return { nombre_completo: '', dni: '', telefono: '', camion_id: undefined, empresa_id: undefined };
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
      error: () => this.error.set('No se pudo crear el chofer')
    });
  }

  abrirDetalle(chofer: Chofer): void {
    this.rendimiento.set(null);
    this.choferesService.obtenerDetalle(chofer.id).subscribe({
      next: (detalle) => {
        this.choferDetalle.set(detalle);
        this.modalDetalleAbierto.set(true);
      },
      error: () => this.error.set('No se pudo cargar el detalle del chofer')
    });
    this.viajesService.rendimientoCombustible(chofer.id).subscribe({
      next: (r) => this.rendimiento.set(r)
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
      error: () => this.error.set('No se pudo editar el chofer')
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
      error: () => this.error.set('No se pudo dar de baja el chofer')
    });
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
    this.cargarChoferes();
  }

  cargarChoferes(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.empresasService.listar(1, 1000).subscribe({
      next: (respuesta) => this.empresas.set(respuesta.items)
    });

    this.choferesService.listar(this.pagina(), this.tamanoPagina, { busqueda: this.busqueda() || undefined, incluir_kms_mes: true }).subscribe({
      next: (respuesta) => {
        this.choferes.set(respuesta.items);
        this.total.set(respuesta.total);
        this.totalPaginas.set(respuesta.total_paginas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los choferes');
        this.cargando.set(false);
      }
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
      error: () => this.error.set('No se pudo cambiar el estado')
    });
  }

  cerrarSesion(): void {
    this.authService.logout();
  }

  abrirMiniModalEmpresa(): void {
    this.error.set(null);
    this.miniModalEmpresaAbierto.set(true);
  }

  onEmpresaCreada(nombre: string): void {
    this.empresasService.crear({ nombre }).subscribe({
      next: (empresa) => {
        this.empresas.update(lista => [...lista, empresa]);
        this.nuevoChofer.empresa_id = empresa.id;
        this.edicionChofer.empresa_id = empresa.id;
        this.miniModalEmpresaAbierto.set(false);
      },
      error: () => this.error.set('No se pudo crear la empresa')
    });
  }

  cerrarMiniModalEmpresa(): void {
    this.miniModalEmpresaAbierto.set(false);
  }

  // ---- Observaciones ----

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
        const actual = lista.find(o => o.mes === hoy.getMonth() + 1 && o.anio === hoy.getFullYear());
        if (actual) {
          this.observacionActual = actual.observacion;
        }
      }
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
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes - 1] || '';
  }

  historicoObservaciones(): Observacion[] {
    const hoy = new Date();
    return this.choferObservaciones().filter(
      o => !(o.mes === hoy.getMonth() + 1 && o.anio === hoy.getFullYear())
    );
  }

  tieneHistorial(): boolean {
    return this.historicoObservaciones().length > 0;
  }

  guardarObservacion(): void {
    const chofer = this.choferObsSeleccionado();
    if (!chofer || !this.observacionActual.trim()) return;

    this.observacionesService.guardar(chofer.id, { observacion: this.observacionActual }).subscribe({
      next: () => {
        this.exitoObs.set('Observación guardada');
        this.error.set(null);
        setTimeout(() => this.exitoObs.set(null), 2500);
        this.observacionesService.listar(chofer.id).subscribe({
          next: (lista) => {
            this.choferObservaciones.set(lista);
            const hoy = new Date();
            const actual = lista.find(o => o.mes === hoy.getMonth() + 1 && o.anio === hoy.getFullYear());
            this.observacionActual = actual ? actual.observacion : '';
          }
        });
      },
      error: () => this.error.set('No se pudo guardar la observación')
    });
  }
}
