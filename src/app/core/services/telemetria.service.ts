import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Flota, FiltrosFlota, Recorrido } from '../models/telemetria.model';
import { buildParams } from '../utils/http-params.helper';

@Injectable({ providedIn: 'root' })
export class TelemetriaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/telemetria`;

  /**
   * No se cachea del lado del cliente: es información en vivo y el backend ya
   * amortigua las consultas contra el servicio de rastreo.
   */
  obtenerFlota(filtros?: FiltrosFlota): Observable<Flota> {
    return this.http.get<Flota>(`${this.apiUrl}/flota`, { params: buildParams(filtros) });
  }

  /** Traza de un viaje. Es pesada, así que se pide solo cuando el usuario la abre. */
  obtenerRecorrido(viajeId: string): Observable<Recorrido> {
    return this.http.get<Recorrido>(`${this.apiUrl}/viajes/${viajeId}/recorrido`);
  }
}
