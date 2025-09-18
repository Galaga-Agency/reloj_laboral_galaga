import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiUsers, FiEye } from "react-icons/fi";
import type { EmployeeData } from "@/types/official-portal";
import { EmployeeDetailModal } from "./EmployeeDetailModal";

interface PortalEmployeesTableProps {
  employees: EmployeeData[];
  selectedRange: any;
}

export function PortalEmployeesTable({
  employees,
  selectedRange,
}: PortalEmployeesTableProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const avgFromTotals = (
    totalHours: number | string,
    totalDays: number | string
  ) => {
    const h =
      typeof totalHours === "string" ? parseFloat(totalHours) : totalHours;
    const d =
      typeof totalDays === "string"
        ? parseInt(String(totalDays), 10)
        : totalDays;
    if (!d || d <= 0 || !isFinite(h)) return "0.0";
    return (h / d).toFixed(1);
  };


  const handleViewEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployeeId(null);
  };

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
    <>
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-hielo/30">
          <h2 className="text-xl font-bold text-azul-profundo flex items-center gap-3">
            <FiUsers className="text-teal" />
            Datos de Empleados ({employees.length}) - {selectedRange}
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
                  Horas Extra
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-azul-profundo/70 uppercase tracking-wider">
                  Última Entrada
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-azul-profundo/70 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-azul-profundo/70 uppercase tracking-wider">
                  Acciones
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
                      {(employee.totalCorrections > 0 ||
                        employee.contestedReports > 0 ||
                        employee.pendingReports > 0) && (
                        <div className="flex gap-1 mt-1">
                          {employee.totalCorrections > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              {employee.totalCorrections} correcciones
                            </span>
                          )}
                          {employee.contestedReports > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              {employee.contestedReports} contestados
                            </span>
                          )}
                          {employee.pendingReports > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              {employee.pendingReports} pendientes
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-azul-profundo">
                      {employee.selectedPeriod.totalHours}h
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-azul-profundo">
                      {employee.selectedPeriod.totalDays}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-azul-profundo">
                      {avgFromTotals(
                        employee.selectedPeriod.totalHours,
                        employee.selectedPeriod.totalDays
                      )}
                      h
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`text-sm font-medium ${
                        employee.selectedPeriod.overtimeHours > 0
                          ? "text-orange-600"
                          : "text-azul-profundo"
                      }`}
                    >
                      + {employee.selectedPeriod.overtimeHours}h
                    </div>
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
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewEmployee(employee.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal hover:text-teal/80 hover:bg-teal/10 rounded-lg transition-colors"
                    >
                      <FiEye className="w-4 h-4" />
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEmployeeId && (
        <EmployeeDetailModal
          employeeId={selectedEmployeeId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          selectedRange={selectedRange}
        />
      )}
    </>
  );
}
