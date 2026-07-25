import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Auditoria } from '../models/auditoria.model';
import { RespuestaPaginada } from '../models/paginacion.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private apiUrl = `${environment.apiUrl}/auditoria`;

  constructor(private http: HttpClient) {}

  listar(entidad?: string, dias?: number, pagina: number = 1, tamanoPagina: number = 20): Observable<RespuestaPaginada<Auditoria>> {
    let params = `pagina=${pagina}&tamano_pagina=${tamanoPagina}`;
    if (entidad) params += `&entidad=${entidad}`;
    if (dias) params += `&dias=${dias}`;
    return this.http.get<RespuestaPaginada<Auditoria>>(`${this.apiUrl}/?${params}`);
  }
}