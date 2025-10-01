import { useState, useMemo, useEffect } from "react";
import type { RegistroTiempo, Usuario } from "@/types";
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { FiRefreshCw, FiClock, FiAlertCircle, FiEdit3 } from "react-icons/fi";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { TimeRecordsUtils } from "@/utils/time-records";
import { TimeRecordsService } from "@/services/time-records-service";
import { CustomDropdown } from "./ui/CustomDropdown";
import { WorkStatistics } from "./WorkStatistics";
import {
  TimeCorrectionsService,
  type TimeCorrection,
} from "@/services/time-corrections-service";
import { DailyHoursCalculator } from "@/utils/daily-hours-calculator";
import { DailyOvertimeIndicator } from "@/components/DailyOvertimeIndicator";
import { TimeRecordCorrectionModal } from "@/components/modals/TimeRecordCorrectionModal";
import { AbsenceHistory } from "./AbsenceHistory";

export type DateRangeFilter =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";

interface DateRange {
  start: Date;
  end: Date;
}

interface HistorialTrabajoProps {
  usuarioId: string;
  currentUser: Usuario;
  onRefresh?: () => void;
}

export function HistorialTrabajo({
  usuarioId,
  currentUser,
  onRefresh,
}: HistorialTrabajoProps) {
  const [registros, setRegistros] = useState<RegistroTiempo[]>([]);
  const [filtroFecha, setFiltroFecha] = useState<DateRangeFilter>("this_week");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [corrections, setCorrections] = useState<Map<string, TimeCorrection[]>>(
    new Map()
  );
  const [loadingCorrections, setLoadingCorrections] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RegistroTiempo | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const getDateRange = (filter: DateRangeFilter): DateRange => {
    const now = new Date();

    switch (filter) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "yesterday": {
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      }
      case "this_week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case "last_week": {
        const lastWeekStart = startOfWeek(subWeeks(now, 1), {
          weekStartsOn: 1,
        });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        return { start: lastWeekStart, end: lastWeekEnd };
      }
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month": {
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));
        return { start: lastMonthStart, end: lastMonthEnd };
      }
      case "custom":
        return customDateRange;
      default:
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
    }
  };

  const fetchRegistros = async (dateRange?: DateRange) => {
    if (!usuarioId) return;

    setIsLoading(true);
    try {
      const range = dateRange || getDateRange(filtroFecha);
      const records = await TimeRecordsService.getRecordsByDateRange(
        usuarioId,
        range.start,
        range.end
      );
      setRegistros(records);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (registros.length === 0) {
        setCorrections(new Map());
        return;
      }
      try {
        setLoadingCorrections(true);
        const ids = registros.map((r) => r.id);
        const map = await TimeCorrectionsService.getCorrectionsForRecords(ids);
        setCorrections(map);
      } catch (e) {
        console.error("Failed to load corrections", e);
        setCorrections(new Map());
      } finally {
        setLoadingCorrections(false);
      }
    };
    load();
  }, [registros]);

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await fetchRegistros();
      onRefresh?.();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleFilterChange = async (newFilter: DateRangeFilter) => {
    setFiltroFecha(newFilter);
    setShowCustomPicker(newFilter === "custom");

    if (newFilter !== "custom") {
      const newRange = getDateRange(newFilter);
      await fetchRegistros(newRange);
    }
  };

  const handleCustomDateChange = async () => {
    if (filtroFecha === "custom") {
      await fetchRegistros(customDateRange);
    }
  };

  const handleEditRecord = (record: RegistroTiempo) => {
    setSelectedRecord(record);
    setShowEditModal(true);
  };

  const handleEditSuccess = async () => {
    setSuccessMessage(true);
    setTimeout(() => setSuccessMessage(false), 3000);
    await fetchRegistros();
    setShowEditModal(false);
    setSelectedRecord(null);
  };

  const registrosOrdenados = useMemo(() => {
    return [...registros].sort((a, b) => {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }, [registros]);

  useEffect(() => {
    fetchRegistros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId]);

  const filterOptions: { key: DateRangeFilter; label: string }[] = [
    { key: "today", label: "Hoy" },
    { key: "yesterday", label: "Ayer" },
    { key: "this_week", label: "Esta Semana" },
    { key: "last_week", label: "Semana Pasada" },
    { key: "this_month", label: "Este Mes" },
    { key: "last_month", label: "Mes Pasado" },
    { key: "custom", label: "Personalizado" },
  ];

  const currentRange = getDateRange(filtroFecha);

  const getModificationInfo = (record: RegistroTiempo) => {
    const list = corrections.get(record.id) || [];
    const latest = list[0];
    return {
      isModified: list.length > 0,
      modifiedBy: latest?.adminUserName ?? "Admin",
      isPending: latest?.estado === "pendiente",
    };
  };

  const getOriginalTime = (record: RegistroTiempo): string | null => {
    const recordCorrections = corrections.get(record.id);
    if (!recordCorrections || recordCorrections.length === 0) return null;

    const correction = recordCorrections.find(
      (c) => c.campoModificado === "fecha"
    );
    if (!correction) return null;

    try {
      const prev =
        correction.valorAnterior && correction.valorAnterior !== "null"
          ? new Date(correction.valorAnterior)
          : null;
      return prev ? format(prev, "HH:mm:ss") : null;
    } catch {
      return null;
    }
  };

  const isBusy = isLoading || loadingCorrections;

  const dailyHoursMap = useMemo(() => {
    return DailyHoursCalculator.calculateDailyHours(registros);
  }, [registros]);

  const recordsByDate = useMemo(() => {
    const groups = new Map<string, RegistroTiempo[]>();

    registrosOrdenados.forEach((record) => {
      const dateStr = format(record.fecha, "yyyy-MM-dd");
      if (!groups.has(dateStr)) {
        groups.set(dateStr, []);
      }
      groups.get(dateStr)!.push(record);
    });

    return Array.from(groups.entries()).map(([dateStr, records]) => ({
      date: dateStr,
      records,
      totalHours: DailyHoursCalculator.getHoursForDate(dateStr, dailyHoursMap),
    }));
  }, [registrosOrdenados, dailyHoursMap]);

  return (
    <>
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/10">
          <div className="flex items-start md:items-center justify-between pb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Historial de Trabajo
              </h2>
              <p className="text-sm text-white/60 mt-1">
                {format(currentRange.start, "PPP", { locale: es })} -{" "}
                {format(currentRange.end, "PPP", { locale: es })}
              </p>
            </div>
            <PrimaryButton
              onClick={handleRefresh}
              disabled={isBusy || isRefreshing}
              size="sm"
              className={isRefreshing ? "opacity-70" : ""}
            >
              <FiRefreshCw
                className={`w-4 h-4 transition-transform duration-500 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              <span className="hidden md:block">
                {isRefreshing ? "Actualizando..." : "Actualizar"}
              </span>
            </PrimaryButton>
          </div>

          <div className="pb-6">
            <CustomDropdown
              options={filterOptions.map((option) => ({
                value: option.key,
                label: option.label,
              }))}
              value={filtroFecha}
              onChange={(value: any) =>
                handleFilterChange(value as DateRangeFilter)
              }
              placeholder="Seleccionar período"
              variant="darkBg"
            />

            {showCustomPicker && (
              <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white pb-2">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={format(customDateRange.start, "yyyy-MM-dd")}
                      onChange={(e) => {
                        const newStart = new Date(e.target.value);
                        setCustomDateRange((prev) => ({
                          ...prev,
                          start: startOfDay(newStart),
                        }));
                      }}
                      className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-1 focus:ring-teal/50 focus:border-teal/50 bg-white/5 text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white pb-2">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={format(customDateRange.end, "yyyy-MM-dd")}
                      onChange={(e) => {
                        const newEnd = new Date(e.target.value);
                        setCustomDateRange((prev) => ({
                          ...prev,
                          end: endOfDay(newEnd),
                        }));
                      }}
                      className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-1 focus:ring-teal/50 focus:border-teal/50 bg-white/5 text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <PrimaryButton
                      onClick={handleCustomDateChange}
                      size="sm"
                      disabled={isBusy}
                    >
                      Aplicar
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          <WorkStatistics registros={registros} />

          {isBusy && (
            <div className="text-center py-8 flex flex-col items-center">
              <FiRefreshCw className="w-8 h-8 mx-auto animate-spin text-white/50" />
              <p className="text-sm text-white/60 pt-2">
                Cargando registros...
              </p>
            </div>
          )}

          {!isBusy && (
            <div className="flex flex-col gap-4 max-h-96 overflow-y-auto">
              {recordsByDate.length === 0 ? (
                <div className="text-center py-8 text-white/60 flex flex-col items-center">
                  <FiClock className="w-12 h-12 mx-auto opacity-30 pb-2" />
                  <p className="text-sm">
                    No hay registros para el período seleccionado
                  </p>
                </div>
              ) : (
                recordsByDate.map(({ date, records, totalHours }) => (
                  <div key={date} className="mb-4">
                    <div className="flex items-center justify-between mb-2 px-2">
                      <h3 className="font-medium text-white">
                        {format(new Date(date + "T00:00:00"), "PPP", {
                          locale: es,
                        })}
                      </h3>
                      <DailyOvertimeIndicator
                        totalHours={totalHours}
                        dateStr={date}
                      />
                    </div>

                    <div className="space-y-2">
                      {records.map((registro) => {
                        const { isModified, modifiedBy, isPending } =
                          getModificationInfo(registro);
                        const displayTime = format(
                          new Date(registro.fecha),
                          "HH:mm:ss"
                        );

                        return (
                          <div
                            key={registro.id}
                            className="group relative p-4 rounded-lg border transition-colors duration-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white/5 border-white/10 hover:bg-white/10"
                          >
                            <div className="w-full md:flex-1 flex items-start gap-4 md:items-center">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 flex-shrink-0">
                                {TimeRecordsUtils.getTypeIcon(
                                  registro.tipoRegistro
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white">
                                    {TimeRecordsUtils.getTypeText(
                                      registro.tipoRegistro
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="w-full md:w-auto flex items-center gap-3 justify-center md:justify-end">
                              <div className="text-center md:text-right">
                                {isModified || isPending ? (
                                  <div className="flex flex-col items-center md:items-end gap-1">
                                    <div className="font-mono font-bold text-white">
                                      {displayTime}
                                    </div>
                                    {getOriginalTime(registro) && (
                                      <div className="text-[12px] text-yellow-400/80">
                                        Original: {getOriginalTime(registro)}
                                      </div>
                                    )}
                                    <div className="inline-flex items-center gap-1 text-xs text-yellow-400/80">
                                      <FiAlertCircle className="w-3 h-3 flex-shrink-0" />
                                      {isPending
                                        ? "Cambio pendiente de aprobación"
                                        : `Modificado por ${modifiedBy}`}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="font-mono font-bold text-white">
                                    {displayTime}
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => handleEditRecord(registro)}
                                className="p-2 text-white/50 hover:text-white hover:bg-teal/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                title="Solicitar cambio"
                              >
                                <FiEdit3 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <AbsenceHistory usuario={currentUser} />
      </div>

      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg">
          {currentUser.isAdmin
            ? "Corrección aplicada exitosamente"
            : "Solicitud de cambio enviada para aprobación"}
        </div>
      )}

      {showEditModal && selectedRecord && (
        <TimeRecordCorrectionModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
          user={currentUser}
          currentUser={currentUser}
          onSuccess={handleEditSuccess}
          isUserRequest={!currentUser.isAdmin}
        />
      )}
    </>
  );
}
