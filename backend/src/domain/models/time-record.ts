export type RegistroTipo = 'entrada' | 'salida';

export interface TimeRecord {
  id: string;
  usuarioId: string;
  fecha: Date;
  tipoRegistro: RegistroTipo;
  esSimulado: boolean;
  fueModificado: boolean;
  fechaUltimaModificacion?: Date | null;
  modificadoPorAdmin?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
