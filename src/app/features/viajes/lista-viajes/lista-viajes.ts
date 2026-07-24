import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ViajesService } from '../../../core/services/viajes.service';
import { ChoferesService } from '../../../core/services/choferes.service';
import { CamionesService } from '../../../core/services/camiones.service';
import { Viaje, ViajeCreate } from '../../../core/models/viaje.model';
import { Chofer } from '../../../core/models/chofer.model';
import { Camion } from '../../../core/models/camion.model';
import { Paginacion } from '../../../shared/components/paginacion/paginacion';

type FiltroEstado = 'todos' | 'pendiente' | 'en_curso' | 'finalizado' | 'cancelado';
type AccionModal = 'finalizar' | 'cancelar' | 'nuevo' | null;

@Component({
  selector: 'app-lista-viajes',
  standalone: true,
  imports: [FormsModule, DatePipe, Paginacion],
  templateUrl: './lista-viajes.html',
  styleUrl: './lista-viajes.css'
})
export class ListaViajes implements OnInit {
  viajes = signal<Viaje[]>([]);
  choferesPorId = signal<Record<string, string>>({});
  choferesDisponibles = signal<Chofer[]>([]);
  camiones = signal<Camion[]>([]);
  filtroActivo = signal<FiltroEstado>('todos');
  cargando = signal(true);
  error = signal<string | null>(null);

  viajeSeleccionado = signal<Viaje | null>(null);
  accionModal = signal<AccionModal>(null);
  motivoCancelacion = '';
  kmsRecorridos: number | null = null;

  nuevoViaje: ViajeCreate = this.formularioVacio();

  filtros: { label: string; valor: FiltroEstado }[] = [
    { label: 'Todos', valor: 'todos' },
    { label: 'Pendientes', valor: 'pendiente' },
    { label: 'En curso', valor: 'en_curso' },
    { label: 'Finalizados', valor: 'finalizado' },
    { label: 'Cancelados', valor: 'cancelado' },
  ];


  constructor(
    private viajesService: ViajesService,
    private choferesService: ChoferesService,
    private camionesService: CamionesService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.error.set(null);

this.choferesService.listar(false, 1, 1000).subscribe({
  next: (respuesta) => {
    const mapa: Record<string, string> = {};
    respuesta.items.forEach((c: Chofer) => mapa[c.id] = c.nombre_completo);
        this.choferesPorId.set(mapa);
        this.cargarViajes();
      },
      error: () => {
        this.error.set('No se pudieron cargar los choferes');
        this.cargando.set(false);
      }
    });
  }

    pagina = signal(1);
    totalPaginas = signal(1);
    total = signal(0);
    tamanoPagina = 20;

  cargarViajes(): void {
    this.viajesService.listar(this.filtroBackend(), this.pagina(), this.tamanoPagina).subscribe({
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

  filtroBackend(): string | undefined {
    return this.filtroActivo() === 'todos' ? undefined : this.filtroActivo();
  }

  nombreChofer(choferId: string): string {
    return this.choferesPorId()[choferId] ?? 'Desconocido';
  }

  cambiarFiltro(valor: FiltroEstado): void {
    this.filtroActivo.set(valor);
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

    this.choferesService.listar(true, 1, 1000).subscribe({
      next: (respuesta) => this.choferesDisponibles.set(respuesta.items.filter(c => c.estado === 'disponible')),
      error: () => this.error.set('No se pudieron cargar los choferes disponibles')
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
        this.cargarDatos();
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

  // ---- Modales Finalizar / Cancelar ----

  abrirModalFinalizar(viaje: Viaje): void {
    this.viajeSeleccionado.set(viaje);
    this.accionModal.set('finalizar');
    this.kmsRecorridos = null;
  }

  abrirModalCancelar(viaje: Viaje): void {
    this.viajeSeleccionado.set(viaje);
    this.accionModal.set('cancelar');
    this.motivoCancelacion = '';
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

    this.viajesService.finalizar(viaje.id, fechaFin, this.kmsRecorridos).subscribe({
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