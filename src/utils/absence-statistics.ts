import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
} from "date-fns";
import type { Absence } from "@/types";

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "current_month"
  | "last_month"
  | "last_3_months"
  | "current_year"
  | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

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

export function getDateRangeFromPreset(
  preset: DateRangePreset,
  customRange?: { start: string; end: string }
): DateRange {
  const now = new Date();

  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday":
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case "last_7_days":
      return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
    case "current_month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "last_month":
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    case "last_3_months":
      const threeMonthsAgo = subMonths(now, 3);
      return { start: startOfMonth(threeMonthsAgo), end: endOfMonth(now) };
    case "current_year":
      return { start: startOfYear(now), end: endOfMonth(now) };
    case "custom":
      if (customRange?.start && customRange?.end) {
        return {
          start: startOfDay(new Date(customRange.start)),
          end: endOfDay(new Date(customRange.end)),
        };
      }
      return { start: startOfDay(now), end: endOfDay(now) };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

export function isCustomRangeValid(
  preset: DateRangePreset,
  customRange: { start: string; end: string }
): boolean {
  if (preset !== "custom") return true;
  if (!customRange.start || !customRange.end) return false;
  return new Date(customRange.start) <= new Date(customRange.end);
}

export function expandAbsences(
  absence: Absence
): (Absence & { fecha: Date })[] {
  if (Array.isArray((absence as any).fechas)) {
    return (absence as any).fechas.map((f: Date) => ({
      ...absence,
      fecha: new Date(f),
    }));
  }
  return [{ ...absence, fecha: (absence as any).fecha ?? new Date() }];
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

    const expandedAbsences = absences.flatMap((a) =>
      a.fechas.map((fecha) => ({ ...a, fecha }))
    );

    const scheduledDaysOff = expandedAbsences.filter(
      (a: any) => a.tipoAusencia === "dia_libre"
    );

    const validAbsences = expandedAbsences.filter((a: any) => {
      const day = new Date(a.fecha).getDay();
      return day !== 0 && day !== 6;
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
        scheduledDaysOffCount: scheduledDaysOff.length,
        averageAbsenceDuration: 0,
      };
    }

    const adjustedAbsences = validAbsences.map((a: any) => {
      if (a.tipoAusencia === "ausencia_completa") {
        const dailyHours = userHoursMap[a.usuarioId] || 8;
        return { ...a, duracionMinutos: dailyHours * 60 };
      }
      return a;
    });

    const realAbsencesOnly = adjustedAbsences.filter(
      (a: any) => a.tipoAusencia !== "dia_libre"
    );

    const totalMinutes = realAbsencesOnly.reduce(
      (sum: number, a: any) => sum + a.duracionMinutos,
      0
    );
    const totalHours = totalMinutes / 60;
    const uniqueUsers = new Set(adjustedAbsences.map((a: any) => a.usuarioId));
    const fullDayAbsences = realAbsencesOnly.filter(
      (a: any) => a.tipoAusencia === "ausencia_completa"
    ).length;

    const reasonMap = new Map<string, { count: number; minutes: number }>();
    adjustedAbsences.forEach((absence: any) => {
      const current = reasonMap.get(absence.razon) || { count: 0, minutes: 0 };
      const minutesToAdd =
        absence.tipoAusencia === "dia_libre" ? 0 : absence.duracionMinutos;
      reasonMap.set(absence.razon, {
        count: current.count + 1,
        minutes: current.minutes + minutesToAdd,
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
    adjustedAbsences.forEach((absence: any) => {
      const current = typeMap.get(absence.tipoAusencia) || {
        count: 0,
        minutes: 0,
      };
      const minutesToAdd =
        absence.tipoAusencia === "dia_libre" ? 0 : absence.duracionMinutos;
      typeMap.set(absence.tipoAusencia, {
        count: current.count + 1,
        minutes: current.minutes + minutesToAdd,
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
      totalAbsences: realAbsencesOnly.length,
      totalHoursMissed: Math.round(totalHours * 10) / 10,
      totalDaysMissed: fullDayAbsences,
      affectedUsers: uniqueUsers.size,
      reasonStats,
      typeStats,
      pendingCount: realAbsencesOnly.filter(
        (a: any) => a.estado === "pendiente"
      ).length,
      approvedCount: realAbsencesOnly.filter(
        (a: any) => a.estado === "aprobada"
      ).length,
      rejectedCount: realAbsencesOnly.filter(
        (a: any) => a.estado === "rechazada"
      ).length,
      scheduledDaysOffCount: scheduledDaysOff.length,
      averageAbsenceDuration:
        realAbsencesOnly.length > 0
          ? Math.round((totalMinutes / realAbsencesOnly.length) * 10) / 10
          : 0,
    };
  }

  static getReasonLabel(razon: string): string {
    const labels: Record<string, string> = {
      tardanza_trafico: "Tardanza - Tráfico",
      tardanza_transporte: "Tardanza - Transporte",
      tardanza_personal: "Tardanza - Motivo Personal",
      tardanza: "Tardanza",
      cita_medica: "Cita Médica",
      cita_banco: "Gestión Bancaria",
      cita_oficial: "Gestión Administrativa",
      ausencia_parcial: "Ausencia Parcial",
      emergencia_familiar: "Emergencia Familiar",
      ausencia_completa: "Ausencia Completa",
      enfermedad: "Enfermedad",
      dia_libre: "Día Libre o Vacaciones",
      otro: "Otro Motivo",
    };
    return labels[razon] || razon;
  }

  static getTypeLabel(tipo: string): string {
    const labels: Record<string, string> = {
      tardanza: "Tardanza",
      ausencia_completa: "Ausencia Completa",
      ausencia_parcial: "Ausencia Parcial",
      dia_libre: "Día Libre o Vacaciones",
      salida_temprana: "Salida Temprana",
      permiso_medico: "Permiso Médico",
      permiso_personal: "Permiso Personal",
      cita_medica: "Cita Médica",
    };
    return labels[tipo] || tipo;
  }
}
