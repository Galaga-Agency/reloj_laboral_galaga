export type AbsenceType =
  | "tardanza"
  | "salida_temprana"
  | "ausencia_parcial"
  | "ausencia_completa"
  | "permiso_medico"
  | "permiso_personal"
  | "dia_libre";


export type AbsenceStatus =
  | "pendiente"
  | "aprobada"
  | "rechazada"
  | "programada";

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
