import { RegistroTiempo } from "@/types";

export interface DailyHours {
  date: string; // YYYY-MM-DD
  totalHours: number;
  records: RegistroTiempo[];
}

export class DailyHoursCalculator {
  static calculateDailyHours(
    records: RegistroTiempo[]
  ): Map<string, DailyHours> {
    const dailyMap = new Map<string, DailyHours>();

    // Group records by date
    records.forEach((record) => {
      const dateStr = record.fechaEntrada.toISOString().split("T")[0];

      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          date: dateStr,
          totalHours: 0,
          records: [],
        });
      }

      dailyMap.get(dateStr)!.records.push(record);
    });

    // Calculate hours for each day
    dailyMap.forEach((dailyData, dateStr) => {
      const dayRecords = dailyData.records.sort(
        (a, b) => a.fechaEntrada.getTime() - b.fechaEntrada.getTime()
      );

      let totalHours = 0;
      let currentEntrada: Date | null = null;

      for (const record of dayRecords) {
        if (record.tipoRegistro === "entrada") {
          currentEntrada = record.fechaEntrada;
        } else if (
          record.tipoRegistro === "salida" &&
          currentEntrada &&
          record.fechaSalida
        ) {
          const hours =
            (record.fechaSalida.getTime() - currentEntrada.getTime()) /
            (1000 * 60 * 60);
          totalHours += Math.max(0, hours);
          currentEntrada = null;
        }
      }

      dailyData.totalHours = totalHours;
    });

    return dailyMap;
  }

  static getHoursForDate(
    dateStr: string,
    dailyHoursMap: Map<string, DailyHours>
  ): number {
    return dailyHoursMap.get(dateStr)?.totalHours || 0;
  }
}
