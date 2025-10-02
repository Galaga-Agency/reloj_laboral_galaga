export type TeleworkingLocation = "office" | "remote";
export type TeleworkStatus = "pendiente" | "aprobada" | "rechazada";

export interface TeleworkingSchedule {
  id: string;
  usuarioId: string;
  fecha: Date;
  location: TeleworkingLocation;
  createdBy: string;
  createdByName: string;
  notes?: string | null;
  estado: TeleworkStatus;
  aprobadoPor?: string | null;
  fechaAprobacion?: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
