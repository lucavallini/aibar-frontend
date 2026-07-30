export interface Acoplado {
  id: string;
  patente: string;
  tipo: string | null;
  empresa_id: string | null;
  activo: boolean;
  creado_en: string;
}

export interface AcopladoCreate {
  patente: string;
  tipo?: string;
  empresa_id?: string;
}
