export interface Multa {
  id: string;
  camion_id: string;
  chofer_id: string | null;
  viaje_id: string | null;
  motivo: string;
  monto: number | null;
  fecha: string;
  registrado_por: string | null;
  creado_en: string;
}

export interface MultaCreate {
  camion_id: string;
  chofer_id?: string;
  viaje_id?: string;
  motivo: string;
  monto?: number;
  fecha?: string;
}
