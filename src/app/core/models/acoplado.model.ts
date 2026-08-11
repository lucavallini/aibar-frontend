import { EstadoFlota } from './estado.model';

export interface Acoplado {
  id: string;
  patente: string;
  tipo: string | null;
  empresa_id: string | null;
  activo: boolean;
  estado: EstadoFlota;
  motivo_no_disponible: string | null;
  creado_en: string;
}

export interface AcopladoCreate {
  patente: string;
  tipo?: string;
  empresa_id?: string;
}
