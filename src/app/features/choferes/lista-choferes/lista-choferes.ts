import { Component, OnInit, signal } from '@angular/core';
import { ChoferesService } from '../../../core/services/choferes.service';
import { Chofer, ChoferCreate } from '../../../core/models/chofer.model';
import { AuthService } from '../../../core/services/auth.service';
import { Paginacion } from '../../../shared/components/paginacion/paginacion';
import { Confirmar } from '../../../shared/components/confirmar/confirmar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lista-choferes',
  standalone: true,
  imports: [Paginacion, Confirmar, FormsModule],
  templateUrl: './lista-choferes.html',
  styleUrl: './lista-choferes.css'
})
export class ListaChoferesComponent implements OnInit {
  choferes = signal<Chofer[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

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

  constructor(
    private choferesService: ChoferesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarChoferes();
  }


  formularioVacioAlta(): ChoferCreate {
    return { nombre_completo: '', dni: '', telefono: '', camion_id: undefined };
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

  abrirEditar(chofer: Chofer): void {
  this.choferSeleccionado.set(chofer);
  this.edicionChofer = {
    nombre_completo: chofer.nombre_completo,
    dni: chofer.dni ?? undefined,
    telefono: chofer.telefono ?? undefined,
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

  cargarChoferes(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.choferesService.listar(true, this.pagina(), this.tamanoPagina).subscribe({
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

  cerrarSesion(): void {
    this.authService.logout();
  }
}