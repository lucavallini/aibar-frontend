/** Espejo de app/models/normalizacion.py del backend. */

export type CampoNormalizable = 'lugar' | 'carga';

export interface CambioSugerido {
  original: string;
  sugerido: string;
  /** 'conocido' = equivalencia ya guardada; 'parecido' = se deduce por ortografía. */
  motivo: 'conocido' | 'parecido';
}

export interface Sugerencia {
  campo: CampoNormalizable;
  texto: string;
  /** null cuando no hay nada que corregir. */
  sugerido: string | null;
  cambios: CambioSugerido[];
}
