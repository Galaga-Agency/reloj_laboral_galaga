import type { RegistroTiempo, EstadoTrabajo } from "@/types";
import { differenceInMinutes, isToday, format } from "date-fns";

export class ClockStateManager {
  /**
   * Determines the current work state based on TODAY's latest record only
   * Logic: if last record TODAY is 'entrada' -> 'trabajando', if 'salida' -> 'parado'
   */
  static getCurrentState(registros: RegistroTiempo[]): EstadoTrabajo {
    const todayRecords = this.getTodayRecords(registros);

    if (todayRecords.length === 0) return "parado";

    const latestTodayRecord = todayRecords[0];

    return latestTodayRecord.tipoRegistro === "entrada"
      ? "trabajando"
      : "parado";
  }

  /**
   * Gets today's records for a specific user
   */
  static getTodayRecords(registros: RegistroTiempo[]): RegistroTiempo[] {
    return registros.filter((record) => isToday(record.fecha));
  }

  /**
   * Calculates total worked time for today using simplified entrada/salida pairs
   */
  static calculateWorkedTime(registros: RegistroTiempo[]): string {
    const todayRecords = this.getTodayRecords(registros);
    if (todayRecords.length === 0) return "00:00";

    let totalMinutes = 0;
    let currentEntrada: Date | null = null;

    const chronologicalRecords = [...todayRecords].reverse();

    for (const record of chronologicalRecords) {
      if (record.tipoRegistro === "entrada") {
        currentEntrada = record.fecha;
      } else if (record.tipoRegistro === "salida" && currentEntrada) {
        totalMinutes += differenceInMinutes(record.fecha, currentEntrada);
        currentEntrada = null;
      }
    }

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
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    let totalMinutos = 0;
    let currentEntrada: Date | null = null;

    for (const registro of registrosOrdenados) {
      if (registro.tipoRegistro === "entrada") {
        currentEntrada = new Date(registro.fecha);
      } else if (registro.tipoRegistro === "salida" && currentEntrada) {
        totalMinutos += differenceInMinutes(
          new Date(registro.fecha),
          currentEntrada
        );
        currentEntrada = null;
      }
    }

    return totalMinutos;
  }
}
