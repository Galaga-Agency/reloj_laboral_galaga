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
  averageAbsenceDuration: number;
}

export class AbsenceStatisticsCalculator {
  static calculate(absences: Absence[]): AbsenceStats {
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
        averageAbsenceDuration: 0,
      };
    }

    const totalMinutes = absences.reduce(
      (sum, a) => sum + a.duracionMinutos,
      0
    );
    const totalHours = totalMinutes / 60;
    const uniqueUsers = new Set(absences.map((a) => a.usuarioId));
    const fullDayAbsences = absences.filter(
      (a) => a.tipoAusencia === "ausencia_completa"
    ).length;

    const reasonMap = new Map<string, { count: number; minutes: number }>();
    absences.forEach((absence) => {
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
        percentage: Math.round((data.count / absences.length) * 100 * 10) / 10,
        totalMinutes: data.minutes,
        totalHours: Math.round((data.minutes / 60) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count);

    const typeMap = new Map<string, { count: number; minutes: number }>();
    absences.forEach((absence) => {
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
        percentage: Math.round((data.count / absences.length) * 100 * 10) / 10,
        totalMinutes: data.minutes,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalAbsences: absences.length,
      totalHoursMissed: Math.round(totalHours * 10) / 10,
      totalDaysMissed: fullDayAbsences,
      affectedUsers: uniqueUsers.size,
      reasonStats,
      typeStats,
      pendingCount: absences.filter((a) => a.estado === "pendiente").length,
      approvedCount: absences.filter((a) => a.estado === "aprobada").length,
      rejectedCount: absences.filter((a) => a.estado === "rechazada").length,
      averageAbsenceDuration:
        Math.round((totalMinutes / absences.length) * 10) / 10,
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
      otro: "Otro Motivo",
    };
    return labels[razon] || razon;
  }

  static getTypeLabel(tipo: string): string {
    const labels: Record<string, string> = {
      tardanza: "Tardanza",
      salida_temprana: "Salida Temprana",
      ausencia_parcial: "Ausencia Parcial",
      ausencia_completa: "Ausencia Completa",
      permiso_medico: "Permiso Médico",
      permiso_personal: "Permiso Personal",
    };
    return labels[tipo] || tipo;
  }
}
