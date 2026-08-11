import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ViajesService } from '../../../core/services/viajes.service';
import { ChoferesService } from '../../../core/services/choferes.service';
import { CamionesService } from '../../../core/services/camiones.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { EmpresasService } from '../../../core/services/empresas.service';
import { AcopladosService } from '../../../core/services/acoplado.service';
import { Viaje, ViajeCreate, ViajeReanudar, ViajeFinalizar } from '../../../core/models/viaje.model';
import { Chofer } from '../../../core/models/chofer.model';
import { Camion } from '../../../core/models/camion.model';
import { Acoplado } from '../../../core/models/acoplado.model';
import { Empresa } from '../../../core/models/empresa.model';

import { Paginacion } from '../../../shared/components/paginacion/paginacion';
import { BuscadorSelect } from '../../../shared/components/buscador-select/buscador-select';
import { ModalFinalizarViaje } from '../../../shared/components/modal-finalizar-viaje/modal-finalizar-viaje';
import { ModalCancelarViaje } from '../../../shared/components/modal-cancelar-viaje/modal-cancelar-viaje';
import { Confirmar } from '../../../shared/components/confirmar/confirmar';
import { EstadoFlota } from '../estado-flota/estado-flota';
import { TramoViaje } from '../../../shared/components/tramo-viaje/tramo-viaje';
import { PaginaHeader } from '../../../shared/components/pagina-header/pagina-header';
import { EstadoCarga } from '../../../shared/components/estado-carga/estado-carga';
import { Modal } from '../../../shared/components/modal/modal';
import { AuthService } from '../../../core/services/auth.service';
import { obtenerNombrePorId } from '../../../core/utils/entidades';

type FiltroEstado = 'todos' | 'pendiente' | 'en_curso' | 'finalizado' | 'cancelado';
type AccionModal = 'finalizar' | 'cancelar' | 'nuevo' | 'vuelta' | 'reanudar' | null;

@Component({
  selector: 'app-lista-viajes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Paginacion, BuscadorSelect, ModalFinalizarViaje, ModalCancelarViaje, Confirmar, EstadoFlota, TramoViaje, PaginaHeader, EstadoCarga, Modal],
  templateUrl: './lista-viajes.html',
  styleUrl: './lista-viajes.css'
})
export class ListaViajes implements OnInit {
  viajes = signal<Viaje[]>([]);
  choferes = signal<Chofer[]>([]);
  choferesPorId = signal<Record<string, string>>({});
  camiones = signal<Camion[]>([]);
  camionesPorId = signal<Record<string, Camion>>({});
  acopladosList = signal<Acoplado[]>([]);
  acopladosPorId = signal<Record<string, Acoplado>>({});
  usuariosPorId = signal<Record<string, string>>({});
  filtroEstado = signal<FiltroEstado>('todos');
  filtroChoferId = signal<string>('');
  filtroPatente = signal('');
  filtroDias = signal<number | null>(null);
  filtroFechaDesde = signal('');
  filtroFechaHasta = signal('');
  filtroEmpresaId = signal('');
  empresas = signal<Empresa[]>([]);

  cargando = signal(true);
  error = signal<string | null>(null);

  viajeSeleccionado = signal<Viaje | null>(null);
  accionModal = signal<AccionModal>(null);

  nuevoViaje: ViajeCreate = this.formularioVacio();
  viajeOriginalId = '';
  soloIdaForzado = signal(false);
  modalSinVuelta = signal(false);
  viajeSinVuelta = signal<Viaje | null>(null);

  pagina = signal(1);
  totalPaginas = signal(1);
  total = signal(0);
  tamanoPagina = 20;

  opcionesDias: { label: string; valor: number | null }[] = [
    { label: 'Todos', valor: null },
    { label: '15 días', valor: 15 },
    { label: '30 días', valor: 30 },
  ];

  readonly = computed(() => this.authService.esSoloLectura());

  filtrosEstado: { label: string; valor: FiltroEstado }[] = [
    { label: 'Todos', valor: 'todos' },
    { label: 'Esperando iniciar viaje', valor: 'pendiente' },
    { label: 'En curso', valor: 'en_curso' },
    { label: 'Finalizados', valor: 'finalizado' },
    { label: 'Cancelados', valor: 'cancelado' },
  ];

