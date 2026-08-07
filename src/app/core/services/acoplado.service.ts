import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Acoplado, AcopladoCreate } from '../models/acoplado.model';
import { RespuestaPaginada } from '../models/paginacion.model';
import { buildListParams } from '../utils/http-params.helper';
import { ApiCache } from '../utils/api-cache';

const CACHE_KEY = 'acoplados';

@Injectable({ providedIn: 'root' })
export class AcopladosService {
  private apiUrl = `${environment.apiUrl}/acoplados`;

  constructor(private http: HttpClient, private cache: ApiCache) {}

  listar(pagina: number = 1, tamanoPagina: number = 20, filtros?: Record<string, any>): Observable<RespuestaPaginada<Acoplado>> {
    const cacheKey = `${CACHE_KEY}_${pagina}_${tamanoPagina}_${JSON.stringify(filtros ?? {})}`;
    const cached = this.cache.get<RespuestaPaginada<Acoplado>>(cacheKey);
    if (cached) return of(cached);
    return this.http.get<RespuestaPaginada<Acoplado>>(`${this.apiUrl}/`, { params: buildListParams(pagina, tamanoPagina, filtros) })
      .pipe(tap(data => this.cache.set(cacheKey, data)));
  }

  crear(datos: AcopladoCreate): Observable<Acoplado> {
    this.cache.clear(CACHE_KEY);
    return this.http.post<Acoplado>(`${this.apiUrl}/`, datos);
  }

  obtenerPorId(id: string): Observable<Acoplado> {
    return this.http.get<Acoplado>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: string, datos: Partial<AcopladoCreate>): Observable<Acoplado> {
    this.cache.clear(CACHE_KEY);
    return this.http.patch<Acoplado>(`${this.apiUrl}/${id}`, datos);
  }

  cambiarEstado(id: string, estado: string, motivo?: string): Observable<Acoplado> {
    this.cache.clear(CACHE_KEY);
    return this.http.patch<Acoplado>(`${this.apiUrl}/${id}/estado`, { estado, motivo_no_disponible: motivo ?? null });
  }

  darDeBaja(id: string): Observable<Acoplado> {
    this.cache.clear(CACHE_KEY);
    return this.http.delete<Acoplado>(`${this.apiUrl}/${id}`);
  }
}
