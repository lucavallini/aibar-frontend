import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CamionesService } from '../../../core/services/camiones.service';
import { Camion, CamionCreate } from '../../../core/models/camion.model';
import { Paginacion } from '../../../shared/components/paginacion/paginacion';
import { Confirmar } from '../../../shared/components/confirmar/confirmar';


@Component({
  selector: 'app-lista-camiones',
  standalone: true,
  imports: [FormsModule, Paginacion, Confirmar],
  templateUrl: './lista-camiones.html',
  styleUrl: './lista-camiones.css'
})
export class ListaCamiones implements OnInit {
  camiones = signal<Camion[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

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

  constructor(private camionesService: CamionesService) {}

  ngOnInit(): void {
    this.cargarCamiones();
  }


  abrirEditar(camion: Camion): void {
    this.camionSeleccionado.set(camion);
    this.edicionCamion = {
      marca: camion.marca ?? undefined,
      modelo: camion.modelo ?? undefined,
      anio: camion.anio ?? undefined,
      tipo: camion.tipo ?? undefined,
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

  cargarCamiones(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.camionesService.listar(true, this.pagina(), this.tamanoPagina).subscribe({
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

  formularioVacio(): CamionCreate {
    return { patente: '', marca: '', modelo: '', anio: undefined, tipo: '' };
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
}