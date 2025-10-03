import { useState, useRef } from "react";
import { FiDownload, FiCalendar, FiFileText } from "react-icons/fi";
import { format } from "date-fns";
import { useTeleworking } from "@/contexts/TeleworkingContext";
import { CustomCalendar } from "@/components/ui/CustomCalendar";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { TeleworkingPDFGenerator } from "@/utils/teleworking-pdf-generator";
import type { Usuario } from "@/types";
import {
  DateRangePreset,
  getDateRangeFromPreset,
  isCustomRangeValid,
} from "@/utils/absence-statistics";

interface TeleworkingReportsProps {
  allUsers: Usuario[];
  currentAdmin: Usuario;
}

export function TeleworkingReports({
  allUsers,
  currentAdmin,
}: TeleworkingReportsProps) {
  const { schedules } = useTeleworking();
  const [selectedPreset, setSelectedPreset] =
    useState<DateRangePreset>("current_month");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [generatingUserReport, setGeneratingUserReport] = useState(false);
  const [generatingCompanyReport, setGeneratingCompanyReport] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);

  const datePresets = [
    { value: "current_month", label: "Mes Actual" },
    { value: "last_month", label: "Mes Pasado" },
    { value: "last_3_months", label: "Últimos 3 Meses" },
    { value: "current_year", label: "Año Actual" },
    { value: "custom", label: "Rango Personalizado" },
  ];

  const dateRange = getDateRangeFromPreset(selectedPreset, customDateRange);

  const filteredSchedules = schedules.filter((s) => {
    const scheduleDate = new Date(s.fecha);
    return scheduleDate >= dateRange.start && scheduleDate <= dateRange.end;
  });

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

  const handleGenerateUserReport = async () => {
    if (!selectedUser) return;

    setGeneratingUserReport(true);
    setMessage(null);

    try {
      await TeleworkingPDFGenerator.generateUserReport(
        selectedUser,
        filteredSchedules,
        dateRange.start,
        dateRange.end
      );
      setMessage({
        type: "success",
        text: `Informe de teletrabajo generado para ${selectedUser.nombre}`,
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
      setGeneratingUserReport(false);
    }
  };

  const handleGenerateCompanyReport = async () => {
    setGeneratingCompanyReport(true);
    setMessage(null);

    try {
      await TeleworkingPDFGenerator.generateCompanyReport(
        filteredSchedules,
        allUsers,
        dateRange.start,
        dateRange.end
      );
      setMessage({
        type: "success",
        text: "Informe consolidado de teletrabajo generado exitosamente",
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

  const userSchedules = selectedUser
    ? filteredSchedules.filter((s) => s.usuarioId === selectedUser.id)
    : [];

  const remoteDays = userSchedules.filter(
    (s) => s.location === "remote"
  ).length;
  const officeDays = userSchedules.filter(
    (s) => s.location === "office"
  ).length;

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <FiFileText className="text-2xl text-white" />
        <h3 className="text-xl font-bold text-white">
          Informes de Teletrabajo
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
            {!isCustomRangeValid(selectedPreset, customDateRange) && (
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
              Informe Consolidado de Teletrabajo
            </h4>
          </div>
          <p className="text-white/60 text-xs mb-3">
            Período:{" "}
            {`${format(dateRange.start, "dd/MM/yyyy")} - ${format(
              dateRange.end,
              "dd/MM/yyyy"
            )}`}
          </p>
          <PrimaryButton
            onClick={handleGenerateCompanyReport}
            disabled={
              generatingCompanyReport ||
              !isCustomRangeValid(selectedPreset, customDateRange) ||
              filteredSchedules.length === 0
            }
            className="w-full"
          >
            {generatingCompanyReport ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando Informe...
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
        <div>
          <label className="text-sm font-medium text-white mb-2 block">
            Seleccionar Empleado
          </label>
          <CustomDropdown
            options={[
              { value: "", label: "Selecciona un empleado" },
              ...allUsers
                .filter((u) => u.role === "employee")
                .map((user) => ({
                  value: user.id,
                  label: user.nombre,
                })),
            ]}
            value={selectedUser?.id || ""}
            onChange={(value: string) => {
              const user = allUsers.find((u) => u.id === value);
              setSelectedUser(user || null);
            }}
            variant="darkBg"
          />
        </div>

        {selectedUser && (
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-white font-semibold mb-3">
              {selectedUser.nombre}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <p className="text-white/60">Días Remotos</p>
                <p className="text-white font-semibold text-lg">{remoteDays}</p>
              </div>
              <div>
                <p className="text-white/60">Días Oficina</p>
                <p className="text-white font-semibold text-lg">{officeDays}</p>
              </div>
            </div>
            <PrimaryButton
              onClick={handleGenerateUserReport}
              disabled={
                generatingUserReport ||
                !isCustomRangeValid(selectedPreset, customDateRange) ||
                userSchedules.length === 0
              }
              className="w-full"
            >
              {generatingUserReport ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FiDownload className="w-5 h-5" />
                  Generar Informe PDF
                </>
              )}
            </PrimaryButton>
          </div>
        )}
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
