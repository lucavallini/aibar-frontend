import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { CombustibleService } from '../../../core/services/combustible.service';
import { CamionesService } from '../../../core/services/camiones.service';
import { ChoferesService } from '../../../core/services/choferes.service';
import { CargaCombustible, CargaCombustibleCreate } from '../../../core/models/combustible.model';
import { Camion } from '../../../core/models/camion.model';
import { Chofer } from '../../../core/models/chofer.model';
import { Paginacion } from '../../../shared/components/paginacion/paginacion';
import { BuscadorSelect } from '../../../shared/components/buscador-select/buscador-select';
import { PaginaHeader } from '../../../shared/components/pagina-header/pagina-header';
import { EstadoCarga } from '../../../shared/components/estado-carga/estado-carga';
import { Modal } from '../../../shared/components/modal/modal';
import { obtenerNombrePorId } from '../../../core/utils/entidades';
import { litros100 } from '../../../core/utils/combustible';

@Component({
  selector: 'app-lista-combustible',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, DecimalPipe, Paginacion, BuscadorSelect, PaginaHeader, EstadoCarga, Modal],
  templateUrl: './lista-combustible.html',
  styleUrl: './lista-combustible.css'
})
export class ListaCombustible implements OnInit {
  cargas = signal<CargaCombustible[]>([]);
  camionesPorId = signal<Record<string, string>>({});
  camiones = signal<Camion[]>([]);
  choferes = signal<Chofer[]>([]);

  filtroCamionId = signal<string>('');
  filtroChoferId = signal<string>('');
  filtroFechaDesde = signal<string>('');
  filtroFechaHasta = signal<string>('');
  gastoTotal = signal<{ total_litros: number; total_monto: number; cantidad_cargas: number } | null>(null);

  cargando = signal(true);
  error = signal<string | null>(null);

  pagina = signal(1);
  totalPaginas = signal(1);
  total = signal(0);
  tamanoPagina = 20;

  modalAbierto = signal(false);
  nuevaCarga: CargaCombustibleCreate = this.formularioVacio();

  readonly = computed(() => this.authService.getRol() === 'aibar');

  constructor(
    private combustibleService: CombustibleService,
    private camionesService: CamionesService,
    private choferesService: ChoferesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.camionesService.listar(1, 1000, { activos_only: false }).subscribe({
      next: (respuesta) => {
        const mapa: Record<string, string> = {};
        respuesta.items.forEach((c: Camion) => mapa[c.id] = c.patente);
        this.camionesPorId.set(mapa);
        this.camiones.set(respuesta.items);
        this.cargarCargas();
      }
    });
    this.choferesService.listar(1, 1000).subscribe({
      next: (respuesta) => this.choferes.set(respuesta.items)
    });
  }

  verTodoElHistorico = signal(false);

  cargarCargas(): void {
    this.cargando.set(true);
    this.error.set(null);

    const camionId = this.filtroCamionId() || undefined;
    const choferId = this.filtroChoferId() || undefined;
    const fechaDesde = this.filtroFechaDesde() || undefined;
    const fechaHasta = this.filtroFechaHasta() || undefined;
    const solo30Dias = !this.verTodoElHistorico() && !fechaDesde && !fechaHasta;

    this.combustibleService.listar(this.pagina(), this.tamanoPagina, {
      camion_id: camionId,
      chofer_id: choferId,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      solo_ultimos_30_dias: solo30Dias
    }).subscribe({
      next: (respuesta) => {
        this.cargas.set(respuesta.items);
        this.total.set(respuesta.total);
        this.totalPaginas.set(respuesta.total_paginas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los registros de combustible');
        this.cargando.set(false);
      }
    });

    if (camionId) {
      this.combustibleService.gastoTotalPorCamion(camionId).subscribe({
        next: (resumen) => this.gastoTotal.set(resumen)
      });
    } else {
      this.gastoTotal.set(null);
    }
  }

  toggleVerTodo(): void {
    this.verTodoElHistorico.set(!this.verTodoElHistorico());
    this.pagina.set(1);
    this.cargarCargas();
  }

  cambiarFiltroCamion(camion: any): void {
    this.filtroCamionId.set(camion ? camion.id : '');
    this.pagina.set(1);
    this.cargarCargas();
  }

  cambiarFiltroChofer(chofer: any): void {
    this.filtroChoferId.set(chofer ? chofer.id : '');
    this.pagina.set(1);
    this.cargarCargas();
  }

  limpiarFiltroChofer(): void {
    this.filtroChoferId.set('');
    this.pagina.set(1);
    this.cargarCargas();
  }

  cambiarFechaDesde(valor: string): void {
    this.filtroFechaDesde.set(valor);
    this.pagina.set(1);
    this.cargarCargas();
  }

  cambiarFechaHasta(valor: string): void {
    this.filtroFechaHasta.set(valor);
    this.pagina.set(1);
    this.cargarCargas();
  }

  cambiarPagina(nueva: number): void {
    this.pagina.set(nueva);
    this.cargarCargas();
  }

  nombrePatente(camionId: string): string {
    return obtenerNombrePorId(this.camionesPorId(), camionId);
  }

  litros100 = litros100;

  formularioVacio(): CargaCombustibleCreate {
    return { camion_id: '', litros: 0, monto: 0, fecha: undefined };
  }

  abrirModal(): void {
    this.nuevaCarga = this.formularioVacio();
    this.error.set(null);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  confirmarAlta(): void {
    if (!this.nuevaCarga.camion_id || this.nuevaCarga.litros <= 0 || this.nuevaCarga.monto <= 0) {
      this.error.set('Camión, litros y monto son obligatorios (mayores a cero)');
      return;
    }

    this.combustibleService.crear(this.nuevaCarga).subscribe({
      next: () => {
        this.cerrarModal();
        this.pagina.set(1);
        this.cargarCargas();
      },
      error: () => this.error.set('No se pudo registrar la carga')
    });
  }
}
