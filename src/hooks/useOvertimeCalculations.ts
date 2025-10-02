import { useState, useCallback, useEffect } from "react";
import { useTimeRecords } from "./useTimeRecords";
import { OvertimeData } from "@/types";
import { RegistroTiempo } from "@/types";

export function useOvertimeCalculations(userId: string) {
  const [overtimeData, setOvertimeData] = useState<OvertimeData | null>(null);
  const { registros } = useTimeRecords(userId);

  const getHoursForDate = useCallback(
    (targetDate: string, records: RegistroTiempo[]) => {
      const dayRecords = records
        .filter((record) => {
          const recordDate = record.fecha.toISOString().split("T")[0];
          return recordDate === targetDate;
        })
        .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

      if (dayRecords.length === 0) return 0;

      let totalHours = 0;
      let currentEntrada: Date | null = null;

      for (const record of dayRecords) {
        if (record.tipoRegistro === "entrada") {
          currentEntrada = record.fecha;
        } else if (record.tipoRegistro === "salida" && currentEntrada) {
          const hours =
            (record.fecha.getTime() - currentEntrada.getTime()) /
            (1000 * 60 * 60);
          totalHours += hours;
          currentEntrada = null;
        }
      }

      return Math.max(0, totalHours);
    },
    []
  );

  const calculateOvertime = useCallback(() => {
    if (!registros.length) return null;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));

    let weeklyHours = 0;
    for (let d = new Date(weekStart); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      weeklyHours += getHoursForDate(dateStr, registros);
    }

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    let monthlyHours = 0;
    for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      monthlyHours += getHoursForDate(dateStr, registros);
    }

    const todayHours = getHoursForDate(todayStr, registros);

    const dailyOvertime = Math.max(0, todayHours - 8);
    const weeklyOvertime = Math.max(0, weeklyHours - 40);
    const monthlyOvertime = Math.max(0, monthlyHours - 40 * 4.33);

    if (dailyOvertime === 0 && weeklyOvertime === 0 && monthlyOvertime === 0) {
      return null;
    }

    let warningLevel: "none" | "warning" | "critical" = "none";
    if (todayHours > 9 || weeklyHours > 40 || monthlyHours > 173) {
      warningLevel = "critical";
    } else if (dailyOvertime > 0 || weeklyOvertime > 0 || monthlyOvertime > 0) {
      warningLevel = "warning";
    }

    return {
      dailyHours: todayHours,
      weeklyHours,
      monthlyHours,
      yearlyHours: monthlyHours * 12,
      dailyOvertime,
      weeklyOvertime,
      monthlyOvertime,
      yearlyOvertime: monthlyOvertime * 12,
      isOverLimit: todayHours > 9 || weeklyHours > 40,
      warningLevel,
    };
  }, [registros, getHoursForDate]);

  useEffect(() => {
    const data = calculateOvertime();
    setOvertimeData(data);
  }, [calculateOvertime]);

  return { overtimeData };
}
