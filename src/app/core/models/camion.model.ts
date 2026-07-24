export interface Camion {
  id: string;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  tipo: string | null;
  activo: boolean;
  creado_en: string;
}

export interface CamionCreate {
  patente: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  tipo?: string;
}