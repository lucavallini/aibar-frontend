import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { BuscadorSelect } from '../../../shared/components/buscador-select/buscador-select';
import { FlotaItem } from '../../../shared/components/flota-item/flota-item';
import { Modal } from '../../../shared/components/modal/modal';
import { Chofer } from '../../../core/models/chofer.model';
import { Camion } from '../../../core/models/camion.model';
import { Acoplado } from '../../../core/models/acoplado.model';
import { Empresa } from '../../../core/models/empresa.model';
import { ChoferesService } from '../../../core/services/choferes.service';
import { CamionesService } from '../../../core/services/camiones.service';
import { AcopladosService } from '../../../core/services/acoplado.service';
import { labelEstadoChofer, labelEstadoCamion, labelEstadoAcoplado } from '../../../core/utils/estado-labels';
import { obtenerNombrePorId } from '../../../core/utils/entidades';

type FiltroDisponibilidad = 'todos' | 'disponibles' | 'no_disponibles';
type TipoFlota = 'chofer' | 'camion' | 'acoplado';
type VistaFlota = 'choferes' | 'chasis' | 'acoplados';

@Component({
  selector: 'app-estado-flota',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, BuscadorSelect, FlotaItem, Modal],
  templateUrl: './estado-flota.html',
  styleUrl: './estado-flota.css'
})
export class EstadoFlota {
  choferes = input<Chofer[]>([]);
  camiones = input<Camion[]>([]);
  acoplados = input<Acoplado[]>([]);
  empresas = input<Empresa[]>([]);
  readonly = input(false);

  cambioEstado = output<void>();

  vista = signal<VistaFlota>('choferes');
  filtroEstado = signal<FiltroDisponibilidad>('todos');
  filtroEmpresaId = signal('');
  filtroChoferId = signal('');
  filtroCamionId = signal('');
  filtroAcopladoId = signal('');

  verTodosChoferes = signal(false);
  verTodosCamiones = signal(false);
  verTodosAcoplados = signal(false);

  opcionesEstado: { label: string; valor: FiltroDisponibilidad }[] = [
    { label: 'Todos', valor: 'todos' },
    { label: 'Disponibles', valor: 'disponibles' },
    { label: 'No disponibles', valor: 'no_disponibles' },
  ];

  modalMotivo = signal<{ tipo: TipoFlota; id: string; nombre: string } | null>(null);
  motivo = signal('');
  cargando = signal(false);
  error = signal<string | null>(null);

  constructor(
    private choferesService: ChoferesService,
    private camionesService: CamionesService,
    private acopladosService: AcopladosService
  ) {}

  private empresasPorId = computed(() => {
    const mapa: Record<string, string> = {};
    this.empresas().forEach(e => mapa[e.id] = e.nombre);
    return mapa;
  });

  choferesFiltrados = computed(() => {
    const empresa = this.filtroEmpresaId();
    const choferId = this.filtroChoferId();
    return this.choferes().filter(c => {
      if (empresa && c.empresa_id !== empresa) return false;
      if (choferId && c.id !== choferId) return false;
      return this.coincideFiltroEstado(c.estado);
    });
  });

  camionesFiltrados = computed(() => {
    const empresa = this.filtroEmpresaId();
    const camionId = this.filtroCamionId();
    return this.camiones().filter(c => {
      if (empresa && c.empresa_id !== empresa) return false;
      if (camionId && c.id !== camionId) return false;
      return this.coincideFiltroEstado(c.estado);
    });
  });

  acopladosFiltrados = computed(() => {
    const empresa = this.filtroEmpresaId();
    const acopladoId = this.filtroAcopladoId();
    return this.acoplados().filter(a => {
      if (empresa && a.empresa_id !== empresa) return false;
      if (acopladoId && a.id !== acopladoId) return false;
      return this.coincideFiltroEstado(a.estado);
    });
  });

