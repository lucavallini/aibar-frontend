export interface Usuario {
  id: string;
  nombre_usuario: string;
  nombre_completo: string;
  dni: string;
  rol: 'administrador' | 'empleado';
  activo: boolean;
  creado_en: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}