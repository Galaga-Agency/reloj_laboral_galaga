export interface TimeCorrectionRow {
  id: string;
  registro_tiempo_id: string;
  usuario_id: string;
  admin_user_id: string | null;
  admin_user_name: string | null;
  campo_modificado: string;
  valor_anterior: string;
  valor_nuevo: string;
  razon: string;
  fecha_correccion: Date;
  estado: string | null;
  revisado_por: string | null;
  revisado_por_nombre: string | null;
  fecha_revision: Date | null;
  ip_address: string | null;
  user_agent: string | null;
}
