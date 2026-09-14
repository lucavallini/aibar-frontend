import { RespuestaPaginada } from './paginacion.model';

import { EstadoFlota } from './estado.model';

export type EstadoChofer = EstadoFlota | 'inactivo' | 'licencia';

export interface Chofer {
  id: string;
  nombre_completo: string;
  dni: string | null;
  telefono: string | null;
  estado: EstadoChofer;
  camion_id: string | null;
  empresa_id: string | null;
  activo: boolean;
  motivo_no_disponible: string | null;
  creado_en: string;
  creado_por: string | null;
  kms_mes_actual: number | null;
  kms_periodo: number | null;
  viajes_periodo: number | null;
  promedio_kms_viaje: number | null;
  carnet_vencimiento: string | null;
  carga_peligrosa_vencimiento: string | null;
}

export interface ChoferCreate {
  nombre_completo: string;
  dni?: string;
  telefono?: string;
  camion_id?: string;
  empresa_id?: string;
  carnet_vencimiento?: string | null;
  carga_peligrosa_vencimiento?: string | null;
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
  estado: EstadoChofer;
  empresa_id: string | null;
  activo: boolean;
  kms_mes_actual: number;
  historico: KmsPorMes[];
}

export interface ResumenPeriodo {
  desde: string;
  hasta: string | null;
  total_kms: number;
  total_viajes: number;
}

/** Listado de choferes con el acumulado del período, tal como lo arma el backend. */
export interface ChoferesPaginados extends RespuestaPaginada<Chofer> {
  periodo: ResumenPeriodo | null;
}
