import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { CampoNormalizable, Sugerencia } from '../models/normalizacion.model';

@Injectable({ providedIn: 'root' })
export class NormalizacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/normalizacion`;

  /**
   * Qué debería decir el campo según el catálogo del backend.
   *
   * Es una ayuda para escribir, no una validación: si la consulta falla el
   * formulario tiene que seguir funcionando igual, así que el error se traga y
   * se devuelve "no hay nada que sugerir".
   */
  sugerir(campo: CampoNormalizable, texto: string): Observable<Sugerencia> {
    const vacia: Sugerencia = { campo, texto, sugerido: null, cambios: [] };
    if (!texto?.trim()) return of(vacia);

    return this.http
      .post<Sugerencia>(`${this.apiUrl}/sugerir`, { campo, texto })
      .pipe(catchError(() => of(vacia)));
  }

  /** Listado completo de valores correctos, para ofrecerlos al elegir. */
  listarCanonicos(campo: CampoNormalizable): Observable<string[]> {
    return this.http
      .get<string[]>(`${this.apiUrl}/canonicos`, { params: { campo } })
      .pipe(catchError(() => of([])));
  }
}
