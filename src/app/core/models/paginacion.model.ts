export interface RespuestaPaginada<T> {
  items: T[];
  total: number;
  pagina: number;
  tamano_pagina: number;
  total_paginas: number;
}
