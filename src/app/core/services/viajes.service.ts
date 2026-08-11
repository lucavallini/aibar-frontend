import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Viaje, ViajeCreate, ViajeReanudar, ViajeFinalizar, RendimientoCombustible } from '../models/viaje.model';
import { RespuestaPaginada } from '../models/paginacion.model';
import { buildListParams } from '../utils/http-params.helper';
import { ApiCache } from '../utils/api-cache';

@Injectable({ providedIn: 'root' })
export class ViajesService {
  private apiUrl = `${environment.apiUrl}/viajes`;

  constructor(private http: HttpClient, private cache: ApiCache) {}

  listar(pagina: number = 1, tamanoPagina: number = 20, filtros?: Record<string, any>): Observable<RespuestaPaginada<Viaje>> {
    return this.http.get<RespuestaPaginada<Viaje>>(`${this.apiUrl}/`, { params: buildListParams(pagina, tamanoPagina, filtros) });
  }

  crear(datos: ViajeCreate): Observable<Viaje> {
    this.cache.invalidarFlota();
    return this.http.post<Viaje>(`${this.apiUrl}/`, datos);
  }

  iniciar(id: string): Observable<Viaje> {
    this.cache.invalidarFlota();
    return this.http.post<Viaje>(`${this.apiUrl}/${id}/iniciar`, {});
  }

  finalizar(id: string, datos: ViajeFinalizar): Observable<Viaje> {
    const body: Record<string, unknown> = { fecha_fin: datos.fecha_fin, kms_recorridos: datos.kms_recorridos, solo_ida: datos.solo_ida ?? false };
    if (datos.litros_combustible) body['litros_combustible'] = datos.litros_combustible;
    if (datos.kms_descargado) body['kms_descargado'] = datos.kms_descargado;
    this.cache.invalidarFlota();
    return this.http.post<Viaje>(`${this.apiUrl}/${id}/finalizar`, body);
  }

  cancelar(id: string, motivoCancelacion: string): Observable<Viaje> {
    this.cache.invalidarFlota();
    return this.http.post<Viaje>(`${this.apiUrl}/${id}/cancelar`, {
      motivo_cancelacion: motivoCancelacion
    });
  }

  reanudar(id: string, datos: ViajeReanudar): Observable<Viaje> {
    this.cache.invalidarFlota();
    return this.http.post<Viaje>(`${this.apiUrl}/${id}/reanudar`, datos);
  }

  agregarVuelta(viajeId: string, datos: ViajeCreate): Observable<Viaje> {
    this.cache.invalidarFlota();
    return this.http.post<Viaje>(`${this.apiUrl}/${viajeId}/vuelta`, datos);
  }

  rendimientoCombustible(choferId: string): Observable<RendimientoCombustible> {
    return this.http.get<RendimientoCombustible>(`${this.apiUrl}/rendimiento-combustible/${choferId}`);
  }
}