import {
  format,
  differenceInSeconds,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isToday,
} from "date-fns";
import type { RegistroTiempo } from "@/types";
import { FiPlay, FiSquare, FiClock } from "react-icons/fi";

export type FilterPeriod = "hoy" | "semana" | "mes" | "todo";

export interface WorkStatistics {
  tiempoTotal: string;
  diasTrabajados: number;
  promedioDiario: string;
}

export class TimeRecordsUtils {
  static filterByPeriod(
    registros: RegistroTiempo[],
    period: FilterPeriod
  ): RegistroTiempo[] {
    if (period === "todo") return registros;

    const ahora = new Date();

    switch (period) {
      case "hoy":
        return registros.filter((r) => isToday(new Date(r.fecha)));

      case "semana":
        const inicioSemana = startOfWeek(ahora, { weekStartsOn: 1 });
        const finSemana = endOfWeek(ahora, { weekStartsOn: 1 });
        return registros.filter((r) => {
          const fecha = new Date(r.fecha);
          return fecha >= inicioSemana && fecha <= finSemana;
        });

      case "mes":
        const inicioMes = startOfMonth(ahora);
        const finMes = endOfMonth(ahora);
        return registros.filter((r) => {
          const fecha = new Date(r.fecha);
          return fecha >= inicioMes && fecha <= finMes;
        });

      default:
        return registros;
    }
  }
  
  static calculateStatistics(registros: RegistroTiempo[]): WorkStatistics {
    const registrosPorDia = new Map<string, RegistroTiempo[]>();

    registros.forEach((registro) => {
      const dia = format(new Date(registro.fecha), "yyyy-MM-dd");

      if (!registrosPorDia.has(dia)) {
        registrosPorDia.set(dia, []);
      }
      registrosPorDia.get(dia)!.push(registro);
    });

    let totalSeconds = 0;
    let diasTrabajados = 0;

    registrosPorDia.forEach((registrosDia) => {
      const secondsForDay = this.calculateDaySeconds(registrosDia);

      if (secondsForDay > 0) {
        totalSeconds += secondsForDay;
        diasTrabajados++;
      }
    });

    const promedioSeconds =
      diasTrabajados > 0 ? totalSeconds / diasTrabajados : 0;

    return {
      tiempoTotal: this.formatSecondsToTime(totalSeconds),
      diasTrabajados,
      promedioDiario: this.formatSecondsToTime(promedioSeconds),
    };
  }

  private static calculateDaySeconds(registrosDia: RegistroTiempo[]): number {
    const registrosOrdenados = registrosDia.sort((a, b) => {
      const timeA = new Date(a.fecha).getTime();
      const timeB = new Date(b.fecha).getTime();

      if (timeA !== timeB) {
        return timeA - timeB;
      }

      if (a.tipoRegistro === "entrada" && b.tipoRegistro === "salida") {
        return -1;
      }
      if (a.tipoRegistro === "salida" && b.tipoRegistro === "entrada") {
        return 1;
      }

      return 0;
    });

    let totalSeconds = 0;
    let currentEntrada: Date | null = null;

    for (const registro of registrosOrdenados) {
      if (registro.tipoRegistro === "entrada") {
        currentEntrada = new Date(registro.fecha);
      } else if (registro.tipoRegistro === "salida" && currentEntrada) {
        const salida = new Date(registro.fecha);
        const secondsWorked = differenceInSeconds(salida, currentEntrada);
        totalSeconds += secondsWorked;
        currentEntrada = null;
      }
    }

    const workedHours = totalSeconds / 3600;
    if (workedHours >= 6) {
      totalSeconds += 15 * 60;
    }

    return totalSeconds;
  }

  private static formatSecondsToTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  static getTypeIcon(tipo: string) {
    switch (tipo) {
      case "entrada":
        return <FiPlay className="w-4 h-4 text-activo" />;
      case "salida":
        return <FiSquare className="w-4 h-4 text-inactivo" />;
      default:
        return <FiClock className="w-4 h-4 text-azul-profundo" />;
    }
  }

