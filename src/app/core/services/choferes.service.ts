import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Chofer, ChoferCreate, ChoferDetalle } from '../models/chofer.model';
import { RespuestaPaginada } from '../models/paginacion.model';
import { buildListParams } from '../utils/http-params.helper';
import { ApiCache } from '../utils/api-cache';

const CACHE_KEY = 'choferes';

@Injectable({ providedIn: 'root' })
export class ChoferesService {
  private apiUrl = `${environment.apiUrl}/choferes`;

  constructor(private http: HttpClient, private cache: ApiCache) {}

  listar(pagina: number = 1, tamanoPagina: number = 20, filtros?: Record<string, any>): Observable<RespuestaPaginada<Chofer>> {
    const cacheKey = `${CACHE_KEY}_${pagina}_${tamanoPagina}_${JSON.stringify(filtros ?? {})}`;
    const cached = this.cache.get<RespuestaPaginada<Chofer>>(cacheKey);
    if (cached) return of(cached);
    return this.http.get<RespuestaPaginada<Chofer>>(`${this.apiUrl}/`, { params: buildListParams(pagina, tamanoPagina, filtros) })
      .pipe(tap(data => this.cache.set(cacheKey, data)));
  }

  obtenerPorId(id: string): Observable<Chofer> {
    return this.http.get<Chofer>(`${this.apiUrl}/${id}`);
  }

  obtenerDetalle(id: string): Observable<ChoferDetalle> {
    return this.http.get<ChoferDetalle>(`${this.apiUrl}/${id}/detalle`);
  }

  crear(datos: ChoferCreate): Observable<Chofer> {
    this.cache.clear(CACHE_KEY);
    return this.http.post<Chofer>(`${this.apiUrl}/`, datos);
  }

  cambiarEstado(id: string, estado: string): Observable<Chofer> {
    this.cache.clear(CACHE_KEY);
    return this.http.patch<Chofer>(`${this.apiUrl}/${id}/estado`, { estado });
  }

  actualizar(id: string, datos: Partial<ChoferCreate>): Observable<Chofer> {
    this.cache.clear(CACHE_KEY);
    return this.http.patch<Chofer>(`${this.apiUrl}/${id}`, datos);
  }

  darDeBaja(id: string): Observable<Chofer> {
    this.cache.clear(CACHE_KEY);
    return this.http.delete<Chofer>(`${this.apiUrl}/${id}`);
  }
}
