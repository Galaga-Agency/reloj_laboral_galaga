import type { RegistroTiempo, EstadoTrabajo } from "@/types";
import { differenceInMinutes, isToday, format } from "date-fns";

export class ClockStateManager {
  /**
   * Determines the current work state based on TODAY's latest record only
   * Logic: if last record TODAY is 'entrada' -> 'trabajando', if 'salida' -> 'parado'
   */
  static getCurrentState(registros: RegistroTiempo[]): EstadoTrabajo {
    // ONLY look at today's records to determine current state
    const todayRecords = this.getTodayRecords(registros);

    if (todayRecords.length === 0) return "parado";

    // Get the latest record from TODAY only
    const latestTodayRecord = todayRecords[0]; // Assuming sorted by date desc

    return latestTodayRecord.tipoRegistro === "entrada"
      ? "trabajando"
      : "parado";
  }

  /**
   * Gets today's records for a specific user
   */
  static getTodayRecords(registros: RegistroTiempo[]): RegistroTiempo[] {
    return registros.filter((record) => isToday(record.fechaEntrada));
  }

  /**
   * Calculates total worked time for today using simplified entrada/salida pairs
   */
  static calculateWorkedTime(registros: RegistroTiempo[]): string {
    const todayRecords = this.getTodayRecords(registros);
    if (todayRecords.length === 0) return "00:00";

    let totalMinutes = 0;
    let currentEntrada: Date | null = null;

    // Process records in chronological order (reverse the array since it's desc)
    const chronologicalRecords = [...todayRecords].reverse();

    for (const record of chronologicalRecords) {
      if (record.tipoRegistro === "entrada") {
        // Start a new work session
        currentEntrada = record.fechaEntrada;
      } else if (record.tipoRegistro === "salida" && currentEntrada) {
        // End the current work session
        const endTime = record.fechaSalida || record.fechaEntrada;
        totalMinutes += differenceInMinutes(endTime, currentEntrada);
        currentEntrada = null;
      }
    }

    // If currently working (unpaired entrada), add time from entrada to now
    if (currentEntrada) {
      totalMinutes += differenceInMinutes(new Date(), currentEntrada);
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }

  /**
   * Validates if an action can be performed based on current state
   */
  static canPerformAction(
    action: "entrada" | "salida",
    currentState: EstadoTrabajo
  ): { canPerform: boolean; reason?: string } {
    switch (action) {
      case "entrada":
        if (currentState === "trabajando") {
          return { canPerform: false, reason: "Ya estás trabajando" };
        }
        break;

      case "salida":
        if (currentState === "parado") {
          return {
            canPerform: false,
            reason: "No estás trabajando actualmente",
          };
        }
        break;
    }

    return { canPerform: true };
  }

  /**
   * Gets the appropriate button configuration for current state
   */
  static getAvailableActions(currentState: EstadoTrabajo) {
    switch (currentState) {
      case "parado":
        return [
          {
            action: "entrada" as const,
            label: "Iniciar",
            type: "primary" as const,
          },
        ];

      case "trabajando":
        return [
          {
            action: "salida" as const,
            label: "Parar",
            type: "danger" as const,
          },
        ];

      default:
        return [];
    }
  }

  /**
   * Calculate worked minutes for a single day with simplified logic
   */
  static calculateDayMinutes(registrosDia: RegistroTiempo[]): number {
    const registrosOrdenados = registrosDia.sort(
      (a, b) =>
        new Date(a.fechaEntrada).getTime() - new Date(b.fechaEntrada).getTime()
    );

    let totalMinutos = 0;
    let currentEntrada: Date | null = null;

    for (const registro of registrosOrdenados) {
      if (registro.tipoRegistro === "entrada") {
        currentEntrada = new Date(registro.fechaEntrada);
      } else if (registro.tipoRegistro === "salida" && currentEntrada) {
        const salida = registro.fechaSalida
          ? new Date(registro.fechaSalida)
          : new Date(registro.fechaEntrada);
        totalMinutos += differenceInMinutes(salida, currentEntrada);
        currentEntrada = null;
      }
    }

    return totalMinutos;
  }
}
