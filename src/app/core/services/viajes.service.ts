import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Viaje, ViajeCreate, ViajeReanudar, RendimientoCombustible } from '../models/viaje.model';
import { RespuestaPaginada } from '../models/paginacion.model';
import { buildListParams } from '../utils/http-params.helper';

@Injectable({ providedIn: 'root' })
export class ViajesService {
  private apiUrl = `${environment.apiUrl}/viajes`;

  constructor(private http: HttpClient) {}

  listar(pagina: number = 1, tamanoPagina: number = 20, filtros?: Record<string, any>): Observable<RespuestaPaginada<Viaje>> {
    return this.http.get<RespuestaPaginada<Viaje>>(`${this.apiUrl}/`, { params: buildListParams(pagina, tamanoPagina, filtros) });
  }

  crear(datos: ViajeCreate): Observable<Viaje> {
    return this.http.post<Viaje>(`${this.apiUrl}/`, datos);
  }

  iniciar(id: string): Observable<Viaje> {
    return this.http.post<Viaje>(`${this.apiUrl}/${id}/iniciar`, {});
  }

  finalizar(id: string, fechaFin: string, kmsRecorridos: number, litrosCombustible?: number, kmsDescargado?: number): Observable<Viaje> {
    const body: any = { fecha_fin: fechaFin, kms_recorridos: kmsRecorridos };
    if (litrosCombustible) body.litros_combustible = litrosCombustible;
    if (kmsDescargado) body.kms_descargado = kmsDescargado;
    return this.http.post<Viaje>(`${this.apiUrl}/${id}/finalizar`, body);
  }

  cancelar(id: string, motivoCancelacion: string): Observable<Viaje> {
    return this.http.post<Viaje>(`${this.apiUrl}/${id}/cancelar`, {
      motivo_cancelacion: motivoCancelacion
    });
  }

  reanudar(id: string, datos: ViajeReanudar): Observable<Viaje> {
    return this.http.post<Viaje>(`${this.apiUrl}/${id}/reanudar`, datos);
  }

  agregarVuelta(viajeId: string, datos: ViajeCreate): Observable<Viaje> {
    return this.http.post<Viaje>(`${this.apiUrl}/${viajeId}/vuelta`, datos);
  }

  rendimientoCombustible(choferId: string): Observable<RendimientoCombustible> {
    return this.http.get<RendimientoCombustible>(`${this.apiUrl}/rendimiento-combustible/${choferId}`);
  }
}