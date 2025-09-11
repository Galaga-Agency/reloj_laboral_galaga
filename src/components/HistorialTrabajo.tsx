import { useState, useMemo, useEffect } from "react";
import type { RegistroTiempo } from "@/types";
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
import { FiRefreshCw, FiClock } from "react-icons/fi";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { TimeRecordsUtils } from "@/utils/time-records";
import { TimeRecordsService } from "@/services/time-records-service";
import { CustomDropdown } from "./ui/CustomDropdown";
import { WorkStatistics } from "./WorkStatistics";

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
  onRefresh?: () => void;
}

export function HistorialTrabajo({
  usuarioId,
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

  const getDateRange = (filter: DateRangeFilter): DateRange => {
    const now = new Date();

    switch (filter) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "yesterday":
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case "this_week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case "last_week":
        const lastWeekStart = startOfWeek(subWeeks(now, 1), {
          weekStartsOn: 1,
        });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        return { start: lastWeekStart, end: lastWeekEnd };
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month":
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));
        return { start: lastMonthStart, end: lastMonthEnd };
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

  const registrosOrdenados = useMemo(() => {
    return registros.sort((a, b) => {
      const timeA =
        a.tipoRegistro === "salida" && a.fechaSalida
          ? new Date(a.fechaSalida).getTime()
          : new Date(a.fechaEntrada).getTime();

      const timeB =
        b.tipoRegistro === "salida" && b.fechaSalida
          ? new Date(b.fechaSalida).getTime()
          : new Date(b.fechaEntrada).getTime();

      return timeB - timeA;
    });
  }, [registros]);

  useEffect(() => {
    fetchRegistros();
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

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-blanco/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 relative">
        <div className="flex items-start md:items-center justify-between pb-6">
          <div>
            <h2 className="text-2xl font-bold text-azul-profundo">
              Historial de Trabajo
            </h2>
            <p className="text-sm text-azul-profundo/60 mt-1">
              {format(currentRange.start, "PPP", { locale: es })} -{" "}
              {format(currentRange.end, "PPP", { locale: es })}
            </p>
          </div>
          <PrimaryButton
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
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
          />

          {showCustomPicker && (
            <div className="mt-4 p-4 bg-hielo/10 rounded-xl border border-hielo/30">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-azul-profundo pb-2">
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
                    className="w-full px-4 py-2 border border-hielo/50 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal bg-blanco/90 text-azul-profundo"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-azul-profundo pb-2">
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
                    className="w-full px-4 py-2 border border-hielo/50 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal bg-blanco/90 text-azul-profundo"
                  />
                </div>
                <div className="flex items-end">
                  <PrimaryButton
                    onClick={handleCustomDateChange}
                    size="sm"
                    disabled={isLoading}
                  >
                    Aplicar
                  </PrimaryButton>
                </div>
              </div>
            </div>
          )}
        </div>

        <WorkStatistics registros={registros} />

        {isLoading && (
          <div className="text-center py-8 flex flex-col items-center">
            <FiRefreshCw className="w-8 h-8 mx-auto animate-spin text-azul-profundo/50 pb-2" />
            <p className="text-sm text-azul-profundo/60">
              Cargando registros...
            </p>
          </div>
        )}

        {!isLoading && (
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {registrosOrdenados.length === 0 ? (
              <div className="text-center py-8 text-azul-profundo/60 flex flex-col items-center">
                <FiClock className="w-12 h-12 mx-auto opacity-30 pb-2" />
                <p className="text-sm">
                  No hay registros para el período seleccionado
                </p>
              </div>
            ) : (
              registrosOrdenados.map((registro) => (
                <div
                  key={registro.id}
                  className="flex items-center justify-between p-4 bg-hielo/20 rounded-lg border border-hielo/50 hover:bg-hielo/30 transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blanco/80">
                      {TimeRecordsUtils.getTypeIcon(registro.tipoRegistro)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-azul-profundo">
                          {TimeRecordsUtils.getTypeText(registro.tipoRegistro)}
                        </span>
                      </div>
                      <div className="text-sm text-azul-profundo/70">
                        {format(new Date(registro.fechaEntrada), "PPP", {
                          locale: es,
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-azul-profundo">
                      {registro.tipoRegistro === "salida" &&
                      registro.fechaSalida
                        ? format(new Date(registro.fechaSalida), "HH:mm:ss")
                        : format(new Date(registro.fechaEntrada), "HH:mm:ss")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
