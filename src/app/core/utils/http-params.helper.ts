import { HttpParams } from '@angular/common/http';

/** Agrega los filtros con valor a los parámetros, descartando vacíos y nulos. */
export function buildParams(filtros?: Record<string, any>, base = new HttpParams()): HttpParams {
  if (!filtros) return base;

  return Object.entries(filtros).reduce(
    (params, [k, v]) =>
      v !== undefined && v !== null && v !== '' ? params.set(k, String(v)) : params,
    base,
  );
}

export function buildListParams(
  pagina: number,
  tamanoPagina: number,
  filtros?: Record<string, any>,
): HttpParams {
  return buildParams(
    filtros,
    new HttpParams().set('pagina', pagina.toString()).set('tamano_pagina', tamanoPagina.toString()),
  );
}
