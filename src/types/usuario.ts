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