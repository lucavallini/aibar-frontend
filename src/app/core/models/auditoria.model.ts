export interface Auditoria {
  id: string;
  usuario_id: string;
  tipo_accion: string;
  entidad: string;
  entidad_id: string;
  detalle: string | null;
  fecha_hora: string;
}
