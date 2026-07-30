import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Usuario, UsuarioCreate, UsuarioUpdate } from '../models/usuario.model';
import { RespuestaPaginada } from '../models/paginacion.model';
import { buildListParams } from '../utils/http-params.helper';
import { ApiCache } from '../utils/api-cache';

const CACHE_KEY = 'usuarios';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient, private cache: ApiCache) {}

  listar(pagina: number = 1, tamanoPagina: number = 20, filtros?: Record<string, any>): Observable<RespuestaPaginada<Usuario>> {
    const cacheKey = `${CACHE_KEY}_${pagina}_${tamanoPagina}_${JSON.stringify(filtros ?? {})}`;
    const cached = this.cache.get<RespuestaPaginada<Usuario>>(cacheKey);
    if (cached) return of(cached);
    return this.http.get<RespuestaPaginada<Usuario>>(`${this.apiUrl}/`, { params: buildListParams(pagina, tamanoPagina, filtros) })
      .pipe(tap(data => this.cache.set(cacheKey, data)));
  }

  crear(datos: UsuarioCreate): Observable<Usuario> {
    this.cache.clear(CACHE_KEY);
    return this.http.post<Usuario>(`${this.apiUrl}/`, datos);
  }

  actualizar(id: string, datos: UsuarioUpdate): Observable<Usuario> {
    this.cache.clear(CACHE_KEY);
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, datos);
  }

  darDeBaja(id: string): Observable<Usuario> {
    this.cache.clear(CACHE_KEY);
    return this.http.delete<Usuario>(`${this.apiUrl}/${id}`);
  }
}
