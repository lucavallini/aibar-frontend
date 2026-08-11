import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CamionesService } from '../../../core/services/camiones.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import { ChoferesService } from '../../../core/services/choferes.service';
import { AcopladosService } from '../../../core/services/acoplado.service';
import { AuthService } from '../../../core/services/auth.service';
import { Camion, CamionCreate } from '../../../core/models/camion.model';
import { Empresa } from '../../../core/models/empresa.model';
import { Chofer } from '../../../core/models/chofer.model';
import { Acoplado } from '../../../core/models/acoplado.model';
import { TablaPaginada } from '../../../shared/components/tabla-paginada/tabla-paginada';
import { Confirmar } from '../../../shared/components/confirmar/confirmar';
import { MiniModalEmpresa } from '../../../shared/components/mini-modal-empresa/mini-modal-empresa';
import { PaginaHeader } from '../../../shared/components/pagina-header/pagina-header';
import { EstadoCarga } from '../../../shared/components/estado-carga/estado-carga';
import { SelectEmpresa } from '../../../shared/components/select-empresa/select-empresa';
import { BuscadorSelect } from '../../../shared/components/buscador-select/buscador-select';
import { Modal } from '../../../shared/components/modal/modal';
import { labelEstadoCamion } from '../../../core/utils/estado-labels';
import { obtenerNombreEmpresa } from '../../../core/utils/entidades';

