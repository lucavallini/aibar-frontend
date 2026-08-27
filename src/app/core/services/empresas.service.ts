import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Empresa } from '../models/empresa.model';
import { RespuestaPaginada } from '../models/paginacion.model';
import { buildListParams } from '../utils/http-params.helper';
import { ApiCache } from '../utils/api-cache';

const CACHE_KEY = 'empresas';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private apiUrl = `${environment.apiUrl}/empresas`;

  constructor(
    private http: HttpClient,
    private cache: ApiCache,
  ) {}

  listar(
    pagina: number = 1,
    tamanoPagina: number = 100,
    filtros?: Record<string, any>,
  ): Observable<RespuestaPaginada<Empresa>> {
    const cacheKey = `${CACHE_KEY}_${pagina}_${tamanoPagina}_${JSON.stringify(filtros ?? {})}`;
    const cached = this.cache.get<RespuestaPaginada<Empresa>>(cacheKey);
    if (cached) return of(cached);
    return this.http
      .get<RespuestaPaginada<Empresa>>(`${this.apiUrl}/`, {
        params: buildListParams(pagina, tamanoPagina, filtros),
      })
      .pipe(tap((data) => this.cache.set(cacheKey, data)));
  }

  crear(datos: { nombre: string }): Observable<Empresa> {
    this.cache.clear(CACHE_KEY);
    return this.http.post<Empresa>(`${this.apiUrl}/`, datos);
  }
}
