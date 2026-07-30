import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Observacion, ObservacionCreate } from '../models/observacion.model';

@Injectable({ providedIn: 'root' })
export class ObservacionesService {
  private apiUrl = `${environment.apiUrl}/observaciones`;

  constructor(private http: HttpClient) {}

  listar(choferId: string): Observable<Observacion[]> {
    return this.http.get<Observacion[]>(`${this.apiUrl}/${choferId}`);
  }

  guardar(choferId: string, datos: ObservacionCreate): Observable<Observacion> {
    return this.http.put<Observacion>(`${this.apiUrl}/${choferId}`, datos);
  }
}
