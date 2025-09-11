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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6">
      <div className="bg-gradient-to-br from-activo/10 to-activo/5 p-4 rounded-xl border border-activo/20">
        <div className="flex items-center gap-2 text-sm text-activo font-medium pb-2">
          <FiClock className="w-4 h-4" />
          Tiempo Total
        </div>
        <div className="text-2xl font-bold text-azul-profundo">
          {estadisticas.tiempoTotal}
        </div>
      </div>
      <div className="bg-gradient-to-br from-turquesa/10 to-turquesa/5 p-4 rounded-xl border border-turquesa/20">
        <div className="flex items-center gap-2 text-sm text-turquesa font-medium pb-2">
          <FiCalendar className="w-4 h-4" />
          Días Trabajados
        </div>
        <div className="text-2xl font-bold text-azul-profundo">
          {estadisticas.diasTrabajados}
        </div>
      </div>
      <div className="bg-gradient-to-br from-mandarina/10 to-mandarina/5 p-4 rounded-xl border border-mandarina/20">
        <div className="flex items-center gap-2 text-sm text-mandarina font-medium pb-2">
          <FiTrendingUp className="w-4 h-4" />
          Promedio Diario
        </div>
        <div className="text-2xl font-bold text-azul-profundo">
          {estadisticas.promedioDiario}
        </div>
      </div>
    </div>
  );
}
