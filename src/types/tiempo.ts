export interface RegistroTiempo {
  id: string;
  usuarioId: string;
  fechaEntrada: Date;
  fechaSalida?: Date;
  tipoRegistro: "entrada" | "salida";
  esSimulado: boolean;
  fueModificado?: boolean;
  fechaUltimaModificacion?: Date;
  modificadoPorAdmin?: string;
  nombreAdminModificador?: string;
}

export type EstadoTrabajo = "parado" | "trabajando" | "en_pausa";