@Component({
  selector: 'app-lista-camiones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TablaPaginada, Confirmar, MiniModalEmpresa, PaginaHeader, EstadoCarga, SelectEmpresa, BuscadorSelect, Modal],
  templateUrl: './lista-camiones.html',
})
export class ListaCamiones implements OnInit {
  camiones = signal<Camion[]>([]);
  empresas = signal<Empresa[]>([]);
  choferes = signal<Chofer[]>([]);
  acoplados = signal<Acoplado[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');
  filtroEmpresaId = signal('');
  filtroChoferId = signal('');
  filtroAcopladoId = signal('');

  pagina = signal(1);
  totalPaginas = signal(1);
  total = signal(0);
  tamanoPagina = 20;

  modalAbierto = signal(false);
  nuevoCamion: CamionCreate = this.formularioVacio();

  modalEditarAbierto = signal(false);
  modalBajaAbierto = signal(false);
  camionSeleccionado = signal<Camion | null>(null);
  edicionCamion: Partial<CamionCreate> = {};

  miniModalEmpresaAbierto = signal(false);

  modalAsignarAbierto = signal(false);
  asignacionCamion = signal<Camion | null>(null);
  asignarChoferId = signal<string | null>(null);
  asignarAcopladoId = signal<string | null>(null);

  readonly = computed(() => this.authService.esSoloLectura());

  constructor(
    private camionesService: CamionesService,
    private empresasService: EmpresasService,
    private choferesService: ChoferesService,
    private acopladosService: AcopladosService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarAsignados();
    this.cargarCamiones();
  }

  cargarAsignados(): void {
    this.choferesService.listar(1, 1000, { activos_only: false }).subscribe({
      next: (respuesta) => this.choferes.set(respuesta.items)
    });
    this.acopladosService.listar(1, 1000).subscribe({
      next: (respuesta) => this.acoplados.set(respuesta.items)
    });
  }

  nombreEmpresa(empresaId: string | null): string {
    return obtenerNombreEmpresa(this.empresas(), empresaId);
  }

  labelEstadoCamion = labelEstadoCamion;

  abrirEditar(camion: Camion): void {
    this.camionSeleccionado.set(camion);
    this.edicionCamion = {
      marca: camion.marca ?? undefined,
      modelo: camion.modelo ?? undefined,
      anio: camion.anio ?? undefined,
      tipo: camion.tipo ?? undefined,
      empresa_id: camion.empresa_id ?? undefined,
    };
    this.error.set(null);
    this.modalEditarAbierto.set(true);
  }

  cerrarEditar(): void {
    this.modalEditarAbierto.set(false);
    this.camionSeleccionado.set(null);
  }

  confirmarEdicion(): void {
    const camion = this.camionSeleccionado();
    if (!camion) return;

    this.camionesService.actualizar(camion.id, this.edicionCamion).subscribe({
      next: () => {
        this.cerrarEditar();
        this.cargarCamiones();
      },
      error: () => this.error.set('No se pudo editar el camión')
    });
  }

  abrirBaja(camion: Camion): void {
    this.camionSeleccionado.set(camion);
    this.modalBajaAbierto.set(true);
  }

  cerrarBaja(): void {
    this.modalBajaAbierto.set(false);
    this.camionSeleccionado.set(null);
  }

  confirmarBaja(): void {
    const camion = this.camionSeleccionado();
    if (!camion) return;

    this.camionesService.darDeBaja(camion.id).subscribe({
      next: () => {
        this.cerrarBaja();
        this.cargarCamiones();
      },
      error: () => this.error.set('No se pudo dar de baja el camión')
    });
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
    this.cargarCamiones();
  }

  seleccionarEmpresa(empresa: Empresa): void {
    this.filtroEmpresaId.set(empresa.id);
    this.pagina.set(1);
    this.cargarCamiones();
  }

  limpiarEmpresa(): void {
    this.filtroEmpresaId.set('');
    this.pagina.set(1);
    this.cargarCamiones();
  }

  seleccionarFiltroChofer(item: Chofer): void {
    this.filtroChoferId.set(item.id);
    this.pagina.set(1);
    this.cargarCamiones();
  }

  limpiarFiltroChofer(): void {
    this.filtroChoferId.set('');
    this.pagina.set(1);
    this.cargarCamiones();
  }

  seleccionarFiltroAcoplado(item: Acoplado): void {
    this.filtroAcopladoId.set(item.id);
    this.pagina.set(1);
    this.cargarCamiones();
  }

  limpiarFiltroAcoplado(): void {
    this.filtroAcopladoId.set('');
    this.pagina.set(1);
    this.cargarCamiones();
  }

  cargarCamiones(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.empresasService.listar(1, 1000).subscribe({
      next: (respuesta) => this.empresas.set(respuesta.items)
    });

    this.camionesService.listar(this.pagina(), this.tamanoPagina, {
      busqueda: this.busqueda() || undefined,
      empresa_id: this.filtroEmpresaId() || undefined,
      chofer_id: this.filtroChoferId() || undefined,
      acoplado_id: this.filtroAcopladoId() || undefined,
    }).subscribe({
      next: (respuesta) => {
        this.camiones.set(respuesta.items);
        this.total.set(respuesta.total);
        this.totalPaginas.set(respuesta.total_paginas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los camiones');
        this.cargando.set(false);
      }
    });
  }

  cambiarPagina(nueva: number): void {
    this.pagina.set(nueva);
    this.cargarCamiones();
  }

  choferAsignado(camion: Camion): string {
    const chofer = this.choferes().find(c => c.camion_id === camion.id);
    return chofer ? chofer.nombre_completo : '';
  }

  acopladoPatente(camion: Camion): string {
    const acoplado = this.acoplados().find(a => a.id === camion.acoplado_id);
    return acoplado ? acoplado.patente : '';
  }

  abrirAsignar(camion: Camion): void {
    const chofer = this.choferes().find(c => c.camion_id === camion.id);
    this.asignacionCamion.set(camion);
    this.asignarChoferId.set(chofer ? chofer.id : null);
    this.asignarAcopladoId.set(camion.acoplado_id);
    this.error.set(null);
    this.modalAsignarAbierto.set(true);
  }

  cerrarAsignar(): void {
    this.modalAsignarAbierto.set(false);
    this.asignacionCamion.set(null);
    this.asignarChoferId.set(null);
    this.asignarAcopladoId.set(null);
  }

  seleccionarChoferAsignacion(item: Chofer): void {
    this.asignarChoferId.set(item.id);
  }

  limpiarChoferAsignacion(): void {
    this.asignarChoferId.set(null);
  }

  seleccionarAcopladoAsignacion(item: Acoplado): void {
    this.asignarAcopladoId.set(item.id);
  }

  limpiarAcopladoAsignacion(): void {
    this.asignarAcopladoId.set(null);
  }

  confirmarAsignar(): void {
    const camion = this.asignacionCamion();
    if (!camion) return;

    this.camionesService.asignarAsociados(camion.id, this.asignarChoferId(), this.asignarAcopladoId()).subscribe({
      next: () => {
        this.cerrarAsignar();
        this.cargarAsignados();
        this.cargarCamiones();
      },
      error: (err) => {
        this.error.set(err.status === 409 ? 'No se puede reasignar: el camión o el chofer tienen un viaje pendiente o en curso' : 'No se pudo asignar');
      }
    });
  }

  formularioVacio(): CamionCreate {
    return { patente: '', marca: '', modelo: '', anio: undefined, tipo: '', empresa_id: undefined };
  }

  abrirModal(): void {
    this.nuevoCamion = this.formularioVacio();
    this.error.set(null);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  confirmarAlta(): void {
    if (!this.nuevoCamion.patente.trim()) {
      this.error.set('La patente es obligatoria');
      return;
    }

    this.camionesService.crear(this.nuevoCamion).subscribe({
      next: () => {
        this.cerrarModal();
        this.pagina.set(1);
        this.cargarCamiones();
      },
      error: (err) => {
        if (err.status === 400) {
          this.error.set('Ya existe un camión con esa patente');
        } else {
          this.error.set('No se pudo crear el camión');
        }
      }
    });
  }

  abrirMiniModalEmpresa(): void {
    this.error.set(null);
    this.miniModalEmpresaAbierto.set(true);
  }

  onEmpresaCreada(nombre: string): void {
    this.empresasService.crear({ nombre }).subscribe({
      next: (empresa) => {
        this.empresas.update(lista => [...lista, empresa]);
        this.nuevoCamion.empresa_id = empresa.id;
        this.miniModalEmpresaAbierto.set(false);
      },
      error: () => this.error.set('No se pudo crear la empresa')
    });
  }

  cerrarMiniModalEmpresa(): void {
    this.miniModalEmpresaAbierto.set(false);
  }
}
