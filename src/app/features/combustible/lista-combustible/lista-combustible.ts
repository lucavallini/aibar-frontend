import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CombustibleService } from '../../../core/services/combustible.service';
import { CamionesService } from '../../../core/services/camiones.service';
import { CargaCombustible, CargaCombustibleCreate } from '../../../core/models/combustible.model';
import { Camion } from '../../../core/models/camion.model';
import { Paginacion } from '../../../shared/components/paginacion/paginacion';

@Component({
  selector: 'app-lista-combustible',
  standalone: true,
  imports: [FormsModule, DatePipe, Paginacion],
  templateUrl: './lista-combustible.html',
  styleUrl: './lista-combustible.css'
})
export class ListaCombustible implements OnInit {
  cargas = signal<CargaCombustible[]>([]);
  camionesPorId = signal<Record<string, string>>({});
  camiones = signal<Camion[]>([]);

  filtroCamionId = signal<string>('');
  gastoTotal = signal<{ total_litros: number; total_monto: number; cantidad_cargas: number } | null>(null);

  cargando = signal(true);
  error = signal<string | null>(null);

  pagina = signal(1);
  totalPaginas = signal(1);
  total = signal(0);
  tamanoPagina = 20;

  modalAbierto = signal(false);
  nuevaCarga: CargaCombustibleCreate = this.formularioVacio();

  constructor(
    private combustibleService: CombustibleService,
    private camionesService: CamionesService
  ) {}

  ngOnInit(): void {
    this.camionesService.listar(false, 1, 1000).subscribe({
      next: (respuesta) => {
        const mapa: Record<string, string> = {};
        respuesta.items.forEach((c: Camion) => mapa[c.id] = c.patente);
        this.camionesPorId.set(mapa);
        this.camiones.set(respuesta.items);
        this.cargarCargas();
      }
    });
  }

  verTodoElHistorico = signal(false);

  cargarCargas(): void {
    this.cargando.set(true);
    this.error.set(null);

    const camionId = this.filtroCamionId() || undefined;
    const solo30Dias = !this.verTodoElHistorico();

    this.combustibleService.listar(camionId, this.pagina(), this.tamanoPagina, solo30Dias).subscribe({
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

  cambiarFiltroCamion(camionId: string): void {
    this.filtroCamionId.set(camionId);
    this.pagina.set(1);
    this.cargarCargas();
  }

  cambiarPagina(nueva: number): void {
    this.pagina.set(nueva);
    this.cargarCargas();
  }

  nombrePatente(camionId: string): string {
    return this.camionesPorId()[camionId] ?? 'Desconocido';
  }

  formularioVacio(): CargaCombustibleCreate {
    return { camion_id: '', litros: 0, monto: 0, fecha: undefined, kms_al_momento: undefined };
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