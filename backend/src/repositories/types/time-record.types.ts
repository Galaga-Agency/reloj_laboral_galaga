export interface TimeRecordRow {
  id: string;
  usuario_id: string;
  fecha: Date;
  tipo_registro: 'entrada' | 'salida';
  es_simulado: boolean;
  fue_modificado: boolean;
  fecha_ultima_modificacion: Date | null;
  modificado_por_admin: string | null;
  created_at: Date;
  updated_at: Date;
}
