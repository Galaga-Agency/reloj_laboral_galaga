import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FiX,
  FiUser,
  FiClock,
  FiFileText,
  FiCalendar,
  FiActivity,
} from "react-icons/fi";
import type { DetailedEmployeeView } from "@/types/official-portal";
import { OfficialPortalService } from "@/services/official-portal-service";
import { pairRecordsByDay } from "@/utils/time-records";
import { formatSecondsHms } from "@/utils/date-format";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { generateEmployeeCsv, downloadCsv } from "@/utils/csv-export";

interface EmployeeDetailModalProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
  selectedRange: string;
}

export function EmployeeDetailModal({
  employeeId,
  isOpen,
  onClose,
  selectedRange,
}: EmployeeDetailModalProps) {
  const [employee, setEmployee] = useState<DetailedEmployeeView | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "records" | "corrections" | "reports"
  >("overview");

  const dateRangeOptions = [
    { value: "thisweek", label: "Esta Semana" },
    { value: "thismonth", label: "Este Mes" },
    { value: "lastmonth", label: "Mes Pasado" },
    { value: "past7days", label: "Últimos 7 Días" },
    { value: "past30days", label: "Últimos 30 Días" },
    { value: "all", label: "Todo el Historial" },
  ];

  const [rangeKey, setRangeKey] = useState<string>("");

  const rangeLabel = useMemo(
    () =>
      dateRangeOptions.find((o) => o.value === rangeKey)?.label ?? "Período",
    [rangeKey]
  );

  // Initialize rangeKey when modal opens
  useEffect(() => {
    if (isOpen && selectedRange) {
      setRangeKey(selectedRange);
    }
  }, [isOpen, selectedRange]);

  useEffect(() => {
    if (isOpen && employeeId && rangeKey) {
      fetchEmployeeDetail(rangeKey);
    }
  }, [isOpen, employeeId, rangeKey]);

  const fetchEmployeeDetail = async (rk: string) => {
    try {
      setLoading(true);
      const data = await OfficialPortalService.getDetailedEmployeeView(
        employeeId,
        rk
      );
      setEmployee(data);
    } catch (error) {
      console.error("Error fetching employee detail:", error);
    } finally {
      setLoading(false);
    }
  };

  function computeSelectedStats() {
    if (!employee?.timeRecords) {
      return {
        totalHours: 0,
        workedDays: 0,
        avgPerDay: 0,
        overtime: employee?.selectedPeriod?.overtimeHours ?? 0,
      };
    }
    const days = pairRecordsByDay(employee.timeRecords as any, {
      includePaidBreak: true,
    });
    let totalSeconds = 0;
    let workedDays = 0;
    for (const d of days) {
      if (d.totalSeconds > 0) {
        workedDays++;
        totalSeconds += d.totalSeconds;
      }
    }
    const totalHours = totalSeconds / 3600;
    const avgPerDay = workedDays > 0 ? totalHours / workedDays : 0;
    return {
      totalHours: Number(totalHours.toFixed(1)),
      workedDays,
      avgPerDay: Number(avgPerDay.toFixed(1)),
      overtime: employee?.selectedPeriod?.overtimeHours ?? 0,
    };
  }
  const sel = computeSelectedStats();

  function handleExportCsv() {
    if (!employee?.timeRecords) return;

    const days = pairRecordsByDay(employee.timeRecords as any, {
      includePaidBreak: true,
    });

    const csv = generateEmployeeCsv(
      days,
      employee.nombre,
      employee.email,
      rangeLabel
    );

    const filename = `registros_${employee.nombre
      .replace(/\s+/g, "_")
      .toLowerCase()}_${rangeKey}.csv`;

    downloadCsv(csv, filename);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] min-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-azul-profundo to-teal p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <FiUser className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {loading ? "Cargando..." : employee?.nombre}
                </h2>
                <p className="text-white/80 mt-1">
                  {loading ? "" : employee?.email}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="text-azul-profundo text-lg">
              Cargando datos del empleado...
            </div>
          </div>
        ) : employee ? (
          <div className="flex flex-col h-full max-h-[calc(90vh-120px)]">
            {/* Tabs + shared range dropdown */}
            <div className="border-b border-hielo/30 px-6">
              <nav className="flex space-x-8">
                {[
                  { id: "overview", label: "Resumen", icon: FiActivity },
                  { id: "records", label: "Registros", icon: FiClock },
                  {
                    id: "corrections",
                    label: "Correcciones",
                    icon: FiFileText,
                  },
                  { id: "reports", label: "Informes", icon: FiCalendar },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-teal text-teal"
                        : "border-transparent text-azul-profundo/60 hover:text-azul-profundo hover:border-hielo"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Shared range control */}
              <div className="py-3 flex items-center justify-end">
                <div className="w-56">
                  <CustomDropdown
                    options={dateRangeOptions}
                    value={rangeKey}
                    onChange={setRangeKey}
                    placeholder="Seleccionar período..."
                    variant="light"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "overview" && (
                <div className="bg-hielo/20 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-azul-profundo mb-4 flex items-center gap-2">
                    <FiCalendar className="w-5 h-5" />
                    Resumen — {rangeLabel}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 rounded-xl p-4">
                      <div className="text-xs text-azul-profundo/60">
                        Horas trabajadas
                      </div>
                      <div className="text-xl font-bold text-azul-profundo">
                        {sel.totalHours}h
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4">
                      <div className="text-xs text-azul-profundo/60">
                        Días trabajados
                      </div>
                      <div className="text-xl font-bold text-azul-profundo">
                        {sel.workedDays}
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4">
                      <div className="text-xs text-azul-profundo/60">
                        Promedio h/día
                      </div>
                      <div className="text-xl font-bold text-azul-profundo">
                        {sel.avgPerDay}h
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4">
                      <div className="text-xs text-azul-profundo/60">
                        Horas extra
                      </div>
                      <div className="text-xl font-bold text-orange-600">
                        +{sel.overtime}h
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "records" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-azul-profundo">
                      Registros de Tiempo — {rangeLabel}
                    </h3>
                    <PrimaryButton onClick={handleExportCsv} size="sm">
                      Exportar CSV
                    </PrimaryButton>
                  </div>

                  {(() => {
                    const days = pairRecordsByDay(employee.timeRecords as any, {
                      includePaidBreak: true,
                    });

                    if (days.length === 0) {
                      return (
                        <div className="bg-white border border-hielo/30 rounded-xl p-6 text-center">
                          <p className="text-azul-profundo/60">
                            Sin registros.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        {days.map((day) => (
                          <div
                            key={day.dateKey}
                            className="bg-white rounded-xl border border-hielo/30 overflow-hidden"
                          >
                            <div className="px-6 py-4 border-b border-hielo/30 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FiClock className="text-teal" />
                                <h4 className="text-base font-semibold text-azul-profundo">
                                  {format(
                                    new Date(day.dateKey + "T00:00:00"),
                                    "EEEE, dd 'de' MMMM yyyy",
                                    { locale: es }
                                  )}
                                </h4>
                              </div>
                              <div className="text-sm text-azul-profundo/70">
                                Total del día:{" "}
                                <span className="font-semibold text-azul-profundo">
                                  {formatSecondsHms(day.totalSeconds)}
                                </span>
                                {day.paidBreakIncluded && (
                                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-teal/10 text-teal">
                                    +15m pausa incluida
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="min-w-full">
                                <thead className="bg-hielo/20">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-azul-profundo/70 uppercase tracking-wider">
                                      Entrada
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-azul-profundo/70 uppercase tracking-wider">
                                      Salida
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-azul-profundo/70 uppercase tracking-wider">
                                      Duración
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-azul-profundo/70 uppercase tracking-wider">
                                      Estado
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-hielo/30">
                                  {day.pairs.map((p, i) => (
                                    <tr key={i} className="hover:bg-hielo/10">
                                      <td className="px-6 py-3 text-sm text-azul-profundo">
                                        {format(p.entrada, "dd/MM/yyyy HH:mm", {
                                          locale: es,
                                        })}
                                      </td>
                                      <td className="px-6 py-3 text-sm text-azul-profundo">
                                        {p.salida
                                          ? format(
                                              p.salida,
                                              "dd/MM/yyyy HH:mm",
                                              {
                                                locale: es,
                                              }
                                            )
                                          : "—"}
                                      </td>
                                      <td className="px-6 py-3 text-sm font-medium text-azul-profundo">
                                        {formatSecondsHms(p.seconds || 0)}
                                      </td>
                                      <td className="px-6 py-3 text-sm">
                                        {p.salida ? (
                                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            Cerrado
                                          </span>
                                        ) : (
                                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                            Abierto (sin salida)
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {(day.unpairedEntradas.length > 0 ||
                              day.unpairedSalidas.length > 0) && (
                              <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-200 text-yellow-800 text-xs">
                                {day.unpairedEntradas.length > 0 && (
                                  <div>
                                    Entradas sin salida:{" "}
                                    {day.unpairedEntradas
                                      .map((d) => format(d, "HH:mm"))
                                      .join(", ")}
                                  </div>
                                )}
                                {day.unpairedSalidas.length > 0 && (
                                  <div>
                                    Salidas sin entrada:{" "}
                                    {day.unpairedSalidas
                                      .map((d) => format(d, "HH:mm"))
                                      .join(", ")}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === "corrections" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-azul-profundo mb-4">
                    Correcciones de Tiempo ({employee.corrections.length})
                  </h3>
                  {employee.corrections.length === 0 ? (
                    <div className="text-center py-8">
                      <FiFileText className="w-12 h-12 mx-auto text-azul-profundo/20 mb-3" />
                      <p className="text-azul-profundo/60">
                        No hay correcciones registradas
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {employee.corrections.map((correction, index) => (
                        <div
                          key={index}
                          className="bg-white border border-hielo/30 rounded-xl p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-azul-profundo">
                              {correction.campoModificado}
                            </span>
                            <span className="text-sm text-azul-profundo/60">
                              {format(
                                new Date(correction.fechaCorreccion),
                                "dd/MM/yyyy HH:mm",
                                { locale: es }
                              )}
                            </span>
                          </div>
                          <div className="text-sm text-azul-profundo/80 mb-2">
                            <span className="text-red-600">Anterior:</span>{" "}
                            {correction.valorAnterior} →{" "}
                            <span className="text-green-600">Nuevo:</span>{" "}
                            {correction.valorNuevo}
                          </div>
                          <div className="text-sm text-azul-profundo/60">
                            <strong>Razón:</strong> {correction.razon}
                          </div>
                          <div className="text-xs text-azul-profundo/50 mt-2">
                            Por: {correction.adminUserName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reports" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-azul-profundo mb-4">
                    Informes Mensuales ({employee.monthlyReports.length})
                  </h3>
                  {employee.monthlyReports.length === 0 ? (
                    <div className="text-center py-8">
                      <FiCalendar className="w-12 h-12 mx-auto text-azul-profundo/20 mb-3" />
                      <p className="text-azul-profundo/60">
                        No hay informes mensuales
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {employee.monthlyReports.map((report, index) => (
                        <div
                          key={index}
                          className="bg-white border border-hielo/30 rounded-xl p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-azul-profundo">
                              {new Date(
                                report.year,
                                report.month - 1
                              ).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                              })}
                            </h4>
                            <div className="flex gap-2">
                              {report.isAccepted && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  Aceptado
                                </span>
                              )}
                              {report.isContested && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  Contestado
                                </span>
                              )}
                              {!report.isAccepted && !report.isContested && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-azul-profundo/60 mb-2">
                            Generado:{" "}
                            {format(
                              new Date(report.generatedAt),
                              "dd/MM/yyyy",
                              {
                                locale: es,
                              }
                            )}
                          </p>
                          {report.contestReason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                              <p className="text-sm text-red-800">
                                <strong>Motivo de contestación:</strong>{" "}
                                {report.contestReason}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-red-600 text-lg">
              Error al cargar los datos del empleado
            </div>
          </div>
        )}
      </div>
    </div>
  );
}