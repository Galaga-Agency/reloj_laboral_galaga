import { useState, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiFileText, FiDownload, FiCalendar, FiActivity } from "react-icons/fi";
import type { RegistroTiempo, Usuario } from "@/types";
import { useReports, type ReportPeriod } from "@/hooks/useReports";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { CustomCalendar } from "@/components/ui/CustomCalendar";

interface InformesHistorialregistrosProps {
  registros: RegistroTiempo[];
  usuario: Usuario;
}

export function InformesHistorialregistros({
  registros,
  usuario,
}: InformesHistorialregistrosProps) {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);

  const {
    selectedPeriod,
    customDateRange,
    isGenerating,
    dateRange,
    statistics,
    recordCount,
    hasData,
    setSelectedPeriod,
    setCustomDateRange,
    generatePDFReport,
    canGenerateReport,
    isCustomRangeValid,
  } = useReports({ registros, usuario });

  const handleGenerateReport = async () => {
    try {
      const result = await generatePDFReport();
      setMessage({ type: "success", text: result.message });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Error generando informe",
      });
      setTimeout(() => setMessage(null), 5000);
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

  const periodOptions: {
    value: ReportPeriod;
    label: string;
    description: string;
  }[] = [
    { value: "today", label: "Hoy", description: "Registros del día actual" },
    {
      value: "week",
      label: "Esta Semana",
      description: "Lunes a domingo de esta semana",
    },
    { value: "month", label: "Este Mes", description: "Todo el mes actual" },
    {
      value: "custom",
      label: "Rango Personalizado",
      description: "Selecciona fechas específicas",
    },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/10">
      <div className="flex items-center gap-3 pb-6">
        <FiFileText className="text-2xl text-teal" />
        <h2 className="text-2xl font-bold text-white">Generar Informes - Tiempo Trabajado</h2>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg pb-6 ${
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
            Seleccionar Período
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {periodOptions.map((option) => (
              <label
                key={option.value}
                className={`flex flex-col gap-2 p-4 rounded-lg cursor-pointer transition-all border ${
                  selectedPeriod === option.value
                    ? "border-teal bg-teal/15"
                    : "border-white/10 bg-white/5 hover:border-teal/50 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="period"
                    value={option.value}
                    checked={selectedPeriod === option.value}
                    onChange={(e) =>
                      setSelectedPeriod(e.target.value as ReportPeriod)
                    }
                    className="w-4 h-4 text-teal border-white/20 focus:ring-teal"
                  />
                  <span className="font-medium text-white">{option.label}</span>
                </div>
                <span className="text-sm text-white/60 pl-6">
                  {option.description}
                </span>
              </label>
            ))}
          </div>
        </div>

        {selectedPeriod === "custom" && (
          <div className="flex flex-col gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 className="text-md font-medium text-white">Rango de Fechas</h4>

            <div className="flex flex-col gap-3">
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

              {customDateRange.start && customDateRange.end && (
                <div className="text-sm text-white/60">
                  {getSelectedDatesArray().length} día
                  {getSelectedDatesArray().length !== 1 ? "s" : ""} seleccionado
                  {getSelectedDatesArray().length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

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
            <div className="flex items-center gap-2">
              <FiActivity className="text-teal" />
              <h4 className="text-md font-medium text-white">
                Vista Previa del Informe
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {recordCount}
                </div>
                <div className="text-sm text-white/60">Registros</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {statistics.diasTrabajados}
                </div>
                <div className="text-sm text-white/60">Días Trabajados</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {statistics.tiempoTotal}
                </div>
                <div className="text-sm text-white/60">Tiempo Total</div>
              </div>
            </div>

            <div className="text-sm text-white/60 text-center">
              Período: {format(dateRange.start, "dd/MM/yyyy", { locale: es })} -{" "}
              {format(dateRange.end, "dd/MM/yyyy", { locale: es })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {!hasData && dateRange && (
            <div className="p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-300 text-sm">
              No hay registros para el período seleccionado
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
            El informe incluirá un resumen estadístico y el detalle completo de
            todos los registros del período seleccionado.
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
