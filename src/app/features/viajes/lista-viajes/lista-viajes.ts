import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ViajesService } from '../../../core/services/viajes.service';
import { ChoferesService } from '../../../core/services/choferes.service';
import { CamionesService } from '../../../core/services/camiones.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { Viaje, ViajeCreate } from '../../../core/models/viaje.model';
import { Chofer } from '../../../core/models/chofer.model';
import { Camion } from '../../../core/models/camion.model';
import { Paginacion } from '../../../shared/components/paginacion/paginacion';

type FiltroEstado = 'todos' | 'pendiente' | 'en_curso' | 'finalizado' | 'cancelado';
type AccionModal = 'finalizar' | 'cancelar' | 'nuevo' | 'vuelta' | null;

@Component({
  selector: 'app-lista-viajes',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe, Paginacion],
  templateUrl: './lista-viajes.html',
  styleUrl: './lista-viajes.css'
})
export class ListaViajes implements OnInit {
  viajes = signal<Viaje[]>([]);
  choferes = signal<Chofer[]>([]);
  choferesPorId = signal<Record<string, string>>({});
  camiones = signal<Camion[]>([]);
  camionesPorId = signal<Record<string, Camion>>({});
  usuariosPorId = signal<Record<string, string>>({});
  filtroEstado = signal<FiltroEstado>('todos');
  filtroChoferId = signal<string>('');
  filtroPatente = signal('');
  filtroDias = signal<number | null>(null);
  filtroDropdownAbierto = signal<'chofer' | 'patente' | null>(null);
  filtroChoferBusqueda = signal('');
  filtroPatenteBusqueda = signal('');
  cargando = signal(true);
  error = signal<string | null>(null);

  viajeSeleccionado = signal<Viaje | null>(null);
  accionModal = signal<AccionModal>(null);
  motivoCancelacion = '';
  kmsRecorridos: number | null = null;
  litrosCombustible: number | null = null;

  nuevoViaje: ViajeCreate = this.formularioVacio();
  viajeOriginalId = '';

  dropdownAbierto = signal<'chofer' | 'camion' | 'camion2' | null>(null);

  filtroChoferModal = signal('');
  filtroCamionModal = signal('');
  filtroCamion2Modal = signal('');

  choferesFiltradosModal = computed(() => {
    const filtro = this.filtroChoferModal().toLowerCase();
    if (!filtro) return this.choferes();
    return this.choferes().filter(c => c.nombre_completo.toLowerCase().includes(filtro));
  });

  choferesFiltradosBusqueda = computed(() => {
    const filtro = this.filtroChoferBusqueda().toLowerCase();
    if (!filtro) return this.choferes();
    return this.choferes().filter(c => c.nombre_completo.toLowerCase().includes(filtro));
  });

  camionesFiltradosModal = computed(() => {
    const filtro = this.filtroCamionModal().toLowerCase();
    if (!filtro) return this.camiones();
    return this.camiones().filter(c => c.patente.toLowerCase().includes(filtro));
  });

  camionesFiltradosPatente = computed(() => {
    const filtro = this.filtroPatenteBusqueda().toLowerCase();
    if (!filtro) return this.camiones();
    return this.camiones().filter(c => c.patente.toLowerCase().includes(filtro));
  });

  camiones2FiltradosModal = computed(() => {
    const filtro = this.filtroCamion2Modal().toLowerCase();
    if (!filtro) return this.camiones();
    return this.camiones().filter(c => c.patente.toLowerCase().includes(filtro));
  });

  pagina = signal(1);
  totalPaginas = signal(1);
  total = signal(0);
  tamanoPagina = 20;

  opcionesDias: { label: string; valor: number | null }[] = [
    { label: 'Todos', valor: null },
    { label: '15 días', valor: 15 },
    { label: '30 días', valor: 30 },
  ];

  filtrosEstado: { label: string; valor: FiltroEstado }[] = [
    { label: 'Todos', valor: 'todos' },
    { label: 'Pendientes', valor: 'pendiente' },
    { label: 'En curso', valor: 'en_curso' },
    { label: 'Finalizados', valor: 'finalizado' },
    { label: 'Cancelados', valor: 'cancelado' },
  ];

