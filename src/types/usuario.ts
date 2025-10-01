export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  firstLogin?: boolean;
  isAdmin: boolean;
  isActive: boolean;
  role: "employee" | "official";
  gdprConsentGiven?: boolean;
  gdprConsentDate?: string;
  emailNotificationsConsent?: boolean;
  geolocationConsent?: boolean;
  consentVersion?: string;
  dias_libres: string[];
  horas_diarias: number;
  horas_viernes: number;
  auto_entry_enabled: boolean;
  include_lunch_break: boolean;
  hora_entrada_min?: string;
  hora_entrada_max?: string;
  hora_salida_min?: string;
  hora_salida_max?: string;
  hora_salida_viernes_min?: string;
  hora_salida_viernes_max?: string;
  hora_inicio_descanso?: string;
  hora_fin_descanso?: string;
  duracion_descanso_min?: number | null;
  duracion_descanso_max?: number | null;
}

export interface OfficialUser {
  id: string;
  nombre: string;
  email: string;
  role: "official";
  created_at: string;
}

export interface EmployeeWithStats {
  id: string;
  nombre: string;
  email: string;
  totalHours: number;
  totalDays: number;
  avgHoursPerDay: number;
  lastEntry?: string;
  isActive: boolean;
}
