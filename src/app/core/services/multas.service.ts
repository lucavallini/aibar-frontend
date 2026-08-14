import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Multa, MultaCreate } from '../models/multa.model';
import { RespuestaPaginada } from '../models/paginacion.model';
import { buildListParams } from '../utils/http-params.helper';
import { ApiCache } from '../utils/api-cache';

const CACHE_KEY = 'multas';

@Injectable({ providedIn: 'root' })
export class MultasService {
  private apiUrl = `${environment.apiUrl}/multas`;

  constructor(private http: HttpClient, private cache: ApiCache) {}

  listar(pagina: number = 1, tamanoPagina: number = 20, filtros?: Record<string, any>): Observable<RespuestaPaginada<Multa>> {
    const cacheKey = `${CACHE_KEY}_${pagina}_${tamanoPagina}_${JSON.stringify(filtros ?? {})}`;
    const cached = this.cache.get<RespuestaPaginada<Multa>>(cacheKey);
    if (cached) return of(cached);
    return this.http.get<RespuestaPaginada<Multa>>(`${this.apiUrl}/`, { params: buildListParams(pagina, tamanoPagina, filtros) })
      .pipe(tap(data => this.cache.set(cacheKey, data)));
  }

  crear(datos: MultaCreate): Observable<Multa> {
    this.cache.clear(CACHE_KEY);
    return this.http.post<Multa>(`${this.apiUrl}/`, datos);
  }
}
