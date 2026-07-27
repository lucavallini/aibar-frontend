import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Camion, CamionCreate } from '../models/camion.model';
import { RespuestaPaginada } from '../models/paginacion.model';

@Injectable({ providedIn: 'root' })
export class CamionesService {
  private apiUrl = `${environment.apiUrl}/camiones`;

  constructor(private http: HttpClient) {}

  listar(activosOnly: boolean = true, pagina: number = 1, tamanoPagina: number = 20, busqueda?: string): Observable<RespuestaPaginada<Camion>> {
    let params = `activos_only=${activosOnly}&pagina=${pagina}&tamano_pagina=${tamanoPagina}`;
    if (busqueda) params += `&busqueda=${encodeURIComponent(busqueda)}`;
    return this.http.get<RespuestaPaginada<Camion>>(`${this.apiUrl}/?${params}`);
  }

  crear(datos: CamionCreate): Observable<Camion> {
    return this.http.post<Camion>(`${this.apiUrl}/`, datos);
  }

  actualizar(id: string, datos: Partial<CamionCreate>): Observable<Camion> {
    return this.http.patch<Camion>(`${this.apiUrl}/${id}`, datos);
  }

  darDeBaja(id: string): Observable<Camion> {
    return this.http.delete<Camion>(`${this.apiUrl}/${id}`);
  }
}