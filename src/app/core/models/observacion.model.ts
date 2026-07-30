export interface Observacion {
  id: string;
  chofer_id: string;
  observacion: string;
  mes: number;
  anio: number;
  creado_en: string;
  creado_por: string | null;
  actualizado_en: string | null;
}

export interface ObservacionCreate {
  observacion: string;
}
