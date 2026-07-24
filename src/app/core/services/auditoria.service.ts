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

  listar(entidad?: string, pagina: number = 1, tamanoPagina: number = 50): Observable<RespuestaPaginada<Auditoria>> {
    const filtro = entidad ? `&entidad=${entidad}` : '';
    return this.http.get<RespuestaPaginada<Auditoria>>(
      `${this.apiUrl}/?pagina=${pagina}&tamano_pagina=${tamanoPagina}${filtro}`
    );
  }
}