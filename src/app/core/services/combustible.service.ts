import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CargaCombustible, CargaCombustibleCreate, GastoTotalCamion } from '../models/combustible.model';
import { RespuestaPaginada } from '../models/paginacion.model';
import { buildListParams } from '../utils/http-params.helper';
import { ApiCache } from '../utils/api-cache';

const CACHE_KEY = 'combustible';

@Injectable({ providedIn: 'root' })
export class CombustibleService {
  private apiUrl = `${environment.apiUrl}/combustible`;

  constructor(private http: HttpClient, private cache: ApiCache) {}

  listar(pagina: number = 1, tamanoPagina: number = 20, filtros?: Record<string, any>): Observable<RespuestaPaginada<CargaCombustible>> {
    const cacheKey = `${CACHE_KEY}_${pagina}_${tamanoPagina}_${JSON.stringify(filtros ?? {})}`;
    const cached = this.cache.get<RespuestaPaginada<CargaCombustible>>(cacheKey);
    if (cached) return of(cached);
    return this.http.get<RespuestaPaginada<CargaCombustible>>(`${this.apiUrl}/`, { params: buildListParams(pagina, tamanoPagina, filtros) })
      .pipe(tap(data => this.cache.set(cacheKey, data)));
  }

  crear(datos: CargaCombustibleCreate): Observable<CargaCombustible> {
    this.cache.clear(CACHE_KEY);
    return this.http.post<CargaCombustible>(`${this.apiUrl}/`, datos);
  }

  gastoTotalPorCamion(camionId: string): Observable<GastoTotalCamion> {
    return this.http.get<GastoTotalCamion>(`${this.apiUrl}/${camionId}/gasto-total`);
  }
}
