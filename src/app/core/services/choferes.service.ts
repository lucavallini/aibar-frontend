import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Chofer, ChoferCreate } from '../models/chofer.model';
import { RespuestaPaginada } from '../models/paginacion.model';

@Injectable({ providedIn: 'root' })
export class ChoferesService {
  private apiUrl = `${environment.apiUrl}/choferes`;

  constructor(private http: HttpClient) {}

  listar(activosOnly: boolean = true, pagina: number = 1, tamanoPagina: number = 20): Observable<RespuestaPaginada<Chofer>> {
    return this.http.get<RespuestaPaginada<Chofer>>(
      `${this.apiUrl}/?activos_only=${activosOnly}&pagina=${pagina}&tamano_pagina=${tamanoPagina}`
    );
  }

  obtenerPorId(id: string): Observable<Chofer> {
    return this.http.get<Chofer>(`${this.apiUrl}/${id}`);
  }

  crear(datos: ChoferCreate): Observable<Chofer> {
    return this.http.post<Chofer>(`${this.apiUrl}/`, datos);
  }

  cambiarEstado(id: string, estado: string): Observable<Chofer> {
    return this.http.patch<Chofer>(`${this.apiUrl}/${id}/estado`, { estado });
  }

  actualizar(id: string, datos: Partial<ChoferCreate>): Observable<Chofer> {
    return this.http.patch<Chofer>(`${this.apiUrl}/${id}`, datos);
  }

  darDeBaja(id: string): Observable<Chofer> {
    return this.http.delete<Chofer>(`${this.apiUrl}/${id}`);
  }

}

