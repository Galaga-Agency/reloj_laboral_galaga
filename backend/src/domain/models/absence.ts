export type AbsenceType =
  | 'tardanza'
  | 'salida_temprana'
  | 'ausencia_parcial'
  | 'ausencia_completa'
  | 'permiso_medico'
  | 'permiso_personal'
  | 'dia_libre';

export type AbsenceStatus =
  | 'pendiente'
  | 'aprobada'
  | 'rechazada'
  | 'programada';

export interface Absence {
  id: string;
  usuarioId: string;
  fecha: Date;
  tipoAusencia: AbsenceType;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  razon: string;
  comentarios?: string | null;
  estado: AbsenceStatus;
  aprobadoPor?: string | null;
  fechaAprobacion?: Date | null;
  adjuntoUrl?: string | null;
  adjuntoNombre?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  editedBy?: string | null;
  editedAt?: Date | null;
  editedFecha?: Date | null;
  editedHoraInicio?: string | null;
  editedHoraFin?: string | null;
  editedRazon?: string | null;
  editedComentarios?: string | null;
}
