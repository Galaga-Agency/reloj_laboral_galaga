CREATE TABLE IF NOT EXISTS time_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_tiempo_id UUID NOT NULL REFERENCES registros_tiempo(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES usuarios(id),
  admin_user_name TEXT,
  campo_modificado TEXT NOT NULL,
  valor_anterior TEXT NOT NULL,
  valor_nuevo TEXT NOT NULL,
  razon TEXT NOT NULL,
  fecha_correccion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado TEXT DEFAULT 'aprobado',
  revisado_por UUID REFERENCES usuarios(id),
  revisado_por_nombre TEXT,
  fecha_revision TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS time_corrections_record_idx ON time_corrections(registro_tiempo_id);
