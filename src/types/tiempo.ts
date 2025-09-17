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

export interface OvertimeData {
  dailyHours: number;
  weeklyHours: number;
  monthlyHours: number;
  yearlyHours: number;
  dailyOvertime: number;
  weeklyOvertime: number;
  monthlyOvertime: number;
  yearlyOvertime: number;
  isOverLimit: boolean;
  warningLevel: "none" | "warning" | "critical";
}


export type EstadoTrabajo = "parado" | "trabajando" | "en_pausa";
