CREATE TABLE IF NOT EXISTS registros_tiempo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha TIMESTAMPTZ NOT NULL,
  tipo_registro TEXT NOT NULL CHECK (tipo_registro IN ('entrada', 'salida')),
  es_simulado BOOLEAN NOT NULL DEFAULT FALSE,
  fue_modificado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_ultima_modificacion TIMESTAMPTZ,
  modificado_por_admin UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS registros_tiempo_usuario_idx ON registros_tiempo(usuario_id);
CREATE INDEX IF NOT EXISTS registros_tiempo_fecha_idx ON registros_tiempo(fecha DESC);
