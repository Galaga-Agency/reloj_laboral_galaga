import { useState, useEffect, useRef } from "react";
import {
  FiSearch,
  FiDownload,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiClock,
  FiFile,
} from "react-icons/fi";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
} from "date-fns";
import { es } from "date-fns/locale";
import { AbsenceService } from "@/services/absence-service";
import { CustomCalendar } from "@/components/ui/CustomCalendar";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import type { Usuario, Absence } from "@/types";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { AbsenceStatisticsCalculator } from "@/utils/absence-statistics";
import { CustomInput } from "../ui/CustomInput";

interface AdminAbsenceWorkerListProps {
  users: Usuario[];
  isLoading: boolean;
}

type DateRangePreset =
  | "current_month"
  | "last_month"
  | "last_3_months"
  | "current_year"
  | "custom";

export function AdminAbsenceWorkerList({
  users,
  isLoading,
}: AdminAbsenceWorkerListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [userAbsences, setUserAbsences] = useState<Absence[]>([]);
  const [isLoadingAbsences, setIsLoadingAbsences] = useState(false);
  const [generatingReportFor, setGeneratingReportFor] = useState<string | null>(
    null
  );
  const [generatingCompanyReport, setGeneratingCompanyReport] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedPreset, setSelectedPreset] =
    useState<DateRangePreset>("current_month");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);

  const datePresets = [
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
            start: new Date(customDateRange.start),
            end: new Date(customDateRange.end),
          };
        }
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (selectedUser) {
      loadUserAbsences(selectedUser.id);
    }
  }, [selectedUser, selectedPreset, customDateRange]);

  const loadUserAbsences = async (userId: string) => {
    setIsLoadingAbsences(true);
    try {
      const dateRange = getDateRangeFromPreset(selectedPreset);
      const absences = await AbsenceService.getAbsencesByUser(
        userId,
        dateRange.start,
        dateRange.end
      );
      setUserAbsences(absences);
    } catch (error) {
      console.error("Error loading user absences:", error);
      setUserAbsences([]);
    } finally {
      setIsLoadingAbsences(false);
    }
  };

  const handleUserSelect = (user: Usuario) => {
    setSelectedUser(user);
  };

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

  const handleGenerateCompanyReport = async () => {
    setGeneratingCompanyReport(true);
    setMessage(null);

    try {
      const dateRange = getDateRangeFromPreset(selectedPreset);
      await AbsenceService.generateCompanyAbsenceReport(
        dateRange.start,
        dateRange.end,
        users
      );
      setMessage({
        type: "success",
        text: "Informe consolidado generado exitosamente",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Error generando informe consolidado",
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setGeneratingCompanyReport(false);
    }
  };

  const handleGenerateReport = async (user: Usuario) => {
    setGeneratingReportFor(user.id);
    setMessage(null);

    try {
      const dateRange = getDateRangeFromPreset(selectedPreset);
      await AbsenceService.generateUserAbsenceReport(
        user,
        dateRange.start,
        dateRange.end
      );
      setMessage({
        type: "success",
        text: `Informe de ausencias generado para ${user.nombre}`,
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Error generando informe",
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setGeneratingReportFor(null);
    }
  };

  const isCustomRangeValid = () => {
    if (selectedPreset !== "custom") return true;
    if (!customDateRange.start || !customDateRange.end) return false;
    return new Date(customDateRange.start) <= new Date(customDateRange.end);
  };

  const getDateRangeDisplay = () => {
    const range = getDateRangeFromPreset(selectedPreset);
    return `${format(range.start, "dd/MM/yyyy")} - ${format(
      range.end,
      "dd/MM/yyyy"
    )}`;
  };

  const getUserAbsenceStats = () => {
    if (userAbsences.length === 0) return null;

    const totalMinutes = userAbsences.reduce(
      (sum, a) => sum + a.duracionMinutos,
      0
    );
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const pendingCount = userAbsences.filter(
      (a) => a.estado === "pendiente"
    ).length;
    const approvedCount = userAbsences.filter(
      (a) => a.estado === "aprobada"
    ).length;
    const rejectedCount = userAbsences.filter(
      (a) => a.estado === "rechazada"
    ).length;

    return {
      totalAbsences: userAbsences.length,
      totalHours,
      pendingCount,
      approvedCount,
      rejectedCount,
    };
  };

  const stats = getUserAbsenceStats();

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <FiUsers className="text-2xl text-white" />
        <h3 className="text-xl font-bold text-white">Informes por Empleado</h3>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg mb-4 ${
            message.type === "success"
              ? "bg-green-500/20 border border-green-500/30 text-green-300"
              : "bg-red-500/20 border border-red-500/30 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">
            Período del Informe
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

      <div className="mb-6 pb-6 border-b border-white/20">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiFileText className="text-white w-5 h-5" />
            <h4 className="text-white font-semibold">
              Informe Consolidado de la Empresa
            </h4>
          </div>
          <p className="text-white/60 text-xs mb-3">
            Período: {getDateRangeDisplay()}
          </p>
          <p className="text-white/70 text-sm mb-4">
            Incluye estadísticas completas, análisis por motivo, análisis por
            tipo y detalle de todos los empleados
          </p>
          <PrimaryButton
            onClick={handleGenerateCompanyReport}
            disabled={generatingCompanyReport || !isCustomRangeValid()}
            className="w-full"
          >
            {generatingCompanyReport ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando Informe Consolidado...
              </>
            ) : (
              <>
                <FiDownload className="w-5 h-5" />
                Generar Informe Consolidado
              </>
            )}
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/05 backdrop-blur-md rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiUsers className="w-5 h-5 text-white" />
            <h2 className="text-xl font-semibold text-white">Empleados</h2>
          </div>

          <div className="relative mb-4">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
            <CustomInput
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar empleado..."
              className="w-full pl-12 pr-4 py-3 bg-white/05 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-teal focus:border-teal focus:outline-none transition-all"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-white">Cargando empleados...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60">
                {searchQuery
                  ? "No se encontraron empleados"
                  : "No hay empleados activos"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    !user.isActive
                      ? "opacity-50 bg-gray-500/10 border-gray-500/20 blur-[0.5px]"
                      : selectedUser?.id === user.id
                      ? "bg-white/10 border-white/20"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-semibold truncate ${
                        !user.isActive
                          ? "text-white/60 line-through"
                          : "text-white"
                      }`}
                    >
                      {user.nombre}
                    </h4>
                    <p
                      className={`text-sm truncate ${
                        !user.isActive ? "text-white/50" : "text-white/60"
                      }`}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/05 backdrop-blur-md rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiClock className="w-5 h-5 text-white" />
            <h2 className="text-xl font-semibold text-white">
              {selectedUser
                ? `Ausencias de ${selectedUser.nombre}`
                : "Ausencias del Empleado"}
            </h2>
          </div>

          {selectedUser ? (
            <div className="flex flex-col gap-4">
              {isLoadingAbsences ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white mx-auto mb-3 rounded-full"></div>
                  <div className="text-white/70">Cargando ausencias...</div>
                </div>
              ) : (
                <>
                  {stats && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-white/60">Total Ausencias</p>
                          <p className="text-white font-semibold text-lg">
                            {stats.totalAbsences}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60">Horas Perdidas</p>
                          <p className="text-white font-semibold text-lg">
                            {stats.totalHours}h
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60">Pendientes</p>
                          <p className="text-white font-semibold">
                            {stats.pendingCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60">Aprobadas</p>
                          <p className="text-white font-semibold">
                            {stats.approvedCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                    {userAbsences.length === 0 ? (
                      <p className="text-white/60 text-sm text-center py-8">
                        No hay ausencias en el período seleccionado
                      </p>
                    ) : (
                      userAbsences.map((absence) => (
                        <div
                          key={absence.id}
                          className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-white font-medium">
                                {format(absence.fecha, "dd/MM/yyyy EEEE", {
                                  locale: es,
                                })}
                              </p>
                              <p className="text-white/60 text-sm">
                                {AbsenceStatisticsCalculator.getTypeLabel(
                                  absence.tipoAusencia
                                )}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                absence.estado === "pendiente"
                                  ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                  : absence.estado === "aprobada"
                                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                                  : "bg-red-500/20 text-red-300 border-red-500/30"
                              }`}
                            >
                              {absence.estado === "pendiente"
                                ? "Pendiente"
                                : absence.estado === "aprobada"
                                ? "Aprobada"
                                : "Rechazada"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-white/60">Horario:</span>
                            <span className="text-white font-medium">
                              {absence.horaInicio} - {absence.horaFin}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-white/60">Duración:</span>
                            <span className="text-white font-medium">
                              {Math.floor(absence.duracionMinutos / 60)}h{" "}
                              {absence.duracionMinutos % 60}m
                            </span>
                          </div>
                          <div className="pt-2 border-t border-white/10">
                            <p className="text-white/60 text-xs mb-1">
                              Motivo:
                            </p>
                            <p className="text-white text-sm">
                              {AbsenceStatisticsCalculator.getReasonLabel(
                                absence.razon
                              )}
                            </p>
                          </div>
                          {absence.comentarios && (
                            <div className="pt-2 border-t border-white/10 mt-2">
                              <p className="text-white/60 text-xs mb-1">
                                Comentarios:
                              </p>
                              <p className="text-white/80 text-sm">
                                {absence.comentarios}
                              </p>
                            </div>
                          )}
                          {absence.adjuntoUrl && (
                            <div className="pt-2 border-t border-white/10 mt-2">
                              <a
                                href={absence.adjuntoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-white hover:text-white/80 text-sm transition-colors"
                              >
                                <FiFile className="w-4 h-4" />
                                <span>
                                  {absence.adjuntoNombre ||
                                    "Ver documento adjunto"}
                                </span>
                                <FiDownload className="w-4 h-4 ml-auto" />
                              </a>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <PrimaryButton
                    onClick={() => handleGenerateReport(selectedUser)}
                    disabled={
                      generatingReportFor === selectedUser.id ||
                      !isCustomRangeValid()
                    }
                    className="w-full"
                  >
                    {generatingReportFor === selectedUser.id ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generando Informe...
                      </>
                    ) : (
                      <>
                        <FiDownload className="w-5 h-5" />
                        Generar Informe PDF
                      </>
                    )}
                  </PrimaryButton>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/60">
                Selecciona un empleado para ver sus ausencias
              </p>
            </div>
          )}
        </div>
      </div>

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
