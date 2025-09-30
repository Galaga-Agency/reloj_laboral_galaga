CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_login BOOLEAN NOT NULL DEFAULT TRUE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  role TEXT NOT NULL DEFAULT 'employee',
  dias_libres JSONB DEFAULT '[]'::jsonb,
  horas_diarias NUMERIC(5,2) DEFAULT 8,
  horas_viernes NUMERIC(5,2) DEFAULT 6,
  auto_entry_enabled BOOLEAN DEFAULT FALSE,
  include_lunch_break BOOLEAN DEFAULT FALSE,
  gdpr_consent_given BOOLEAN DEFAULT FALSE,
  gdpr_consent_date TIMESTAMPTZ,
  email_notifications_consent BOOLEAN DEFAULT FALSE,
  geolocation_consent BOOLEAN DEFAULT FALSE,
  consent_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS usuarios_email_idx ON usuarios(email);
