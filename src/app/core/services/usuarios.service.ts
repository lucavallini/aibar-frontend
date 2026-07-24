import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/usuario.model';
import { RespuestaPaginada } from '../models/paginacion.model';

export interface UsuarioCreate {
  nombre_completo: string;
  dni: string;
  password: string;
  rol: 'administrador' | 'empleado';
}

export interface UsuarioUpdate {
  nombre_completo?: string;
  dni?: string;
  rol?: 'administrador' | 'empleado';
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  listar(pagina: number = 1, tamanoPagina: number = 20): Observable<RespuestaPaginada<Usuario>> {
    return this.http.get<RespuestaPaginada<Usuario>>(
      `${this.apiUrl}/?pagina=${pagina}&tamano_pagina=${tamanoPagina}`
    );
  }

  crear(datos: UsuarioCreate): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/`, datos);
  }

  actualizar(id: string, datos: UsuarioUpdate): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, datos);
    }

  darDeBaja(id: string): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.apiUrl}/${id}`);
    }
}