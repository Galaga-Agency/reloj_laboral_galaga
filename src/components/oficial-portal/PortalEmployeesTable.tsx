import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiUsers } from "react-icons/fi";
import type { EmployeeData } from "@/services/official-portal-service";

interface PortalEmployeesTableProps {
  employees: EmployeeData[];
}

export function PortalEmployeesTable({ employees }: PortalEmployeesTableProps) {
  if (employees.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-hielo/30">
          <h2 className="text-xl font-bold text-azul-profundo flex items-center gap-3">
            <FiUsers className="text-teal" />
            Datos de Empleados
          </h2>
        </div>
        <div className="text-center py-12">
          <FiUsers className="w-16 h-16 mx-auto text-azul-profundo/20 mb-4" />
          <p className="text-azul-profundo/60 text-lg">
            No se encontraron empleados
          </p>
          <p className="text-azul-profundo/40 text-sm mt-2">
            No hay empleados registrados en el sistema
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-hielo/30">
        <h2 className="text-xl font-bold text-azul-profundo flex items-center gap-3">
          <FiUsers className="text-teal" />
          Datos de Empleados
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-hielo/20">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-azul-profundo/70 uppercase tracking-wider">
                Empleado
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-azul-profundo/70 uppercase tracking-wider">
                Total Horas
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-azul-profundo/70 uppercase tracking-wider">
                Días Trabajados
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-azul-profundo/70 uppercase tracking-wider">
                Promedio H/Día
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-azul-profundo/70 uppercase tracking-wider">
                Última Entrada
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-azul-profundo/70 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hielo/30">
            {employees.map((employee) => (
              <tr
                key={employee.id}
                className="hover:bg-hielo/10 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-semibold text-azul-profundo">
                      {employee.nombre}
                    </div>
                    <div className="text-sm text-azul-profundo/60">
                      {employee.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-azul-profundo">
                  {employee.totalHours}h
                </td>
                <td className="px-6 py-4 text-sm font-medium text-azul-profundo">
                  {employee.totalDays}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-azul-profundo">
                  {employee.avgHoursPerDay}h
                </td>
                <td className="px-6 py-4 text-sm text-azul-profundo">
                  {employee.lastEntry
                    ? format(new Date(employee.lastEntry), "dd/MM/yyyy", {
                        locale: es,
                      })
                    : "Nunca"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      employee.isActive
                        ? "bg-activo/20 text-activo"
                        : "bg-inactivo/20 text-inactivo"
                    }`}
                  >
                    {employee.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
