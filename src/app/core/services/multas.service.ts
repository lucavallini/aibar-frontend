import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Multa, MultaCreate } from '../models/multa.model';
import { RespuestaPaginada } from '../models/paginacion.model';
import { buildListParams } from '../utils/http-params.helper';

@Injectable({ providedIn: 'root' })
export class MultasService {
  private apiUrl = `${environment.apiUrl}/multas`;

  constructor(private http: HttpClient) {}

  listar(pagina: number = 1, tamanoPagina: number = 20, filtros?: Record<string, any>): Observable<RespuestaPaginada<Multa>> {
    return this.http.get<RespuestaPaginada<Multa>>(`${this.apiUrl}/`, { params: buildListParams(pagina, tamanoPagina, filtros) });
  }

  crear(datos: MultaCreate): Observable<Multa> {
    return this.http.post<Multa>(`${this.apiUrl}/`, datos);
  }
}