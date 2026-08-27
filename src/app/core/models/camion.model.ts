import { EstadoFlota } from './estado.model';

export interface Camion {
  id: string;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  tipo: string | null;
  empresa_id: string | null;
  acoplado_id: string | null;
  activo: boolean;
  estado: EstadoFlota;
  motivo_no_disponible: string | null;
  creado_en: string;
}

export interface CamionCreate {
  patente: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  tipo?: string;
  empresa_id?: string;
}