  mostrarListaChoferes = computed(() => this.filtroChoferId() !== '' || this.verTodosChoferes());
  mostrarListaCamiones = computed(() => this.filtroCamionId() !== '' || this.verTodosCamiones());
  mostrarListaAcoplados = computed(() => this.filtroAcopladoId() !== '' || this.verTodosAcoplados());

  private coincideFiltroEstado(estado: string): boolean {
    const filtro = this.filtroEstado();
    if (filtro === 'todos') return true;
    return filtro === 'disponibles' ? estado === 'disponible' : estado !== 'disponible';
  }

  nombreEmpresa(empresaId: string | null): string {
    return obtenerNombrePorId(this.empresasPorId(), empresaId, '');
  }

  cambiarVista(vista: VistaFlota): void {
    this.vista.set(vista);
  }

  labelEstadoChofer = labelEstadoChofer;
  labelEstadoCamion = labelEstadoCamion;
  labelEstadoAcoplado = labelEstadoAcoplado;

  cambiarFiltroEstado(valor: FiltroDisponibilidad): void {
    this.filtroEstado.set(valor);
  }

  cambiarFiltroEmpresa(empresa: Empresa): void {
    this.filtroEmpresaId.set(empresa.id);
  }

  limpiarFiltroEmpresa(): void {
    this.filtroEmpresaId.set('');
  }

  cambiarFiltroChofer(chofer: Chofer): void {
    this.filtroChoferId.set(chofer.id);
    this.verTodosChoferes.set(false);
  }

  limpiarFiltroChofer(): void {
    this.filtroChoferId.set('');
    this.verTodosChoferes.set(true);
  }

  cambiarFiltroCamion(camion: Camion): void {
    this.filtroCamionId.set(camion.id);
    this.verTodosCamiones.set(false);
  }

  limpiarFiltroCamion(): void {
    this.filtroCamionId.set('');
    this.verTodosCamiones.set(true);
  }

  cambiarFiltroAcoplado(acoplado: Acoplado): void {
    this.filtroAcopladoId.set(acoplado.id);
    this.verTodosAcoplados.set(false);
  }

  limpiarFiltroAcoplado(): void {
    this.filtroAcopladoId.set('');
    this.verTodosAcoplados.set(true);
  }

  abrirMotivo(tipo: TipoFlota, item: Chofer | Camion | Acoplado): void {
    const nombre = 'nombre_completo' in item ? item.nombre_completo : item.patente;
    this.modalMotivo.set({ tipo, id: item.id, nombre });
    this.motivo.set('');
    this.error.set(null);
  }

  cerrarMotivo(): void {
    this.modalMotivo.set(null);
  }

  confirmarNoDisponible(): void {
    const modal = this.modalMotivo();
    if (!modal) return;
    const motivo = this.motivo().trim();
    if (!motivo) {
      this.error.set('Completá el motivo');
      return;
    }

    this.cargando.set(true);
    const req: Observable<Chofer | Camion | Acoplado> = modal.tipo === 'chofer'
      ? this.choferesService.cambiarEstado(modal.id, 'no_disponible', motivo)
      : modal.tipo === 'camion'
        ? this.camionesService.cambiarEstado(modal.id, 'no_disponible', motivo)
        : this.acopladosService.cambiarEstado(modal.id, 'no_disponible', motivo);

    req.subscribe({
      next: () => {
        this.cargando.set(false);
        this.cerrarMotivo();
        this.cambioEstado.emit();
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudo actualizar el estado');
      }
    });
  }

  marcarDisponible(tipo: TipoFlota, item: Chofer | Camion | Acoplado): void {
    this.error.set(null);
    this.cargando.set(true);
    const req: Observable<Chofer | Camion | Acoplado> = tipo === 'chofer'
      ? this.choferesService.cambiarEstado(item.id, 'disponible')
      : tipo === 'camion'
        ? this.camionesService.cambiarEstado(item.id, 'disponible')
        : this.acopladosService.cambiarEstado(item.id, 'disponible');

    req.subscribe({
      next: () => {
        this.cargando.set(false);
        this.cambioEstado.emit();
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudo actualizar el estado');
      }
    });
  }
}
