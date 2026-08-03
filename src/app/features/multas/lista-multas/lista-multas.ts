import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { MultasService } from '../../../core/services/multas.service';
import { CamionesService } from '../../../core/services/camiones.service';
import { ChoferesService } from '../../../core/services/choferes.service';
import { Multa, MultaCreate } from '../../../core/models/multa.model';
import { Camion } from '../../../core/models/camion.model';
import { Chofer } from '../../../core/models/chofer.model';
import { TablaPaginada } from '../../../shared/components/tabla-paginada/tabla-paginada';
import { PaginaHeader } from '../../../shared/components/pagina-header/pagina-header';
import { EstadoCarga } from '../../../shared/components/estado-carga/estado-carga';
import { obtenerNombrePorId } from '../../../core/utils/entidades';
import { Modal } from '../../../shared/components/modal/modal';

@Component({
  selector: 'app-lista-multas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, DecimalPipe, TablaPaginada, PaginaHeader, EstadoCarga, Modal],
  templateUrl: './lista-multas.html',
})
export class ListaMultas implements OnInit {
  multas = signal<Multa[]>([]);
  camionesPorId = signal<Record<string, string>>({});
  choferesPorId = signal<Record<string, string>>({});
  camiones = signal<Camion[]>([]);
  choferes = signal<Chofer[]>([]);

  cargando = signal(true);
  error = signal<string | null>(null);

  pagina = signal(1);
  totalPaginas = signal(1);
  total = signal(0);
  tamanoPagina = 20;

  modalAbierto = signal(false);
  nuevaMulta: MultaCreate = this.formularioVacio();

  readonly = computed(() => this.authService.getRol() === 'aibar');

  constructor(
    private multasService: MultasService,
    private camionesService: CamionesService,
    private choferesService: ChoferesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarDatosRelacionados();
  }

  cargarDatosRelacionados(): void {
    this.camionesService.listar(1, 1000, { activos_only: false }).subscribe({
      next: (respuesta) => {
        const mapa: Record<string, string> = {};
        respuesta.items.forEach((c: Camion) => mapa[c.id] = c.patente);
        this.camionesPorId.set(mapa);
        this.camiones.set(respuesta.items);
        this.cargarChoferesYMultas();
      }
    });
  }

  cargarChoferesYMultas(): void {
    this.choferesService.listar(1, 1000, { activos_only: false }).subscribe({
      next: (respuesta) => {
        const mapa: Record<string, string> = {};
        respuesta.items.forEach((c: Chofer) => mapa[c.id] = c.nombre_completo);
        this.choferesPorId.set(mapa);
        this.choferes.set(respuesta.items);
        this.cargarMultas();
      }
    });
  }

  cargarMultas(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.multasService.listar(this.pagina(), this.tamanoPagina, undefined).subscribe({
      next: (respuesta) => {
        this.multas.set(respuesta.items);
        this.total.set(respuesta.total);
        this.totalPaginas.set(respuesta.total_paginas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las multas');
        this.cargando.set(false);
      }
    });
  }

  cambiarPagina(nueva: number): void {
    this.pagina.set(nueva);
    this.cargarMultas();
  }

  nombrePatente(camionId: string): string {
    return obtenerNombrePorId(this.camionesPorId(), camionId);
  }

  nombreChofer(choferId: string | null): string {
    return obtenerNombrePorId(this.choferesPorId(), choferId, '-');
  }

  formularioVacio(): MultaCreate {
    return { camion_id: '', chofer_id: undefined, motivo: '', monto: undefined, fecha: undefined };
  }

  abrirModal(): void {
    this.nuevaMulta = this.formularioVacio();
    this.error.set(null);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  confirmarAlta(): void {
    if (!this.nuevaMulta.camion_id || !this.nuevaMulta.motivo.trim()) {
      this.error.set('Camión y motivo son obligatorios');
      return;
    }

    this.multasService.crear(this.nuevaMulta).subscribe({
      next: () => {
        this.cerrarModal();
        this.pagina.set(1);
        this.cargarMultas();
      },
      error: () => this.error.set('No se pudo registrar la multa')
    });
  }
}