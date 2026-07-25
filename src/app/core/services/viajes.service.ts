import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Viaje, ViajeCreate, RendimientoCombustible } from '../models/viaje.model';
import { RespuestaPaginada } from '../models/paginacion.model';

@Injectable({ providedIn: 'root' })
export class ViajesService {
  private apiUrl = `${environment.apiUrl}/viajes`;

  constructor(private http: HttpClient) {}

  listar(choferId?: string, estado?: string, dias?: number, pagina: number = 1, tamanoPagina: number = 20): Observable<RespuestaPaginada<Viaje>> {
    let params = `pagina=${pagina}&tamano_pagina=${tamanoPagina}`;
    if (choferId) params += `&chofer_id=${choferId}`;
    if (estado) params += `&estado=${estado}`;
    if (dias) params += `&dias=${dias}`;
    return this.http.get<RespuestaPaginada<Viaje>>(`${this.apiUrl}/?${params}`);
  }

  crear(datos: ViajeCreate): Observable<Viaje> {
    return this.http.post<Viaje>(`${this.apiUrl}/`, datos);
  }

  iniciar(id: string): Observable<Viaje> {
    return this.http.post<Viaje>(`${this.apiUrl}/${id}/iniciar`, {});
  }

  finalizar(id: string, fechaFin: string, kmsRecorridos: number, litrosCombustible?: number): Observable<Viaje> {
    const body: any = { fecha_fin: fechaFin, kms_recorridos: kmsRecorridos };
    if (litrosCombustible) body.litros_combustible = litrosCombustible;
    return this.http.post<Viaje>(`${this.apiUrl}/${id}/finalizar`, body);
  }

  cancelar(id: string, motivoCancelacion: string): Observable<Viaje> {
    return this.http.post<Viaje>(`${this.apiUrl}/${id}/cancelar`, {
      motivo_cancelacion: motivoCancelacion
    });
  }

  agregarVuelta(viajeId: string, datos: ViajeCreate): Observable<Viaje> {
    return this.http.post<Viaje>(`${this.apiUrl}/${viajeId}/vuelta`, datos);
  }

  rendimientoCombustible(choferId: string): Observable<RendimientoCombustible> {
    return this.http.get<RendimientoCombustible>(`${this.apiUrl}/rendimiento-combustible/${choferId}`);
  }
}