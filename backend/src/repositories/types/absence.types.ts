export interface AbsenceRow {
  id: string;
  usuario_id: string;
  fecha: Date;
  tipo_ausencia: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  razon: string;
  comentarios: string | null;
  estado: string;
  aprobado_por: string | null;
  fecha_aprobacion: Date | null;
  adjunto_url: string | null;
  adjunto_nombre: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  edited_by: string | null;
  edited_at: Date | null;
  edited_fecha: Date | null;
  edited_hora_inicio: string | null;
  edited_hora_fin: string | null;
  edited_razon: string | null;
  edited_comentarios: string | null;
}
