export interface CargaCombustible {
  id: string;
  camion_id: string;
  viaje_id: string | null;
  litros: number;
  monto: number;
  fecha: string;
  km_por_litro: number | null;
  registrado_por: string | null;
  creado_en: string;
}

export interface CargaCombustibleCreate {
  camion_id: string;
  viaje_id?: string;
  litros: number;
  monto: number;
  fecha?: string;
  km_por_litro?: number;
}

export interface GastoTotalCamion {
  camion_id: string;
  total_litros: number;
  total_monto: number;
  cantidad_cargas: number;
}
