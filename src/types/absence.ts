export type AbsenceType =
  | "tardanza" // Late arrival
  | "salida_temprana" // Early departure
  | "ausencia_parcial" // Partial absence (middle of day)
  | "ausencia_completa" // Full day absence
  | "permiso_medico" // Medical leave
  | "permiso_personal"; // Personal leave

export type AbsenceStatus = "pendiente" | "aprobada" | "rechazada";

export interface Absence {
  id: string;
  usuarioId: string;
  fecha: Date;
  tipoAusencia: AbsenceType;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  razon: string;
  comentarios?: string;
  estado: AbsenceStatus;
  aprobadoPor?: string;
  fechaAprobacion?: Date;
  adjuntoUrl?: string;
  adjuntoNombre?: string;
  createdAt: Date;
  updatedAt: Date;
}
