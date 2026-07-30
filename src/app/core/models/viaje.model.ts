export interface Viaje {
  id: string;
  chofer_id: string;
  camion_id: string | null;
  camion_id_2: string | null;
  viaje_vuelta_id: string | null;
  viaje_vuelta?: Viaje | null;
  cliente: string | null;
  origen: string;
  destino: string;
  carga: string | null;
  tarifa: number | null;
  kms_recorridos: number | null;
  kms_descargado: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: 'pendiente' | 'en_curso' | 'finalizado' | 'cancelado';
  motivo_cancelacion: string | null;
  asignado_por: string;
  autorizado_por: string | null;
  creado_en: string;
  litros_combustible: number | null;
  km_por_litro: number | null;
}

export interface ViajeCreate {
  chofer_id: string;
  camion_id?: string;
  camion_id_2?: string;
  viaje_vuelta_id?: string;
  cliente?: string;
  origen: string;
  destino: string;
  carga?: string;
  tarifa?: number;
  fecha_inicio: string;
}

export interface ViajeReanudar {
  chofer_id?: string;
  camion_id?: string;
  camion_id_2?: string;
  cliente?: string;
  origen?: string;
  destino?: string;
  carga?: string;
  tarifa?: number;
  fecha_inicio?: string;
}

export interface RendimientoCombustible {
  chofer_id: string;
  total_kms: number;
  total_litros: number;
  km_por_litro: number | null;
  litros_100km: number | null;
}