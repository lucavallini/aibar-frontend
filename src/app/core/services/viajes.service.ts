import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Viaje, ViajeCreate } from '../models/viaje.model';
import { RespuestaPaginada } from '../models/paginacion.model';

@Injectable({ providedIn: 'root' })
export class ViajesService {
  private apiUrl = `${environment.apiUrl}/viajes`;

  constructor(private http: HttpClient) {}

  listar(estado?: string, pagina: number = 1, tamanoPagina: number = 20): Observable<RespuestaPaginada<Viaje>> {
    const filtroEstado = estado ? `&estado=${estado}` : '';
    return this.http.get<RespuestaPaginada<Viaje>>(
      `${this.apiUrl}/?pagina=${pagina}&tamano_pagina=${tamanoPagina}${filtroEstado}`
    );
  }

  crear(datos: ViajeCreate): Observable<Viaje> {
    return this.http.post<Viaje>(`${this.apiUrl}/`, datos);
  }

  iniciar(id: string): Observable<Viaje> {
    return this.http.post<Viaje>(`${this.apiUrl}/${id}/iniciar`, {});
  }

  finalizar(id: string, fechaFin: string, kmsRecorridos: number): Observable<Viaje> {
    return this.http.post<Viaje>(`${this.apiUrl}/${id}/finalizar`, {
      fecha_fin: fechaFin,
      kms_recorridos: kmsRecorridos
    });
  }

  cancelar(id: string, motivoCancelacion: string): Observable<Viaje> {
    return this.http.post<Viaje>(`${this.apiUrl}/${id}/cancelar`, {
      motivo_cancelacion: motivoCancelacion
    });
  }
}