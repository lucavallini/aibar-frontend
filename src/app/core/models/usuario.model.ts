export interface Usuario {
  id: string;
  nombre_usuario: string;
  nombre_completo: string;
  dni: string;
  rol: 'administrador' | 'empleado' | 'aibar';
  activo: boolean;
  creado_en: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UsuarioCreate {
  nombre_completo: string;
  dni: string;
  password: string;
  rol: string;
}

export interface UsuarioUpdate {
  nombre_completo?: string;
  dni?: string;
  rol?: string;
}