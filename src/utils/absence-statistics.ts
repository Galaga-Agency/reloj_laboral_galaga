import type { Absence } from "@/types";

export interface AbsenceReasonStats {
  razon: string;
  count: number;
  percentage: number;
  totalMinutes: number;
  totalHours: number;
}

export interface AbsenceTypeStats {
  tipo: string;
  count: number;
  percentage: number;
  totalMinutes: number;
}

export interface AbsenceStats {
  totalAbsences: number;
  totalHoursMissed: number;
  totalDaysMissed: number;
  affectedUsers: number;
  reasonStats: AbsenceReasonStats[];
  typeStats: AbsenceTypeStats[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  scheduledDaysOffCount: number;
  averageAbsenceDuration: number;
}

export class AbsenceStatisticsCalculator {
  static calculate(
    absences: Absence[],
    userHoursMap: Record<string, number>
  ): AbsenceStats {
    if (absences.length === 0) {
      return {
        totalAbsences: 0,
        totalHoursMissed: 0,
        totalDaysMissed: 0,
        affectedUsers: 0,
        reasonStats: [],
        typeStats: [],
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        scheduledDaysOffCount: 0,
        averageAbsenceDuration: 0,
      };
    }

    // Skip weekends + holidays
    const validAbsences = absences.filter((a) => {
      const day = new Date(a.fecha).getDay();
      return (
        day !== 0 && // Sunday
        day !== 6 && // Saturday
        a.tipoAusencia !== "dia_libre"
      );
    });

    if (validAbsences.length === 0) {
      return {
        totalAbsences: 0,
        totalHoursMissed: 0,
        totalDaysMissed: 0,
        affectedUsers: 0,
        reasonStats: [],
        typeStats: [],
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        scheduledDaysOffCount: 0,
        averageAbsenceDuration: 0,
      };
    }

    // Replace duracionMinutos for full days using user horas_diarias
    const adjustedAbsences = validAbsences.map((a) => {
      if (a.tipoAusencia === "ausencia_completa") {
        const dailyHours = userHoursMap[a.usuarioId] ?? 8; // default 8h
        return { ...a, duracionMinutos: dailyHours * 60 };
      }
      return a;
    });

    const totalMinutes = adjustedAbsences.reduce(
      (sum, a) => sum + a.duracionMinutos,
      0
    );
    const totalHours = totalMinutes / 60;
    const uniqueUsers = new Set(adjustedAbsences.map((a) => a.usuarioId));
    const fullDayAbsences = adjustedAbsences.filter(
      (a) => a.tipoAusencia === "ausencia_completa"
    ).length;

    const reasonMap = new Map<string, { count: number; minutes: number }>();
    adjustedAbsences.forEach((absence) => {
      const current = reasonMap.get(absence.razon) || { count: 0, minutes: 0 };
      reasonMap.set(absence.razon, {
        count: current.count + 1,
        minutes: current.minutes + absence.duracionMinutos,
      });
    });

    const reasonStats: AbsenceReasonStats[] = Array.from(reasonMap.entries())
      .map(([razon, data]) => ({
        razon,
        count: data.count,
        percentage:
          Math.round((data.count / adjustedAbsences.length) * 100 * 10) / 10,
        totalMinutes: data.minutes,
        totalHours: Math.round((data.minutes / 60) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count);

    const typeMap = new Map<string, { count: number; minutes: number }>();
    adjustedAbsences.forEach((absence) => {
      const current = typeMap.get(absence.tipoAusencia) || {
        count: 0,
        minutes: 0,
      };
      typeMap.set(absence.tipoAusencia, {
        count: current.count + 1,
        minutes: current.minutes + absence.duracionMinutos,
      });
    });

    const typeStats: AbsenceTypeStats[] = Array.from(typeMap.entries())
      .map(([tipo, data]) => ({
        tipo,
        count: data.count,
        percentage:
          Math.round((data.count / adjustedAbsences.length) * 100 * 10) / 10,
        totalMinutes: data.minutes,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalAbsences: adjustedAbsences.length,
      totalHoursMissed: Math.round(totalHours * 10) / 10,
      totalDaysMissed: fullDayAbsences,
      affectedUsers: uniqueUsers.size,
      reasonStats,
      typeStats,
      pendingCount: adjustedAbsences.filter((a) => a.estado === "pendiente")
        .length,
      approvedCount: adjustedAbsences.filter((a) => a.estado === "aprobada")
        .length,
      rejectedCount: adjustedAbsences.filter((a) => a.estado === "rechazada")
        .length,
      scheduledDaysOffCount: adjustedAbsences.filter(
        (a) => a.tipoAusencia === "dia_libre"
      ).length,
      averageAbsenceDuration:
        Math.round((totalMinutes / adjustedAbsences.length) * 10) / 10,
    };
  }

  static getReasonLabel(razon: string): string {
    const labels: Record<string, string> = {
      tardanza_trafico: "Tardanza - Tráfico",
      tardanza_transporte: "Tardanza - Transporte",
      tardanza_personal: "Tardanza - Motivo Personal",
      cita_medica: "Cita Médica",
      cita_banco: "Gestión Bancaria",
      cita_oficial: "Gestión Administrativa",
      emergencia_familiar: "Emergencia Familiar",
      enfermedad: "Enfermedad",
      dia_libre: "Día Libre Programado",
      otro: "Otro Motivo",
    };
    return labels[razon] || razon;
  }
}
