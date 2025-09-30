export interface WorkSettings {
  horasDiarias: number;
  horasViernes: number;
  includeLunchBreak: boolean;
  autoEntryEnabled: boolean;
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  firstLogin: boolean;
  isAdmin: boolean;
  isActive: boolean;
  role: string;
  diasLibres: string[];
  horasDiarias: number;
  horasViernes: number;
  autoEntryEnabled: boolean;
  includeLunchBreak: boolean;
  gdprConsentGiven: boolean;
  gdprConsentDate?: Date | null;
  emailNotificationsConsent: boolean;
  geolocationConsent: boolean;
  consentVersion?: string | null;
  createdAt: Date;
  updatedAt: Date;
  workSettings?: WorkSettings | null;
}

export type PublicUser = Omit<User, 'passwordHash'>;
