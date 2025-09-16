import { useMemo } from "react";
import type { RegistroTiempo } from "@/types";
import { TimeRecordsUtils } from "@/utils/time-records";
import { FiClock, FiCalendar, FiTrendingUp } from "react-icons/fi";

interface WorkStatisticsProps {
  registros: RegistroTiempo[];
}

export function WorkStatistics({ registros }: WorkStatisticsProps) {
  const estadisticas = useMemo(() => {
    return TimeRecordsUtils.calculateStatistics(registros);
  }, [registros]);

  const overtimeInfo = useMemo(() => {
    const targetHoursPerDay = 8;
    const totalTargetHours = estadisticas.diasTrabajados * targetHoursPerDay;

    const totalWorkedHours = TimeRecordsUtils.convertTimeStringToHours(
      estadisticas.tiempoTotal
    );
    const difference = totalWorkedHours - totalTargetHours;

    return {
      totalWorkedHours,
      totalTargetHours,
      difference,
      isOvertime: difference > 0.1,
    };
  }, [estadisticas]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6">
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-teal/20 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-teal font-medium pb-2">
          <FiClock className="w-4 h-4" />
          Tiempo Total
        </div>
        <div className="text-2xl font-bold text-azul-profundo">
          {estadisticas.tiempoTotal}
        </div>
        {overtimeInfo.difference !== 0 && (
          <div
            className={`text-sm mt-1 px-2 py-1 ${
              overtimeInfo.isOvertime
                ? "text-red-700  "
                : "text-teal"
            }`}
          >
            {overtimeInfo.isOvertime
              ? `+${overtimeInfo.difference.toFixed(1)}h extra`
              : `${overtimeInfo.difference.toFixed(1)}h menos`}
          </div>
        )}
      </div>

      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-teal/20 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-teal font-medium pb-2">
          <FiCalendar className="w-4 h-4" />
          Días Trabajados
        </div>
        <div className="text-2xl font-bold text-azul-profundo">
          {estadisticas.diasTrabajados}
        </div>
        <div className="text-sm text-azul-profundo/60 mt-1">
          {overtimeInfo.totalTargetHours.toFixed(0)}h esperadas
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-teal/20 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-teal font-medium pb-2">
          <FiTrendingUp className="w-4 h-4" />
          Promedio Diario
        </div>
        <div className="text-2xl font-bold text-azul-profundo">
          {estadisticas.promedioDiario}
        </div>
        <div className="text-sm text-azul-profundo/60 mt-1">vs 8h estándar</div>
      </div>
    </div>
  );
}