  constructor(
    private viajesService: ViajesService,
    private choferesService: ChoferesService,
    private camionesService: CamionesService,
    private usuariosService: UsuariosService,
    private empresasService: EmpresasService,
    private acopladosService: AcopladosService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargando.set(true);

    this.empresasService.listar(1, 1000).subscribe({
      next: (respuesta) => this.empresas.set(respuesta.items)
    });

    this.choferesService.listar(1, 1000, { activos_only: false }).subscribe({
      next: (respuesta) => {
        const mapa: Record<string, string> = {};
        respuesta.items.forEach((c: Chofer) => mapa[c.id] = c.nombre_completo);
        this.choferesPorId.set(mapa);
        this.choferes.set(respuesta.items);
      }
    });

    this.usuariosService.listar(1, 200, undefined).subscribe({
      next: (respuesta) => {
        const mapa: Record<string, string> = {};
        respuesta.items.forEach((u) => mapa[u.id] = u.nombre_completo);
        this.usuariosPorId.set(mapa);
      }
    });

    this.acopladosService.listar(1, 1000, { activos_only: false }).subscribe({
      next: (respuesta) => {
        const mapa: Record<string, Acoplado> = {};
        respuesta.items.forEach((a) => mapa[a.id] = a);
        this.acopladosPorId.set(mapa);
        this.acopladosList.set(respuesta.items);
      }
    });

    this.camionesService.listar(1, 1000, { activos_only: false }).subscribe({
      next: (respuesta) => {
        const mapa: Record<string, Camion> = {};
        respuesta.items.forEach((c) => mapa[c.id] = c);
        this.camionesPorId.set(mapa);
        this.camiones.set(respuesta.items);
        this.cargarViajes();
      }
    });
  }

