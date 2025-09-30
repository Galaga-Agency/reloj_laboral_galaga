export type CorrectionStatus = 'pendiente' | 'aprobado' | 'rechazado';

export interface TimeCorrection {
  id: string;
  registroTiempoId: string;
  usuarioId: string;
  adminUserId?: string | null;
  adminUserName?: string | null;
  campoModificado: 'fecha' | 'tipo_registro' | 'multiple';
  valorAnterior: string;
  valorNuevo: string;
  razon: string;
  fechaCorreccion: Date;
  estado?: CorrectionStatus;
  revisadoPor?: string | null;
  revisadoPorNombre?: string | null;
  fechaRevision?: Date | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}
