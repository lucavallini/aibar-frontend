import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Observacion, ObservacionCreate } from '../models/observacion.model';
import { ApiCache } from '../utils/api-cache';

const CACHE_KEY = 'observaciones';

@Injectable({ providedIn: 'root' })
export class ObservacionesService {
  private apiUrl = `${environment.apiUrl}/observaciones`;

  constructor(private http: HttpClient, private cache: ApiCache) {}

  listar(choferId: string): Observable<Observacion[]> {
    const cacheKey = `${CACHE_KEY}_${choferId}`;
    const cached = this.cache.get<Observacion[]>(cacheKey);
    if (cached) return of(cached);
    return this.http.get<Observacion[]>(`${this.apiUrl}/${choferId}`)
      .pipe(tap(data => this.cache.set(cacheKey, data)));
  }

  listarMesActual(): Observable<Observacion[]> {
    const cacheKey = `${CACHE_KEY}_mes-actual`;
    const cached = this.cache.get<Observacion[]>(cacheKey);
    if (cached) return of(cached);
    return this.http.get<Observacion[]>(`${this.apiUrl}/mes-actual`)
      .pipe(tap(data => this.cache.set(cacheKey, data)));
  }

  guardar(choferId: string, datos: ObservacionCreate): Observable<Observacion> {
    this.cache.clear(CACHE_KEY);
    return this.http.put<Observacion>(`${this.apiUrl}/${choferId}`, datos);
  }
}
