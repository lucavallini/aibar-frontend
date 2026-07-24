import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UsuariosService, UsuarioCreate, UsuarioUpdate } from '../../../core/services/usuarios.service';
import { Usuario } from '../../../core/models/usuario.model';
import { Paginacion } from '../../../shared/components/paginacion/paginacion';
import { Confirmar } from '../../../shared/components/confirmar/confirmar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [FormsModule, DatePipe, Paginacion, Confirmar],
  templateUrl: './lista-usuarios.html',
  styleUrl: './lista-usuarios.css'
})
export class ListaUsuarios implements OnInit {
  usuarios = signal<Usuario[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  pagina = signal(1);
  totalPaginas = signal(1);
  total = signal(0);
  tamanoPagina = 20;

  modalAltaAbierto = signal(false);
  nuevoUsuario: UsuarioCreate = this.formularioVacioAlta();

  modalEditarAbierto = signal(false);
  modalBajaAbierto = signal(false);
  usuarioSeleccionado = signal<Usuario | null>(null);
  edicionUsuario: UsuarioUpdate = {};

  constructor(
    private usuariosService: UsuariosService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.usuariosService.listar(this.pagina(), this.tamanoPagina).subscribe({
      next: (respuesta) => {
        this.usuarios.set(respuesta.items);
        this.total.set(respuesta.total);
        this.totalPaginas.set(respuesta.total_paginas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los usuarios');
        this.cargando.set(false);
      }
    });
  }

  cambiarPagina(nueva: number): void {
    this.pagina.set(nueva);
    this.cargarUsuarios();
  }

  esUsuarioActual(usuario: Usuario): boolean {
    return this.authService.getPayload()?.sub === usuario.id;
  }

  // --- Alta ---

  formularioVacioAlta(): UsuarioCreate {
    return { nombre_completo: '', dni: '', password: '', rol: 'empleado' };
  }

  abrirAlta(): void {
    this.nuevoUsuario = this.formularioVacioAlta();
    this.error.set(null);
    this.modalAltaAbierto.set(true);
  }

  cerrarAlta(): void {
    this.modalAltaAbierto.set(false);
  }

  confirmarAlta(): void {
    if (!this.nuevoUsuario.nombre_completo.trim() || !this.nuevoUsuario.dni.trim() || this.nuevoUsuario.password.length < 6) {
      this.error.set('Completá nombre, DNI y una contraseña de al menos 6 caracteres');
      return;
    }

    this.usuariosService.crear(this.nuevoUsuario).subscribe({
      next: (usuarioCreado) => {
        this.cerrarAlta();
        this.pagina.set(1);
        this.cargarUsuarios();
        alert(`Usuario creado: ${usuarioCreado.nombre_usuario}\nComunicale este usuario y la contraseña que elegiste.`);
      },
      error: (err) => {
        if (err.status === 400) {
          this.error.set('Ya existe un usuario con ese DNI');
        } else {
          this.error.set('No se pudo crear el usuario');
        }
      }
    });
  }

  // --- Editar ---

  abrirEditar(usuario: Usuario): void {
    this.usuarioSeleccionado.set(usuario);
    this.edicionUsuario = {
      nombre_completo: usuario.nombre_completo,
      dni: usuario.dni,
      rol: usuario.rol,
    };
    this.error.set(null);
    this.modalEditarAbierto.set(true);
  }

  cerrarEditar(): void {
    this.modalEditarAbierto.set(false);
    this.usuarioSeleccionado.set(null);
  }

  confirmarEdicion(): void {
    const usuario = this.usuarioSeleccionado();
    if (!usuario) return;

    this.usuariosService.actualizar(usuario.id, this.edicionUsuario).subscribe({
      next: () => {
        this.cerrarEditar();
        this.cargarUsuarios();
      },
      error: (err) => {
        if (err.status === 400) {
          this.error.set('Ya existe otro usuario con ese DNI');
        } else {
          this.error.set('No se pudo editar el usuario');
        }
      }
    });
  }

  // --- Baja ---

  abrirBaja(usuario: Usuario): void {
    this.usuarioSeleccionado.set(usuario);
    this.modalBajaAbierto.set(true);
  }

  cerrarBaja(): void {
    this.modalBajaAbierto.set(false);
    this.usuarioSeleccionado.set(null);
  }

  confirmarBaja(): void {
    const usuario = this.usuarioSeleccionado();
    if (!usuario) return;

    this.usuariosService.darDeBaja(usuario.id).subscribe({
      next: () => {
        this.cerrarBaja();
        this.cargarUsuarios();
      },
      error: (err) => {
        if (err.status === 400) {
          this.error.set('No podés darte de baja a vos mismo');
        } else {
          this.error.set('No se pudo dar de baja el usuario');
        }
      }
    });
  }
}