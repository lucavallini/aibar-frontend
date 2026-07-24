export interface Chofer {
  id: string;
  nombre_completo: string;
  dni: string | null;
  telefono: string | null;
  estado: 'disponible' | 'viajando' | 'inactivo';
  camion_id: string | null;
  activo: boolean;
  creado_en: string;
  creado_por: string | null;
}

export interface ChoferCreate {
  nombre_completo: string;
  dni?: string;
  telefono?: string;
  camion_id?: string;
}