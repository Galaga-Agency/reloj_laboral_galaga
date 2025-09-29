import { useState, useRef, useMemo } from "react";
import {
  FiTrendingUp,
  FiAlertCircle,
  FiClock,
  FiBarChart2,
  FiCalendar,
} from "react-icons/fi";
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
} from "date-fns";
import { es } from "date-fns/locale";
import { useAbsenceStatistics } from "@/hooks/useAbsenceStatistics";
import { AbsenceStatisticsCalculator } from "@/utils/absence-statistics";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { CustomCalendar } from "@/components/ui/CustomCalendar";
import type { AbsenceStats } from "@/utils/absence-statistics";

type DateRangePreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "current_month"
  | "last_month"
  | "last_3_months"
  | "current_year"
  | "custom";

export function AdminAbsenceStatistics() {
  const [selectedPreset, setSelectedPreset] =
    useState<DateRangePreset>("today");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);

  const datePresets = [
    { value: "today", label: "Hoy" },
    { value: "yesterday", label: "Ayer" },
    { value: "last_7_days", label: "Últimos 7 Días" },
    { value: "current_month", label: "Mes Actual" },
    { value: "last_month", label: "Mes Pasado" },
    { value: "last_3_months", label: "Últimos 3 Meses" },
    { value: "current_year", label: "Año Actual" },
    { value: "custom", label: "Rango Personalizado" },
  ];

  const getDateRangeFromPreset = (
    preset: DateRangePreset
  ): { start: Date; end: Date } => {
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
        if (customDateRange.start && customDateRange.end) {
          return {
            start: startOfDay(new Date(customDateRange.start)),
            end: endOfDay(new Date(customDateRange.end)),
          };
        }
        return { start: startOfDay(now), end: endOfDay(now) };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  };

  const dateRange = useMemo(
    () => getDateRangeFromPreset(selectedPreset),
    [selectedPreset, customDateRange]
  );

  const { stats, isLoading } = useAbsenceStatistics(
    dateRange.start,
    dateRange.end
  );

  const handleCalendarSelect = (dates: string[]) => {
    if (dates.length > 0) {
      const sortedDates = dates.sort();
      setCustomDateRange({
        start: sortedDates[0],
        end: sortedDates[sortedDates.length - 1],
      });
    }
    setShowCalendar(false);
  };

  const getSelectedDatesArray = (): string[] => {
    if (!customDateRange.start || !customDateRange.end) return [];

    const start = new Date(customDateRange.start);
    const end = new Date(customDateRange.end);
    const dates: string[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(format(d, "yyyy-MM-dd"));
    }

    return dates;
  };

  const isCustomRangeValid = () => {
    if (selectedPreset !== "custom") return true;
    if (!customDateRange.start || !customDateRange.end) return false;
    return new Date(customDateRange.start) <= new Date(customDateRange.end);
  };

  const getDateRangeDisplay = () => {
    return `${format(dateRange.start, "dd/MM/yyyy")} - ${format(
      dateRange.end,
      "dd/MM/yyyy"
    )}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="text-center py-12">
          <div className="text-white">Cargando estadísticas...</div>
        </div>
      </div>
    );
  }

  const maxReasonCount = stats
    ? Math.max(...stats.reasonStats.map((r) => r.count), 1)
    : 1;
  const maxTypeCount = stats
    ? Math.max(...stats.typeStats.map((t) => t.count), 1)
    : 1;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <FiBarChart2 className="text-2xl text-white" />
          <div>
            <h3 className="text-xl font-bold text-white">
              Estadísticas de Ausencias
            </h3>
            <p className="text-white/60 text-sm">{getDateRangeDisplay()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">
            Período de Análisis
          </label>
          <CustomDropdown
            options={datePresets}
            value={selectedPreset}
            onChange={(value: string) =>
              setSelectedPreset(value as DateRangePreset)
            }
            variant="darkBg"
          />
        </div>

        {selectedPreset === "custom" && (
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Rango de Fechas
            </label>
            <button
              ref={calendarTriggerRef}
              onClick={() => setShowCalendar(true)}
              className="w-full flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
            >
              <FiCalendar className="w-5 h-5" />
              <span className="text-sm">
                {customDateRange.start && customDateRange.end
                  ? `${format(
                      new Date(customDateRange.start),
                      "dd/MM/yyyy"
                    )} - ${format(new Date(customDateRange.end), "dd/MM/yyyy")}`
                  : "Seleccionar fechas"}
              </span>
            </button>
            {!isCustomRangeValid() &&
              customDateRange.start &&
              customDateRange.end && (
                <p className="text-xs text-red-300 mt-1">
                  La fecha de inicio debe ser anterior o igual a la fecha de fin
                </p>
              )}
          </div>
        )}
      </div>

      {!stats || stats.totalAbsences === 0 ? (
        <div className="text-center py-12 border-t border-white/20 pt-6">
          <FiAlertCircle className="w-12 h-12 text-white/40 mx-auto mb-3" />
          <p className="text-white/60">
            No hay datos de ausencias para el período seleccionado
          </p>
          <p className="text-white/40 text-sm mt-2">{getDateRangeDisplay()}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-white/20">
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <p className="text-white/60 text-xs mb-1">Total Ausencias</p>
              <p className="text-white font-bold text-2xl">
                {stats.totalAbsences}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <p className="text-white/60 text-xs mb-1">Horas Perdidas</p>
              <p className="text-orange-400 font-bold text-2xl">
                {stats.totalHoursMissed}h
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <p className="text-white/60 text-xs mb-1">Empleados</p>
              <p className="text-blue-400 font-bold text-2xl">
                {stats.affectedUsers}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <p className="text-white/60 text-xs mb-1">Duración Media</p>
              <p className="text-white font-bold text-2xl">
                {Math.round((stats.averageAbsenceDuration / 60) * 10) / 10}h
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FiAlertCircle className="w-5 h-5" />
                Motivos de Ausencia
              </h4>
              <div className="flex flex-col gap-3">
                {stats.reasonStats.map((reason, index) => (
                  <div key={reason.razon} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm">
                        {index + 1}.{" "}
                        {AbsenceStatisticsCalculator.getReasonLabel(
                          reason.razon
                        )}
                      </span>
                      <span className="text-teal font-bold">
                        {reason.percentage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-teal to-blue-400 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(reason.count / maxReasonCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>{reason.count} ausencias</span>
                      <span>{reason.totalHours}h perdidas</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FiClock className="w-5 h-5" />
                Tipos de Ausencia
              </h4>
              <div className="flex flex-col gap-3">
                {stats.typeStats.map((type, index) => (
                  <div key={type.tipo} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm">
                        {index + 1}.{" "}
                        {AbsenceStatisticsCalculator.getReasonLabel(type.tipo)}
                      </span>
                      <span className="text-orange-400 font-bold">
                        {type.percentage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-400 to-red-400 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(type.count / maxTypeCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>{type.count} casos</span>
                      <span>
                        {Math.round((type.totalMinutes / 60) * 10) / 10}h
                        perdidas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <p className="text-yellow-400 font-bold text-lg">
                {stats.pendingCount}
              </p>
              <p className="text-white/60 text-xs">Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-bold text-lg">
                {stats.approvedCount}
              </p>
              <p className="text-white/60 text-xs">Aprobadas</p>
            </div>
            <div className="text-center">
              <p className="text-red-400 font-bold text-lg">
                {stats.rejectedCount}
              </p>
              <p className="text-white/60 text-xs">Rechazadas</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">
                {stats.totalDaysMissed}
              </p>
              <p className="text-white/60 text-xs">Días Completos</p>
            </div>
          </div>
        </>
      )}

      {showCalendar && (
        <CustomCalendar
          selectedDates={getSelectedDatesArray()}
          onBulkSelect={handleCalendarSelect}
          onClose={() => setShowCalendar(false)}
          triggerRef={calendarTriggerRef}
          allowPastDates={true}
        />
      )}
    </div>
  );
}
