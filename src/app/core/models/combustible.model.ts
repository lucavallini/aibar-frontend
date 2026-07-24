export interface CargaCombustible {
  id: string;
  camion_id: string;
  viaje_id: string | null;
  litros: number;
  monto: number;
  fecha: string;
  kms_al_momento: number | null;
  registrado_por: string | null;
  creado_en: string;
}

export interface CargaCombustibleCreate {
  camion_id: string;
  viaje_id?: string;
  litros: number;
  monto: number;
  fecha?: string;
  kms_al_momento?: number;
}