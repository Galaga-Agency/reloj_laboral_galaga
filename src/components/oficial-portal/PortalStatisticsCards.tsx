import {
  FiUsers,
  FiEye,
  FiClock,
  FiCalendar,
  FiAlertTriangle,
  FiFileText,
} from "react-icons/fi";
import type { EmployeeData } from "@/types/official-portal";

interface PortalStatisticsCardsProps {
  employees: EmployeeData[];
  selectedPeriod: string;
}

export function PortalStatisticsCards({
  employees,
  selectedPeriod,
}: PortalStatisticsCardsProps) {
  const activeEmployees = employees.filter((e) => e.isActive).length;

  const totalOvertimeHours =
    Math.round(
      employees.reduce((sum, emp) => sum + emp.selectedPeriod.overtimeHours, 0) * 100
    ) / 100;

  // Selected period stats
  const selectedPeriodHours =
    Math.round(
      employees.reduce((sum, emp) => sum + emp.selectedPeriod.totalHours, 0) *
        100
    ) / 100;
    
  const selectedPeriodDays = employees.reduce(
    (sum, emp) => sum + emp.selectedPeriod.totalDays,
    0
  );

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "thisweek":
        return "Esta Semana";
      case "thismonth":
        return "Este Mes";
      case "lastmonth":
        return "Mes Pasado";
      case "past7days":
        return "Últimos 7 Días";
      case "past30days":
        return "Últimos 30 Días";
      case "all":
        return "Total";
      default:
        return "Período Seleccionado";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Total Employees */}
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-teal/20 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-teal font-medium pb-2">
          <FiUsers className="w-4 h-4" />
          Total Empleados
        </div>
        <div className="text-2xl font-bold text-azul-profundo">
          {employees.length}
        </div>
        <div className="text-sm text-azul-profundo/60 mt-1">
          {activeEmployees} activos
        </div>
      </div>

      {/* Selected Period Hours */}
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-teal/20 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-teal font-medium pb-2">
          <FiClock className="w-4 h-4" />
          {getPeriodLabel(selectedPeriod)}
        </div>
        <div className="text-2xl font-bold text-azul-profundo">
          {selectedPeriodHours}h
        </div>
        <div className="text-sm text-azul-profundo/60 mt-1">
          {selectedPeriodDays} días trabajados
        </div>
      </div>

      {/* Overtime Hours */}
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-teal/20 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-teal font-medium pb-2">
          <FiAlertTriangle className="w-4 h-4" />
          Horas Extra
        </div>
        <div className="text-2xl font-bold text-azul-profundo">
          {totalOvertimeHours}h
        </div>
        <div className="text-sm text-azul-profundo/60 mt-1">
          acumuladas totales
        </div>
      </div>
    </div>
  );
}
