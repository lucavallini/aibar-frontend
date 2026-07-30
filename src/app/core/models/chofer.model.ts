export interface Chofer {
  id: string;
  nombre_completo: string;
  dni: string | null;
  telefono: string | null;
  estado: 'disponible' | 'viajando' | 'inactivo' | 'licencia';
  camion_id: string | null;
  empresa_id: string | null;
  activo: boolean;
  creado_en: string;
  creado_por: string | null;
}

export interface ChoferCreate {
  nombre_completo: string;
  dni?: string;
  telefono?: string;
  camion_id?: string;
  empresa_id?: string;
}

export interface KmsPorMes {
  mes: string;
  kms: number;
}

export interface ChoferDetalle {
  id: string;
  nombre_completo: string;
  dni: string | null;
  telefono: string | null;
  estado: string;
  empresa_id: string | null;
  activo: boolean;
  kms_mes_actual: number;
  historico: KmsPorMes[];
}