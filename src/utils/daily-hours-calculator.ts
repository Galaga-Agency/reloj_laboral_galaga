import { format } from "date-fns";
import { RegistroTiempo } from "@/types";

export interface DailyHours {
  date: string; // YYYY-MM-DD (local)
  totalHours: number;
  records: RegistroTiempo[];
}

export class DailyHoursCalculator {
  static calculateDailyHours(
    records: RegistroTiempo[]
  ): Map<string, DailyHours> {
    const dailyMap = new Map<string, DailyHours>();

    // Group by LOCAL date (avoid UTC shifting)
    records.forEach((record) => {
      const dateStr = format(record.fecha, "yyyy-MM-dd");

      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          date: dateStr,
          totalHours: 0,
          records: [],
        });
      }
      dailyMap.get(dateStr)!.records.push(record);
    });

    // Calculate hours per day
    dailyMap.forEach((dailyData) => {
      const dayRecords = dailyData.records
        .slice()
        .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

      let totalSeconds = 0;
      let currentEntrada: Date | null = null;

      for (const record of dayRecords) {
        if (record.tipoRegistro === "entrada") {
          currentEntrada = record.fecha;
        } else if (record.tipoRegistro === "salida" && currentEntrada) {
          const seconds =
            (record.fecha.getTime() - currentEntrada.getTime()) / 1000;
          totalSeconds += Math.max(0, seconds);
          currentEntrada = null;
        }
      }

      // Add paid 15-minute break if worked 6+ hours
      const workedHours = totalSeconds / 3600;
      if (workedHours >= 6) {
        totalSeconds += 15 * 60;
      }

      dailyData.totalHours = totalSeconds / 3600;
    });

    return dailyMap;
  }

  static getHoursForDate(
    dateStr: string,
    dailyHoursMap: Map<string, DailyHours>
  ): number {
    return dailyHoursMap.get(dateStr)?.totalHours ?? 0;
  }
}
