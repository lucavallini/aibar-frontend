import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CargaCombustible, CargaCombustibleCreate } from '../models/combustible.model';
import { RespuestaPaginada } from '../models/paginacion.model';
import { buildListParams } from '../utils/http-params.helper';

@Injectable({ providedIn: 'root' })
export class CombustibleService {
  private apiUrl = `${environment.apiUrl}/combustible`;

  constructor(private http: HttpClient) {}

  listar(pagina: number = 1, tamanoPagina: number = 20, filtros?: Record<string, any>): Observable<RespuestaPaginada<CargaCombustible>> {
    return this.http.get<RespuestaPaginada<CargaCombustible>>(`${this.apiUrl}/`, { params: buildListParams(pagina, tamanoPagina, filtros) });
  }

  crear(datos: CargaCombustibleCreate): Observable<CargaCombustible> {
    return this.http.post<CargaCombustible>(`${this.apiUrl}/`, datos);
  }

  gastoTotalPorCamion(camionId: string): Observable<{ camion_id: string; total_litros: number; total_monto: number; cantidad_cargas: number }> {
    return this.http.get<any>(`${this.apiUrl}/${camionId}/gasto-total`);
  }
}