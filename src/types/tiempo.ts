export interface RegistroTiempo {
  id: string;
  usuarioId: string;
  fechaEntrada: Date;
  fechaSalida?: Date;
  tipoRegistro: "entrada" | "salida";
  esSimulado?: boolean;
}

export type EstadoTrabajo = "parado" | "trabajando"; 
 67