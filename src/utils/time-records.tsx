import {
  format,
  differenceInMinutes,
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
  /**
   * Filter records by time period
   */
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

  /**
   * Calculate work statistics from time records using simplified entrada/salida logic
   */
  static calculateStatistics(registros: RegistroTiempo[]): WorkStatistics {
    // Group records by day
    const registrosPorDia = new Map<string, RegistroTiempo[]>();

    registros.forEach((registro) => {
      const dia = format(new Date(registro.fechaEntrada), "yyyy-MM-dd");
      if (!registrosPorDia.has(dia)) {
        registrosPorDia.set(dia, []);
      }
      registrosPorDia.get(dia)!.push(registro);
    });

    let totalMinutos = 0;
    let diasTrabajados = 0;

    registrosPorDia.forEach((registrosDia) => {
      const minutosDelDia = this.calculateDayMinutes(registrosDia);

      if (minutosDelDia > 0) {
        totalMinutos += minutosDelDia;
        diasTrabajados++;
      }
    });

    const horasTotal = Math.floor(totalMinutos / 60);
    const minutosRest = totalMinutos % 60;
    const promedioDiario =
      diasTrabajados > 0 ? totalMinutos / diasTrabajados : 0;
    const horasPromedio = Math.floor(promedioDiario / 60);
    const minutosPromedio = Math.floor(promedioDiario % 60);

    return {
      tiempoTotal: `${horasTotal}h ${minutosRest}m`,
      diasTrabajados,
      promedioDiario: `${horasPromedio}h ${minutosPromedio}m`,
    };
  }

  /**
   * Calculate worked minutes for a single day using simplified entrada/salida pairs
   */
  private static calculateDayMinutes(registrosDia: RegistroTiempo[]): number {
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

    // If there's an unpaired entrada (currently working), don't count it in daily stats
    // Daily stats should only count completed sessions

    return totalMinutos;
  }

  /**
   * Get icon for registro type (simplified)
   */
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

  /**
   * Get display text for registro type (simplified)
   */
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

  /**
   * Filter records by search term
   */
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
}