  static getTypeText(tipo: string): string {
    switch (tipo) {
      case "entrada":
        return "Inicio";
      case "salida":
        return "Parada";
      default:
        return tipo;
    }
  }

  static filterBySearch(
    registros: RegistroTiempo[],
    searchTerm: string
  ): RegistroTiempo[] {
    if (!searchTerm) return registros;

    const busquedaLower = searchTerm.toLowerCase();
    return registros.filter(
      (r) =>
        format(new Date(r.fecha), "PPP", {
          locale: require("date-fns/locale/es"),
        })
          .toLowerCase()
          .includes(busquedaLower) ||
        r.tipoRegistro.toLowerCase().includes(busquedaLower)
    );
  }

  static convertTimeStringToHours(timeString: string): number {
    let totalHours = 0;

    const hoursMatch = timeString.match(/(\d+)h/);
    const minutesMatch = timeString.match(/(\d+)m/);
    const secondsMatch = timeString.match(/(\d+)s/);

    if (hoursMatch) {
      totalHours += parseInt(hoursMatch[1]);
    }

    if (minutesMatch) {
      totalHours += parseInt(minutesMatch[1]) / 60;
    }

    if (secondsMatch) {
      totalHours += parseInt(secondsMatch[1]) / 3600;
    }

    return totalHours;
  }
}

export interface PairedInterval {
  entrada: Date;
  salida: Date | null;
  seconds: number | null;
}

export interface DayPairs {
  dateKey: string; // yyyy-MM-dd (local)
  pairs: PairedInterval[];
  unpairedEntradas: Date[];
  unpairedSalidas: Date[];
  totalSeconds: number; // includes paid break if enabled
  paidBreakIncluded: boolean;
}

/**
 * Pairs sequential entrada→salida by local day.
 * Adds a paid 15-minute break to that day if total worked >= 6 hours (when enabled).
 */
export function pairRecordsByDay(
  registros: RegistroTiempo[],
  opts: { includePaidBreak?: boolean } = {}
): DayPairs[] {
  const { includePaidBreak = true } = opts;

  // Normalize & sort all registros
  const sorted = registros
    .map((r) => ({
      ...r,
      fecha: new Date(r.fecha),
    }))
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  // Group by local yyyy-MM-dd
  const byDay = new Map<string, RegistroTiempo[]>();
  for (const r of sorted) {
    const key = format(r.fecha, "yyyy-MM-dd");
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(r);
  }

  const days: DayPairs[] = [];

  byDay.forEach((regs, dateKey) => {
    let currentEntrada: Date | null = null;
    const pairs: PairedInterval[] = [];
    const unpairedEntradas: Date[] = [];
    const unpairedSalidas: Date[] = [];
    let totalSeconds = 0;

    for (const r of regs) {
      if (r.tipoRegistro === "entrada") {
        // if an entrada is already open, mark it unpaired and start a new one
        if (currentEntrada) unpairedEntradas.push(currentEntrada);
        currentEntrada = new Date(r.fecha);
      } else if (r.tipoRegistro === "salida") {
        const salida = new Date(r.fecha);
        if (currentEntrada) {
          const secs = Math.max(0, differenceInSeconds(salida, currentEntrada));
          pairs.push({ entrada: currentEntrada, salida, seconds: secs });
          totalSeconds += secs;
          currentEntrada = null;
        } else {
          // salida without a preceding entrada
          unpairedSalidas.push(salida);
        }
      }
    }

    // leftover entrada at end of day (open shift)
    if (currentEntrada) {
      pairs.push({ entrada: currentEntrada, salida: null, seconds: null });
      unpairedEntradas.push(currentEntrada);
    }

    // Add paid 15-minute break (once) if worked 6+ hours
    let paidBreakIncluded = false;
    if (includePaidBreak && totalSeconds / 3600 >= 6) {
      totalSeconds += 15 * 60;
      paidBreakIncluded = true;
    }

    days.push({
      dateKey,
      pairs,
      unpairedEntradas,
      unpairedSalidas,
      totalSeconds,
      paidBreakIncluded,
    });
  });

  // Most recent day first
  days.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  return days;
}

