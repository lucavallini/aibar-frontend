import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { Auditoria } from '../../../core/models/auditoria.model';
import { Paginacion } from '../../../shared/components/paginacion/paginacion';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lista-auditoria',
  standalone: true,
  imports: [DatePipe, Paginacion, FormsModule],
  templateUrl: './lista-auditoria.html',
  styleUrl: './lista-auditoria.css'
})
export class ListaAuditoria implements OnInit {
  eventos = signal<Auditoria[]>([]);
  filtroEntidad = signal<string>('');

  cargando = signal(true);
  error = signal<string | null>(null);

  pagina = signal(1);
  totalPaginas = signal(1);
  total = signal(0);
  tamanoPagina = 50;

  entidades = ['viaje', 'chofer', 'camion', 'multa', 'combustible', 'usuario'];

  constructor(private auditoriaService: AuditoriaService) {}

  ngOnInit(): void {
    this.cargarEventos();
  }

  cargarEventos(): void {
    this.cargando.set(true);
    this.error.set(null);

    const entidad = this.filtroEntidad() || undefined;

    this.auditoriaService.listar(entidad, this.pagina(), this.tamanoPagina).subscribe({
      next: (respuesta) => {
        this.eventos.set(respuesta.items);
        this.total.set(respuesta.total);
        this.totalPaginas.set(respuesta.total_paginas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los eventos de auditoría');
        this.cargando.set(false);
      }
    });
  }

  cambiarFiltroEntidad(valor: string): void {
    this.filtroEntidad.set(valor);
    this.pagina.set(1);
    this.cargarEventos();
  }

  cambiarPagina(nueva: number): void {
    this.pagina.set(nueva);
    this.cargarEventos();
  }
}