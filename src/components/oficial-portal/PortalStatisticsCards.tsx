// components/PortalStatisticsCards.tsx
import { FiUsers, FiEye, FiClock, FiCalendar } from "react-icons/fi";
import type { EmployeeData } from "@/services/official-portal-service";

interface PortalStatisticsCardsProps {
  employees: EmployeeData[];
}

export function PortalStatisticsCards({
  employees,
}: PortalStatisticsCardsProps) {
  const activeEmployees = employees.filter((e) => e.isActive).length;
  const avgHoursPerDay =
    employees.length > 0
      ? Math.round(
          (employees.reduce((sum, emp) => sum + emp.avgHoursPerDay, 0) /
            employees.length) *
            100
        ) / 100
      : 0;
  const totalHours =
    Math.round(employees.reduce((sum, emp) => sum + emp.totalHours, 0) * 100) /
    100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-teal/20 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-teal font-medium pb-2">
          <FiUsers className="w-4 h-4" />
          Total Empleados
        </div>
        <div className="text-2xl font-bold text-azul-profundo">
          {employees.length}
        </div>
        <div className="text-sm text-azul-profundo/60 mt-1">
          registrados en sistema
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-teal/20 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-teal font-medium pb-2">
          <FiEye className="w-4 h-4" />
          Empleados Activos
        </div>
        <div className="text-2xl font-bold text-azul-profundo">
          {activeEmployees}
        </div>
        <div className="text-sm text-azul-profundo/60 mt-1">
          de {employees.length} totales
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-teal/20 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-teal font-medium pb-2">
          <FiClock className="w-4 h-4" />
          Promedio H/Día
        </div>
        <div className="text-2xl font-bold text-azul-profundo">
          {avgHoursPerDay}h
        </div>
        <div className="text-sm text-azul-profundo/60 mt-1">vs 8h estándar</div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-teal/20 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-teal font-medium pb-2">
          <FiCalendar className="w-4 h-4" />
          Total Horas
        </div>
        <div className="text-2xl font-bold text-azul-profundo">
          {totalHours}h
        </div>
        <div className="text-sm text-azul-profundo/60 mt-1">acumuladas</div>
      </div>
    </div>
  );
}
