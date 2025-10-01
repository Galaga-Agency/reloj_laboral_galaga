export type TeleworkingLocation = "office" | "remote";

export interface TeleworkingSchedule {
  id: string;
  usuarioId: string;
  fecha: Date;
  location: TeleworkingLocation;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface DailyTeleworkingView {
  office: Array<{
    usuario: {
      id: string;
      nombre: string;
      email: string;
    };
    schedule: TeleworkingSchedule;
  }>;
  remote: Array<{
    usuario: {
      id: string;
      nombre: string;
      email: string;
    };
    schedule: TeleworkingSchedule;
  }>;
  unscheduled: Array<{
    id: string;
    nombre: string;
    email: string;
  }>;
}