  cargarViajes(): void {
    this.cargando.set(true);
    this.error.set(null);

    const choferId = this.filtroChoferId() || undefined;
    const estado = this.filtroEstado() === 'todos' ? undefined : this.filtroEstado();
    const dias = this.filtroDias() || undefined;
    const patente = this.filtroPatente() || undefined;
    const fecha_desde = this.filtroFechaDesde() || undefined;
    const fecha_hasta = this.filtroFechaHasta() || undefined;
    const empresa_id = this.filtroEmpresaId() || undefined;

    this.viajesService.listar(this.pagina(), this.tamanoPagina, { chofer_id: choferId, estado, dias, patente, fecha_desde, fecha_hasta, empresa_id }).subscribe({
      next: (respuesta) => {
        this.viajes.set(respuesta.items);
        this.total.set(respuesta.total);
        this.totalPaginas.set(respuesta.total_paginas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los viajes');
        this.cargando.set(false);
      }
    });
  }

  cambiarPagina(nueva: number): void {
    this.pagina.set(nueva);
    this.cargarViajes();
  }

  nombreChofer(choferId: string): string {
    return obtenerNombrePorId(this.choferesPorId(), choferId);
  }

  nombreUsuario(usuarioId: string): string {
    return obtenerNombrePorId(this.usuariosPorId(), usuarioId);
  }

  cambiarFiltroEstado(valor: FiltroEstado): void {
    this.filtroEstado.set(valor);
    this.pagina.set(1);
    this.cargarViajes();
  }

  cambiarFiltroDias(valor: number | null): void {
    this.filtroDias.set(valor);
    this.pagina.set(1);
    this.cargarViajes();
  }

  cambiarFiltroChoferId(id: string): void {
    this.filtroChoferId.set(id);
    this.pagina.set(1);
    this.cargarViajes();
  }

  limpiarFiltroChoferId(): void {
    this.filtroChoferId.set('');
    this.pagina.set(1);
    this.cargarViajes();
  }

  cambiarFiltroPatente(patente: string): void {
    this.filtroPatente.set(patente);
    this.pagina.set(1);
    this.cargarViajes();
  }

  limpiarFiltroPatente(): void {
    this.filtroPatente.set('');
    this.pagina.set(1);
    this.cargarViajes();
  }

  cambiarFiltroFechaDesde(valor: string): void {
    this.filtroFechaDesde.set(valor);
    this.pagina.set(1);
    this.cargarViajes();
  }

  cambiarFiltroFechaHasta(valor: string): void {
    this.filtroFechaHasta.set(valor);
    this.pagina.set(1);
    this.cargarViajes();
  }

  cambiarFiltroEmpresaId(id: string): void {
    this.filtroEmpresaId.set(id);
    this.pagina.set(1);
    this.cargarViajes();
  }

  limpiarFiltroEmpresaId(): void {
    this.filtroEmpresaId.set('');
    this.pagina.set(1);
    this.cargarViajes();
  }

  nombreEmpresaChofer(choferId: string): string {
    const chofer = this.choferes().find(c => c.id === choferId);
    if (!chofer?.empresa_id) return '';
    const empresa = this.empresas().find(e => e.id === chofer.empresa_id);
    return empresa ? empresa.nombre : '';
  }

  recargarFlota(): void {
    this.choferesService.listar(1, 1000, { activos_only: false }).subscribe({
      next: (respuesta) => {
        const mapa: Record<string, string> = {};
        respuesta.items.forEach((c: Chofer) => mapa[c.id] = c.nombre_completo);
        this.choferesPorId.set(mapa);
        this.choferes.set(respuesta.items);
      }
    });

    this.camionesService.listar(1, 1000, { activos_only: false }).subscribe({
      next: (respuesta) => {
        const mapa: Record<string, Camion> = {};
        respuesta.items.forEach((c) => mapa[c.id] = c);
        this.camionesPorId.set(mapa);
        this.camiones.set(respuesta.items);
      }
    });

    this.acopladosService.listar(1, 1000, { activos_only: false }).subscribe({
      next: (respuesta) => {
        const mapa: Record<string, Acoplado> = {};
        respuesta.items.forEach((a) => mapa[a.id] = a);
        this.acopladosPorId.set(mapa);
        this.acopladosList.set(respuesta.items);
      }
    });
  }

  calcularDias(inicio: string, fin: string | null): number | null {
    if (!inicio || !fin) return null;
    const d1 = new Date(inicio);
    const d2 = new Date(fin);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : null;
  }

  viajeTerminado(viaje: Viaje): boolean {
    if (viaje.estado !== 'finalizado') return false;
    if (viaje.solo_ida) return true;
    return !!viaje.viaje_vuelta && viaje.viaje_vuelta.estado === 'finalizado';
  }

  iniciarViaje(viaje: Viaje): void {
    this.viajesService.iniciar(viaje.id).subscribe({
      next: () => this.cargarViajes(),
      error: () => this.error.set('No se pudo iniciar el viaje')
    });
  }

  // ---- Modal Nuevo Viaje ----

  formularioVacio(): ViajeCreate {
    return {
      chofer_id: '',
      camion_id: undefined,
      camion_id_2: undefined,
      cliente: '',
      origen: '',
      destino: '',
      carga: '',
      tarifa: undefined,
      fecha_inicio: ''
    };
  }

  abrirModalNuevoViaje(): void {
    this.nuevoViaje = this.formularioVacio();
    this.error.set(null);
    this.accionModal.set('nuevo');

    this.choferesService.listar(1, 1000, undefined).subscribe({
      next: (respuesta) => this.choferes.set(respuesta.items.filter(c => c.estado === 'disponible'))
    });

    this.acopladosService.listar(1, 1000, undefined).subscribe({
      next: (respuesta) => this.acopladosList.set(respuesta.items.filter(a => a.estado === 'disponible'))
    });

    this.camionesService.listar(1, 1000, undefined).subscribe({
      next: (respuesta) => this.camiones.set(respuesta.items.filter(c => c.estado === 'disponible'))
    });
  }

  confirmarNuevoViaje(): void {
    if (!this.nuevoViaje.chofer_id || !this.nuevoViaje.origen || !this.nuevoViaje.destino || !this.nuevoViaje.fecha_inicio) {
      this.error.set('Completá chofer, origen, destino y fecha');
      return;
    }

    const datos: ViajeCreate = {
      ...this.nuevoViaje,
      fecha_inicio: new Date(this.nuevoViaje.fecha_inicio).toISOString()
    };

    this.viajesService.crear(datos).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarDatosIniciales();
      },
      error: (err) => {
        if (err.status === 409) {
          this.error.set('Ese chofer ya no está disponible. Elegí otro o refrescá la lista.');
        } else {
          this.error.set('No se pudo crear el viaje');
        }
      }
    });
  }

  // ---- Modal Vuelta ----

  abrirModalVuelta(viaje: Viaje): void {
    this.viajeOriginalId = viaje.id;
    this.nuevoViaje = {
      ...this.formularioVacio(),
      origen: viaje.destino,
      destino: viaje.origen,
      chofer_id: viaje.chofer_id,
    };
    this.error.set(null);
    this.accionModal.set('vuelta');

    this.choferesService.listar(1, 1000, undefined).subscribe({
      next: (respuesta) => this.choferes.set(respuesta.items)
    });

    this.acopladosService.listar(1, 1000, undefined).subscribe({
      next: (respuesta) => this.acopladosList.set(respuesta.items.filter(a => a.estado === 'disponible'))
    });

    this.camionesService.listar(1, 1000, undefined).subscribe({
      next: (respuesta) => this.camiones.set(respuesta.items.filter(c => c.estado === 'disponible'))
    });
  }

  confirmarVuelta(): void {
    if (!this.nuevoViaje.chofer_id || !this.nuevoViaje.origen || !this.nuevoViaje.destino || !this.nuevoViaje.fecha_inicio) {
      this.error.set('Completá chofer, origen, destino y fecha');
      return;
    }

    const datos: ViajeCreate = {
      ...this.nuevoViaje,
      fecha_inicio: new Date(this.nuevoViaje.fecha_inicio).toISOString()
    };

    this.viajesService.agregarVuelta(this.viajeOriginalId, datos).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarDatosIniciales();
      },
      error: () => this.error.set('No se pudo agregar la vuelta')
    });
  }

  // ---- Modales Finalizar / Cancelar ----

  abrirModalFinalizar(viaje: Viaje): void {
    this.viajeSeleccionado.set(viaje);
    this.accionModal.set('finalizar');
  }

  abrirModalFinalizarSinVuelta(viaje: Viaje): void {
    this.viajeSeleccionado.set(viaje);
    this.soloIdaForzado.set(true);
    this.accionModal.set('finalizar');
  }

  abrirConfirmacionSinVuelta(viaje: Viaje): void {
    this.viajeSinVuelta.set(viaje);
    this.modalSinVuelta.set(true);
  }

  cerrarConfirmacionSinVuelta(): void {
    this.modalSinVuelta.set(false);
    this.viajeSinVuelta.set(null);
  }

  confirmarSinVuelta(): void {
    const viaje = this.viajeSinVuelta();
    this.cerrarConfirmacionSinVuelta();
    if (viaje) this.abrirModalFinalizarSinVuelta(viaje);
  }

  abrirModalCancelar(viaje: Viaje): void {
    this.viajeSeleccionado.set(viaje);
    this.accionModal.set('cancelar');
  }

  seleccionarModalChofer(chofer: Chofer): void {
    this.nuevoViaje.chofer_id = chofer.id;

    if (!chofer.camion_id) return;
    const camion = this.camiones().find(c => c.id === chofer.camion_id);
    if (camion) {
      this.nuevoViaje.camion_id = camion.id;
      this.autocompletarAcoplado(camion.acoplado_id);
    } else {
      this.camionesService.obtenerPorId(chofer.camion_id).subscribe({
        next: (c) => {
          if (!this.camiones().some(x => x.id === c.id)) {
            this.camiones.update(lista => [...lista, c]);
          }
          this.nuevoViaje.camion_id = c.id;
          this.autocompletarAcoplado(c.acoplado_id);
        }
      });
    }
  }

  autocompletarAcoplado(acopladoId: string | null): void {
    if (!acopladoId) {
      this.nuevoViaje.camion_id_2 = undefined;
      return;
    }
    if (this.acopladosList().some(a => a.id === acopladoId)) {
      this.nuevoViaje.camion_id_2 = acopladoId;
    } else {
      this.acopladosService.obtenerPorId(acopladoId).subscribe({
        next: (a) => {
          if (!this.acopladosList().some(x => x.id === a.id)) {
            this.acopladosList.update(lista => [...lista, a]);
          }
          this.nuevoViaje.camion_id_2 = a.id;
        }
      });
    }
  }

  seleccionarModalCamion(item: Camion): void {
    this.nuevoViaje.camion_id = item.id || undefined;
    this.autocompletarAcoplado(item.acoplado_id ?? null);
  }

  seleccionarModalCamion2(item: { id: string }): void {
    this.nuevoViaje.camion_id_2 = item.id || undefined;
  }

  limpiarModalCamion(): void {
    this.nuevoViaje.camion_id = undefined;
    this.nuevoViaje.camion_id_2 = undefined;
  }

  limpiarModalCamion2(): void {
    this.nuevoViaje.camion_id_2 = undefined;
  }

  cerrarModal(): void {
    this.viajeSeleccionado.set(null);
    this.accionModal.set(null);
    this.error.set(null);
  }

  onFinalizarConfirmado(datos: ViajeFinalizar): void {
    const viaje = this.viajeSeleccionado();
    if (!viaje) return;

    this.viajesService.finalizar(viaje.id, datos).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarViajes();
      },
      error: () => this.error.set('No se pudo finalizar el viaje')
    });
  }

  onCancelarConfirmado(motivo: string): void {
    const viaje = this.viajeSeleccionado();
    if (!viaje) return;

    this.viajesService.cancelar(viaje.id, motivo).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarViajes();
      },
      error: () => this.error.set('No se pudo cancelar el viaje')
    });
  }

  // ---- Modal Reanudar ----

  abrirModalReanudar(viaje: Viaje): void {
    this.viajeOriginalId = viaje.id;
    this.nuevoViaje = {
      chofer_id: viaje.chofer_id,
      camion_id: viaje.camion_id ?? undefined,
      camion_id_2: viaje.camion_id_2 ?? undefined,
      cliente: viaje.cliente ?? '',
      origen: viaje.origen,
      destino: viaje.destino,
      carga: viaje.carga ?? '',
      tarifa: viaje.tarifa ?? undefined,
      fecha_inicio: this.formatearFechaParaInput(viaje.fecha_inicio),
    };
    this.error.set(null);
    this.accionModal.set('reanudar');

    this.choferesService.listar(1, 1000, { activos_only: false }).subscribe({
      next: (respuesta) => this.choferes.set(respuesta.items)
    });

    this.acopladosService.listar(1, 1000, { activos_only: false }).subscribe({
      next: (respuesta) => {
        const actuales = viaje.camion_id_2 ? [viaje.camion_id_2] : [];
        this.acopladosList.set(respuesta.items.filter(a => a.estado === 'disponible' || actuales.includes(a.id)))
      }
    });

    this.camionesService.listar(1, 1000, { activos_only: false }).subscribe({
      next: (respuesta) => {
        const actuales = viaje.camion_id ? [viaje.camion_id] : [];
        this.camiones.set(respuesta.items.filter(c => c.estado === 'disponible' || actuales.includes(c.id)))
      }
    });
  }

  confirmarReanudar(): void {
    if (!this.nuevoViaje.chofer_id || !this.nuevoViaje.origen || !this.nuevoViaje.destino || !this.nuevoViaje.fecha_inicio) {
      this.error.set('Completá chofer, origen, destino y fecha');
      return;
    }

    const viaje = this.viajeOriginalId;
    if (!viaje) return;

    const datos: ViajeReanudar = {};
    for (const [key, value] of Object.entries(this.nuevoViaje)) {
      if (value !== undefined && value !== '' && value !== null) {
        if (key === 'fecha_inicio') {
          (datos as any)[key] = new Date(value).toISOString();
        } else {
          (datos as any)[key] = value;
        }
      }
    }

    this.viajesService.reanudar(viaje, datos).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarViajes();
      },
      error: (err) => {
        if (err.status === 409) {
          this.error.set('El chofer seleccionado no está disponible. Elegí otro.');
        } else {
          this.error.set('No se pudo reanudar el viaje');
        }
      }
    });
  }

  private formatearFechaParaInput(iso: string): string {
    const dt = new Date(iso);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const h = String(dt.getHours()).padStart(2, '0');
    const min = String(dt.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  }
}