  constructor(
    private viajesService: ViajesService,
    private choferesService: ChoferesService,
    private camionesService: CamionesService,
    private usuariosService: UsuariosService
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargando.set(true);

    this.choferesService.listar(false, 1, 1000).subscribe({
      next: (respuesta) => {
        const mapa: Record<string, string> = {};
        respuesta.items.forEach((c: Chofer) => mapa[c.id] = c.nombre_completo);
        this.choferesPorId.set(mapa);
        this.choferes.set(respuesta.items);
      }
    });

    this.usuariosService.listar(1, 200).subscribe({
      next: (respuesta) => {
        const mapa: Record<string, string> = {};
        respuesta.items.forEach((u) => mapa[u.id] = u.nombre_completo);
        this.usuariosPorId.set(mapa);
      }
    });

    this.camionesService.listar(false, 1, 1000).subscribe({
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

    this.viajesService.listar(choferId, estado, dias, patente, this.pagina(), this.tamanoPagina).subscribe({
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
    return this.choferesPorId()[choferId] ?? 'Desconocido';
  }

  nombreUsuario(usuarioId: string): string {
    return this.usuariosPorId()[usuarioId] ?? 'Desconocido';
  }

  patenteCamion(camionId: string | null): string {
    if (!camionId) return '';
    return this.camionesPorId()[camionId]?.patente ?? '';
  }

  cambiarFiltroEstado(valor: FiltroEstado): void {
    this.filtroEstado.set(valor);
    this.pagina.set(1);
    this.cargarViajes();
  }

  cambiarFiltroChofer(): void {
    this.pagina.set(1);
    this.cargarViajes();
  }

  cambiarFiltroDias(valor: number | null): void {
    this.filtroDias.set(valor);
    this.pagina.set(1);
    this.cargarViajes();
  }

  abrirFiltroDropdown(tipo: 'chofer' | 'patente'): void {
    this.filtroDropdownAbierto.set(tipo);
    if (tipo === 'chofer') this.filtroChoferBusqueda.set('');
    else this.filtroPatenteBusqueda.set('');
  }

  cerrarFiltroDropdown(): void {
    this.filtroDropdownAbierto.set(null);
  }

  seleccionarFiltroChofer(chofer: Chofer): void {
    this.filtroChoferId.set(chofer.id);
    this.filtroDropdownAbierto.set(null);
    this.pagina.set(1);
    this.cargarViajes();
  }

  limpiarFiltroChofer(): void {
    this.filtroChoferId.set('');
    this.filtroDropdownAbierto.set(null);
    this.pagina.set(1);
    this.cargarViajes();
  }

  seleccionarFiltroPatente(camion: Camion): void {
    this.filtroPatente.set(camion.patente || '');
    this.filtroDropdownAbierto.set(null);
    this.filtroPatenteBusqueda.set('');
    this.pagina.set(1);
    this.cargarViajes();
  }

  limpiarFiltroPatente(): void {
    this.filtroPatente.set('');
    this.filtroDropdownAbierto.set(null);
    this.filtroPatenteBusqueda.set('');
    this.pagina.set(1);
    this.cargarViajes();
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
    this.filtroChoferModal.set('');
    this.filtroCamionModal.set('');
    this.filtroCamion2Modal.set('');

    this.choferesService.listar(true, 1, 1000).subscribe({
      next: (respuesta) => this.choferes.set(respuesta.items.filter(c => c.estado === 'disponible'))
    });

    this.camionesService.listar(true, 1, 1000).subscribe({
      next: (respuesta) => this.camiones.set(respuesta.items)
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
    this.filtroChoferModal.set('');
    this.filtroCamionModal.set('');
    this.filtroCamion2Modal.set('');

    this.choferesService.listar(true, 1, 1000).subscribe({
      next: (respuesta) => this.choferes.set(respuesta.items)
    });

    this.camionesService.listar(true, 1, 1000).subscribe({
      next: (respuesta) => this.camiones.set(respuesta.items)
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
    this.kmsRecorridos = null;
    this.litrosCombustible = null;
  }

  abrirModalCancelar(viaje: Viaje): void {
    this.viajeSeleccionado.set(viaje);
    this.accionModal.set('cancelar');
    this.motivoCancelacion = '';
  }

  cerrarDropdown(): void {
    this.dropdownAbierto.set(null);
  }

  abrirDropdown(tipo: 'chofer' | 'camion' | 'camion2'): void {
    this.dropdownAbierto.set(tipo);
  }

  seleccionarChofer(chofer: Chofer): void {
    this.nuevoViaje.chofer_id = chofer.id;
    this.dropdownAbierto.set(null);
    this.filtroChoferModal.set('');
  }

  seleccionarCamion(camion: Camion): void {
    this.nuevoViaje.camion_id = camion.id || undefined;
    this.dropdownAbierto.set(null);
    this.filtroCamionModal.set('');
  }

  limpiarCamion(): void {
    this.nuevoViaje.camion_id = undefined;
    this.dropdownAbierto.set(null);
  }

  seleccionarCamion2(camion: Camion): void {
    this.nuevoViaje.camion_id_2 = camion.id || undefined;
    this.dropdownAbierto.set(null);
    this.filtroCamion2Modal.set('');
  }

  limpiarCamion2(): void {
    this.nuevoViaje.camion_id_2 = undefined;
    this.dropdownAbierto.set(null);
  }

  cerrarModal(): void {
    this.viajeSeleccionado.set(null);
    this.accionModal.set(null);
    this.error.set(null);
  }

  confirmarFinalizar(): void {
    const viaje = this.viajeSeleccionado();
    if (!viaje || this.kmsRecorridos === null || this.kmsRecorridos <= 0) return;

    const fechaFin = new Date().toISOString();

    this.viajesService.finalizar(viaje.id, fechaFin, this.kmsRecorridos, this.litrosCombustible ?? undefined).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarViajes();
      },
      error: () => this.error.set('No se pudo finalizar el viaje')
    });
  }

  confirmarCancelar(): void {
    const viaje = this.viajeSeleccionado();
    if (!viaje || this.motivoCancelacion.trim().length < 5) return;

    this.viajesService.cancelar(viaje.id, this.motivoCancelacion).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarViajes();
      },
      error: () => this.error.set('No se pudo cancelar el viaje')
    });
  }
}