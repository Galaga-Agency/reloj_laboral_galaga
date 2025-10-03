import { useState } from "react";
import { FiAlertCircle, FiCalendar, FiHome, FiClock } from "react-icons/fi";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subWeeks,
} from "date-fns";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import type { Absence } from "@/types";
import type { TeleworkingSchedule } from "@/types/teleworking";

interface AgendaStatsProps {
  absences: Absence[];
  teleworkSchedules: TeleworkingSchedule[];
}

export function AgendaStats({ absences, teleworkSchedules }: AgendaStatsProps) {
  const [timeRange, setTimeRange] = useState("this_week");

  const timeRangeOptions = [
    { value: "this_week", label: "Esta Semana" },
    { value: "last_week", label: "Semana Pasada" },
    { value: "this_month", label: "Este Mes" },
    { value: "last_month", label: "Mes Pasado" },
    { value: "this_year", label: "Este Año" },
    { value: "all_time", label: "Todo el Tiempo" },
  ];

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "this_week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case "last_week":
        const lastWeek = subWeeks(now, 1);
        return {
          start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
        };
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "this_year":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "all_time":
        return { start: new Date(2000, 0, 1), end: new Date(2099, 11, 31) };
      default:
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
    }
  };

  const { start, end } = getDateRange();

  console.log("[AgendaStats] timeRange:", timeRange);
  console.log("[AgendaStats] date range:", { start, end });
  console.log("[AgendaStats] absences received:", absences);
  console.log("[AgendaStats] teleworkSchedules received:", teleworkSchedules);

  const filteredAbsences = absences.filter((a) => {
    const hasDateInRange = a.fechas.some((f) => {
      const fTime = f.getTime();
      const startTime = start.getTime();
      const endTime = end.getTime();
      const inRange = fTime >= startTime && fTime <= endTime;
      return inRange;
    });
    return hasDateInRange;
  });

  const filteredTelework = teleworkSchedules.filter((t) => {
    const tTime = t.fecha.getTime();
    const startTime = start.getTime();
    const endTime = end.getTime();
    const inRange = tTime >= startTime && tTime <= endTime;
    return inRange;
  });

  console.log("[AgendaStats] filteredAbsences:", filteredAbsences);
  console.log("[AgendaStats] filteredTelework:", filteredTelework);

  const daysOffCount = filteredAbsences
    .filter((a) => a.tipoAusencia === "dia_libre")
    .reduce((count, a) => {
      const daysInRange = a.fechas.filter((f) => {
        const fTime = f.getTime();
        const startTime = start.getTime();
        const endTime = end.getTime();
        return fTime >= startTime && fTime <= endTime;
      }).length;
      return count + daysInRange;
    }, 0);

  const totalAbsencesCount = filteredAbsences
    .filter((a) => a.tipoAusencia !== "dia_libre")
    .reduce((count, a) => {
      const daysInRange = a.fechas.filter((f) => {
        const fTime = f.getTime();
        const startTime = start.getTime();
        const endTime = end.getTime();
        return fTime >= startTime && fTime <= endTime;
      }).length;
      return count + daysInRange;
    }, 0);

  const teleworkDaysCount = filteredTelework.filter(
    (t) => t.location === "remote"
  ).length;

  console.log("[AgendaStats] calculated stats:", {
    totalAbsences: totalAbsencesCount,
    daysOff: daysOffCount,
    teleworkDays: teleworkDaysCount,
    pending: filteredAbsences.filter((a) => a.estado === "pendiente").length,
  });

  const stats = {
    totalAbsences: totalAbsencesCount,
    daysOff: daysOffCount,
    teleworkDays: teleworkDaysCount,
    pending: filteredAbsences.filter((a) => a.estado === "pendiente").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CustomDropdown
          options={timeRangeOptions}
          value={timeRange}
          onChange={setTimeRange}
          placeholder="Seleccionar período"
          className="w-48"
          variant="darkBg"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
            <FiAlertCircle className="w-4 h-4" />
            Ausencias
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.totalAbsences}
          </div>
        </div>

        <div className="bg-white/10 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
            <FiCalendar className="w-4 h-4" />
            Días Libres
          </div>
          <div className="text-2xl font-bold text-white">{stats.daysOff}</div>
        </div>

        <div className="bg-white/10 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
            <FiHome className="w-4 h-4" />
            Teletrabajo
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.teleworkDays}
          </div>
        </div>

        <div className="bg-white/10 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
            <FiClock className="w-4 h-4" />
            Pendientes
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {stats.pending}
          </div>
        </div>
      </div>
    </div>
  );
}