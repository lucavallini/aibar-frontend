export interface Viaje {
  id: string;
  chofer_id: string;
  camion_id: string | null;
  cliente: string | null;
  origen: string;
  destino: string;
  carga: string | null;
  tarifa: number | null;
  kms_recorridos: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: 'pendiente' | 'en_curso' | 'finalizado' | 'cancelado';
  motivo_cancelacion: string | null;
  asignado_por: string;
  autorizado_por: string | null;
  creado_en: string;
}

export interface ViajeCreate {
  chofer_id: string;
  camion_id?: string;
  cliente?: string;
  origen: string;
  destino: string;
  carga?: string;
  tarifa?: number;
  fecha_inicio: string;
}