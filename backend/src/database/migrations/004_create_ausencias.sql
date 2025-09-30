CREATE TABLE IF NOT EXISTS ausencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  tipo_ausencia TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  razon TEXT NOT NULL,
  comentarios TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  aprobado_por UUID REFERENCES usuarios(id),
  fecha_aprobacion TIMESTAMPTZ,
  adjunto_url TEXT,
  adjunto_nombre TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES usuarios(id),
  edited_by UUID REFERENCES usuarios(id),
  edited_at TIMESTAMPTZ,
  edited_fecha DATE,
  edited_hora_inicio TEXT,
  edited_hora_fin TEXT,
  edited_razon TEXT,
  edited_comentarios TEXT
);

CREATE INDEX IF NOT EXISTS ausencias_usuario_idx ON ausencias(usuario_id);
CREATE INDEX IF NOT EXISTS ausencias_fecha_idx ON ausencias(fecha DESC);
