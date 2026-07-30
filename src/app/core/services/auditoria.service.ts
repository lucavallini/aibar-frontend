import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Auditoria } from '../models/auditoria.model';
import { RespuestaPaginada } from '../models/paginacion.model';
import { buildListParams } from '../utils/http-params.helper';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private apiUrl = `${environment.apiUrl}/auditoria`;

  constructor(private http: HttpClient) {}

  listar(pagina: number = 1, tamanoPagina: number = 20, filtros?: Record<string, any>): Observable<RespuestaPaginada<Auditoria>> {
    return this.http.get<RespuestaPaginada<Auditoria>>(`${this.apiUrl}/`, { params: buildListParams(pagina, tamanoPagina, filtros) });
  }
}