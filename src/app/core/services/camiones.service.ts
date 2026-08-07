import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Camion, CamionCreate } from '../models/camion.model';
import { RespuestaPaginada } from '../models/paginacion.model';
import { buildListParams } from '../utils/http-params.helper';
import { ApiCache } from '../utils/api-cache';

const CACHE_KEY = 'camiones';

@Injectable({ providedIn: 'root' })
export class CamionesService {
  private apiUrl = `${environment.apiUrl}/camiones`;

  constructor(private http: HttpClient, private cache: ApiCache) {}

  listar(pagina: number = 1, tamanoPagina: number = 20, filtros?: Record<string, any>): Observable<RespuestaPaginada<Camion>> {
    const cacheKey = `${CACHE_KEY}_${pagina}_${tamanoPagina}_${JSON.stringify(filtros ?? {})}`;
    const cached = this.cache.get<RespuestaPaginada<Camion>>(cacheKey);
    if (cached) return of(cached);
    return this.http.get<RespuestaPaginada<Camion>>(`${this.apiUrl}/`, { params: buildListParams(pagina, tamanoPagina, filtros) })
      .pipe(tap(data => this.cache.set(cacheKey, data)));
  }

  crear(datos: CamionCreate): Observable<Camion> {
    this.cache.clear(CACHE_KEY);
    return this.http.post<Camion>(`${this.apiUrl}/`, datos);
  }

  obtenerPorId(id: string): Observable<Camion> {
    return this.http.get<Camion>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: string, datos: Partial<CamionCreate>): Observable<Camion> {
    this.cache.clear(CACHE_KEY);
    return this.http.patch<Camion>(`${this.apiUrl}/${id}`, datos);
  }

  asignarAsociados(id: string, choferId: string | null, acopladoId: string | null): Observable<Camion> {
    this.cache.clear(CACHE_KEY);
    return this.http.patch<Camion>(`${this.apiUrl}/${id}/asignacion`, { chofer_id: choferId, acoplado_id: acopladoId });
  }

  cambiarEstado(id: string, estado: string, motivo?: string): Observable<Camion> {
    this.cache.clear(CACHE_KEY);
    return this.http.patch<Camion>(`${this.apiUrl}/${id}/estado`, { estado, motivo_no_disponible: motivo ?? null });
  }

  darDeBaja(id: string): Observable<Camion> {
    this.cache.clear(CACHE_KEY);
    return this.http.delete<Camion>(`${this.apiUrl}/${id}`);
  }
}
