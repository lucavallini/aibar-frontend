import { HttpParams } from '@angular/common/http';

export function buildListParams(pagina: number, tamanoPagina: number, filtros?: Record<string, any>): HttpParams {
  let params = new HttpParams()
    .set('pagina', pagina.toString())
    .set('tamano_pagina', tamanoPagina.toString());

  if (filtros) {
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
  }

  return params;
}
