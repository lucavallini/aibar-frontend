import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CargaCombustible, CargaCombustibleCreate } from '../models/combustible.model';
import { RespuestaPaginada } from '../models/paginacion.model';

@Injectable({ providedIn: 'root' })
export class CombustibleService {
  private apiUrl = `${environment.apiUrl}/combustible`;

  constructor(private http: HttpClient) {}

  listar(
  camionId?: string,
  pagina: number = 1,
  tamanoPagina: number = 20,
  soloUltimos30Dias: boolean = true
  ): Observable<RespuestaPaginada<CargaCombustible>> {
  const filtroCamion = camionId ? `&camion_id=${camionId}` : '';
  return this.http.get<RespuestaPaginada<CargaCombustible>>(
      `${this.apiUrl}/?pagina=${pagina}&tamano_pagina=${tamanoPagina}&solo_ultimos_30_dias=${soloUltimos30Dias}${filtroCamion}`
  );
  }

  crear(datos: CargaCombustibleCreate): Observable<CargaCombustible> {
    return this.http.post<CargaCombustible>(`${this.apiUrl}/`, datos);
  }

  gastoTotalPorCamion(camionId: string): Observable<{ camion_id: string; total_litros: number; total_monto: number; cantidad_cargas: number }> {
    return this.http.get<any>(`${this.apiUrl}/${camionId}/gasto-total`);
  }
}