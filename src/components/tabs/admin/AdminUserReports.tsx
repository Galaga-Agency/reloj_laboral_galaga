import { useState, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiFileText, FiDownload, FiActivity, FiCalendar } from "react-icons/fi";
import type { RegistroTiempo, Usuario } from "@/types";
import { useReports, type ReportPeriod } from "@/hooks/useReports";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { CustomCalendar } from "@/components/ui/CustomCalendar";

interface AdminUserReportsProps {
  selectedUser: Usuario;
  userRecords: RegistroTiempo[];
}

export function AdminUserReports({
  selectedUser,
  userRecords,
}: AdminUserReportsProps) {
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
  } = useReports({ registros: userRecords, usuario: selectedUser });

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

  return (
    <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6">
      <div className="flex items-center gap-3 pb-6">
        <FiFileText className="text-xl text-white" />
        <h3 className="text-xl font-semibold text-white">
          Generar Informe - {selectedUser.nombre}
        </h3>
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

      <div className="flex flex-col gap-4">
        {/* Period Selection */}
        <div className="flex flex-col gap-3">
          <h4 className="text-md font-medium text-white">
            Seleccionar Período
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {periodOptions.map((option) => (
              <label
                key={option.value}
                className={`flex flex-col gap-1 p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedPeriod === option.value
                    ? "border-white/50 bg-white/20"
                    : "border-white/20 hover:border-white/40 hover:bg-white/10"
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
                    className="w-4 h-4 text-white border-white/30 focus:ring-white/50"
                  />
                  <span className="font-medium text-white text-sm">
                    {option.label}
                  </span>
                </div>
                <span className="text-xs text-white/70 pl-6">
                  {option.description}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        {selectedPeriod === "custom" && (
          <div className="flex flex-col gap-3 p-4 bg-white/5 rounded-lg border border-white/20">
            <h5 className="text-sm font-medium text-white">Rango de Fechas</h5>

            <div className="flex flex-col gap-3">
              <button
                ref={calendarTriggerRef}
                onClick={() => setShowCalendar(true)}
                className="flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15 transition-colors"
              >
                <FiCalendar className="w-4 h-4" />
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
                <div className="text-xs text-white/70">
                  {getSelectedDatesArray().length} día
                  {getSelectedDatesArray().length !== 1 ? "s" : ""} seleccionado
                  {getSelectedDatesArray().length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            {!isCustomRangeValid &&
              customDateRange.start &&
              customDateRange.end && (
                <p className="text-xs text-red-300">
                  La fecha de inicio debe ser anterior o igual a la fecha de fin
                </p>
              )}
          </div>
        )}

        {/* Preview Statistics */}
        {dateRange && (
          <div className="flex flex-col gap-3 p-4 bg-white/5 rounded-lg border border-white/20">
            <div className="flex items-center gap-2">
              <FiActivity className="text-white w-4 h-4" />
              <h5 className="text-sm font-medium text-white">
                Vista Previa del Informe
              </h5>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {recordCount}
                </div>
                <div className="text-xs text-white/70">Registros</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {statistics.diasTrabajados}
                </div>
                <div className="text-xs text-white/70">Días</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {statistics.tiempoTotal}
                </div>
                <div className="text-xs text-white/70">Total</div>
              </div>
            </div>

            <div className="text-xs text-white/60 text-center">
              {format(dateRange.start, "dd/MM/yyyy", { locale: es })} -{" "}
              {format(dateRange.end, "dd/MM/yyyy", { locale: es })}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex flex-col gap-2">
          {!hasData && dateRange && (
            <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm">
              No hay registros para el período seleccionado
            </div>
          )}

          <PrimaryButton
            onClick={handleGenerateReport}
            disabled={!canGenerateReport}
            className="w-full"
            size="sm"
          >
            <FiDownload
              className={`w-4 h-4 ${isGenerating ? "animate-bounce" : ""}`}
            />
            {isGenerating ? "Generando PDF..." : "Generar Informe PDF"}
          </PrimaryButton>

          <p className="text-xs text-white/50">
            El informe incluirá el detalle completo de registros del período
            seleccionado.
          </p>
        </div>
      </div>

      {/* Custom Calendar */}
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
