export interface UserRow {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  first_login: boolean;
  is_admin: boolean;
  is_active: boolean;
  role: string;
  dias_libres: string[] | null;
  horas_diarias: number | null;
  horas_viernes: number | null;
  auto_entry_enabled: boolean | null;
  include_lunch_break: boolean | null;
  gdpr_consent_given: boolean | null;
  gdpr_consent_date: Date | null;
  email_notifications_consent: boolean | null;
  geolocation_consent: boolean | null;
  consent_version: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface WorkSettingsRow {
  usuario_id: string;
  horas_diarias: number;
  horas_viernes: number;
  include_lunch_break: boolean;
  auto_entry_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}
