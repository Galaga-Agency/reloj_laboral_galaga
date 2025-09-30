CREATE TABLE IF NOT EXISTS access_logs (
  id BIGSERIAL PRIMARY KEY,
  official_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  accessed_user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL,
  accessed_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS access_logs_official_idx ON access_logs(official_id);
CREATE INDEX IF NOT EXISTS access_logs_created_idx ON access_logs(created_at DESC);
