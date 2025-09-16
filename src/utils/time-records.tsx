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
        return registros.filter((r) => isToday(new Date(r.fechaEntrada)));

      case "semana":
        const inicioSemana = startOfWeek(ahora, { weekStartsOn: 1 });
        const finSemana = endOfWeek(ahora, { weekStartsOn: 1 });
        return registros.filter((r) => {
          const fecha = new Date(r.fechaEntrada);
          return fecha >= inicioSemana && fecha <= finSemana;
        });

      case "mes":
        const inicioMes = startOfMonth(ahora);
        const finMes = endOfMonth(ahora);
        return registros.filter((r) => {
          const fecha = new Date(r.fechaEntrada);
          return fecha >= inicioMes && fecha <= finMes;
        });

      default:
        return registros;
    }
  }

  static calculateStatistics(registros: RegistroTiempo[]): WorkStatistics {
    const registrosPorDia = new Map<string, RegistroTiempo[]>();

    registros.forEach((registro) => {
      const actionDate =
        registro.tipoRegistro === "salida" && registro.fechaSalida
          ? new Date(registro.fechaSalida)
          : new Date(registro.fechaEntrada);

      const dia = format(actionDate, "yyyy-MM-dd");

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
      const timeA = new Date(a.fechaEntrada).getTime();
      const timeB = new Date(b.fechaEntrada).getTime();

      // First sort by time
      if (timeA !== timeB) {
        return timeA - timeB;
      }

      // If same time, entrada comes before salida
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
        currentEntrada = new Date(registro.fechaEntrada);
      } else if (registro.tipoRegistro === "salida" && currentEntrada) {
        const salida = registro.fechaSalida
          ? new Date(registro.fechaSalida)
          : new Date(registro.fechaEntrada);

        const secondsWorked = differenceInSeconds(salida, currentEntrada);
        totalSeconds += secondsWorked;
        currentEntrada = null;
      }
    }

    // Add mandatory 15-minute break if worked more than 6 hours
    const workedHours = totalSeconds / 3600;
    if (workedHours >= 6) {
      totalSeconds += 15 * 60; // Add 15 minutes in seconds
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
        format(new Date(r.fechaEntrada), "PPP", {
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
