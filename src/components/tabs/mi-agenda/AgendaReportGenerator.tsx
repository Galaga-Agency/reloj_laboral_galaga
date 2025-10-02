import { useState, useRef, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import { FiFileText, FiDownload, FiCalendar } from "react-icons/fi";
import { CustomCalendar } from "@/components/ui/CustomCalendar";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import PrimaryButton from "@/components/ui/PrimaryButton";
import type { Usuario, Absence } from "@/types";
import type { TeleworkingSchedule } from "@/types/teleworking";
import { AgendaPDFGenerator } from "@/utils/agenda-pdf-generator";

interface AgendaReportGeneratorProps {
  usuario: Usuario;
  absences: Absence[];
  teleworkSchedules: TeleworkingSchedule[];
  onRefresh: () => void;
}

type ReportPeriod =
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "custom";

export function AgendaReportGenerator({
  usuario,
  absences,
  teleworkSchedules,
  onRefresh,
}: AgendaReportGeneratorProps) {
  const [selectedPeriod, setSelectedPeriod] =
    useState<ReportPeriod>("this_month");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);

  const periodOptions = [
    { value: "this_week", label: "Esta Semana" },
    { value: "last_week", label: "Semana Pasada" },
    { value: "this_month", label: "Este Mes" },
    { value: "last_month", label: "Mes Pasado" },
    { value: "this_year", label: "Este Año" },
    { value: "custom", label: "Rango Personalizado" },
  ];

  const getDateRange = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case "this_week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case "last_week":
        const lastWeek = subWeeks(now, 1);
        return {
          start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
        };
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "this_year":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "custom":
        if (customDateRange.start && customDateRange.end) {
          return {
            start: new Date(customDateRange.start),
            end: new Date(customDateRange.end),
          };
        }
        return null;
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const dateRange = getDateRange();

  const filteredData = useMemo(() => {
    if (!dateRange) return { absences: [], telework: [] };

    const filteredAbsences = absences.filter((a) =>
      a.fechas.some((f) => f >= dateRange.start && f <= dateRange.end)
    );

    const filteredTelework = teleworkSchedules.filter(
      (t) => t.fecha >= dateRange.start && t.fecha <= dateRange.end
    );

    return { absences: filteredAbsences, telework: filteredTelework };
  }, [absences, teleworkSchedules, dateRange]);

  const stats = useMemo(() => {
    const realAbsences = filteredData.absences.filter(
      (a) => a.tipoAusencia !== "dia_libre"
    );
    const daysOff = filteredData.absences.filter(
      (a) => a.tipoAusencia === "dia_libre"
    );
    const remoteDays = filteredData.telework.filter(
      (t) => t.location === "remote"
    );

    return {
      totalAbsences: realAbsences.length,
      daysOff: daysOff.length,
      teleworkDays: remoteDays.length,
      totalEvents: filteredData.absences.length + filteredData.telework.length,
    };
  }, [filteredData]);

  const handleGenerateReport = async () => {
    if (!dateRange || stats.totalEvents === 0) {
      setMessage({
        type: "error",
        text: "No hay datos para generar el informe",
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsGenerating(true);

    try {
      await AgendaPDFGenerator.generateReport({
        usuario,
        absences: filteredData.absences,
        teleworkSchedules: filteredData.telework,
        fechaInicio: dateRange.start,
        fechaFin: dateRange.end,
      });

      setMessage({ type: "success", text: "Informe generado correctamente" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error generating agenda report:", error);
      setMessage({ type: "error", text: "Error al generar el informe" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsGenerating(false);
    }
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

  const isCustomRangeValid =
    selectedPeriod !== "custom" ||
    (customDateRange.start &&
      customDateRange.end &&
      new Date(customDateRange.start) <= new Date(customDateRange.end));

  const canGenerateReport = !!(
    dateRange &&
    stats.totalEvents > 0 &&
    isCustomRangeValid &&
    !isGenerating
  );

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/10">
      <div className="flex items-center gap-3 pb-6">
        <FiFileText className="text-2xl text-white flex-shrink-0" />
        <h2 className="text-2xl font-bold text-white">
          Generar Informe de Agenda
        </h2>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            message.type === "success"
              ? "bg-teal/20 border border-teal/40 text-teal"
              : "bg-red-500/20 border border-red-500/40 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-white">
            Período del Informe
          </h3>
          <CustomDropdown
            options={periodOptions}
            value={selectedPeriod}
            onChange={(value: any) => setSelectedPeriod(value as ReportPeriod)}
            placeholder="Seleccionar período"
            className="w-full"
            variant="darkBg"
          />
        </div>

        {selectedPeriod === "custom" && (
          <div className="flex flex-col gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 className="text-md font-medium text-white">Rango de Fechas</h4>
            <button
              ref={calendarTriggerRef}
              onClick={() => setShowCalendar(true)}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 border border-white/20 rounded-lg text-white bg-white/5 hover:border-teal/50 hover:bg-white/10 transition-colors"
            >
              <FiCalendar className="w-5 h-5 text-teal" />
              <span className="text-sm">
                {customDateRange.start && customDateRange.end
                  ? `${format(new Date(customDateRange.start), "dd/MM/yyyy", {
                      locale: es,
                    })} - ${format(
                      new Date(customDateRange.end),
                      "dd/MM/yyyy",
                      { locale: es }
                    )}`
                  : "Seleccionar fechas"}
              </span>
            </button>

            {!isCustomRangeValid &&
              customDateRange.start &&
              customDateRange.end && (
                <p className="text-sm text-red-400">
                  La fecha de inicio debe ser anterior o igual a la fecha de fin
                </p>
              )}
          </div>
        )}

        {dateRange && (
          <div className="flex flex-col gap-4 p-4 bg-teal/10 rounded-lg border border-teal/30">
            <h4 className="text-md font-medium text-white">Vista Previa</h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {stats.totalAbsences}
                </div>
                <div className="text-sm text-white/60">Ausencias</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {stats.daysOff}
                </div>
                <div className="text-sm text-white/60">Días Libres</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {stats.teleworkDays}
                </div>
                <div className="text-sm text-white/60">Teletrabajo</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {stats.totalEvents}
                </div>
                <div className="text-sm text-white/60">Total Eventos</div>
              </div>
            </div>

            <div className="text-sm text-white/60 text-center">
              Período: {format(dateRange.start, "dd/MM/yyyy", { locale: es })} -{" "}
              {format(dateRange.end, "dd/MM/yyyy", { locale: es })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {dateRange && stats.totalEvents === 0 && (
            <div className="p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-300 text-sm">
              No hay eventos registrados para el período seleccionado
            </div>
          )}

          <PrimaryButton
            onClick={handleGenerateReport}
            disabled={!canGenerateReport}
            className="w-full sm:w-auto"
          >
            <FiDownload
              className={`w-4 h-4 ${isGenerating ? "animate-bounce" : ""}`}
            />
            {isGenerating ? "Generando PDF..." : "Generar Informe PDF"}
          </PrimaryButton>

          <p className="text-xs text-white/50">
            El informe incluirá todas tus ausencias, días libres y programación
            de teletrabajo del período seleccionado.
          </p>
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
