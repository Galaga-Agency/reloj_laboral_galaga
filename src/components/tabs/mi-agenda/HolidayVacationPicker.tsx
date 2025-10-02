import { useState, useRef } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FiCalendar, FiPlus, FiTrash2, FiRefreshCw } from "react-icons/fi";
import { DateManager, type DateRange } from "@/utils/date-management";
import { CustomCalendar } from "@/components/ui/CustomCalendar";
import type { Absence, Usuario } from "@/types";
import { AbsenceService } from "@/services/absence-service";

interface HolidayVacationPickerProps {
  daysOff: Absence[];
  onRefresh?: () => void;
  onDelete: (absenceId: string) => void;
  currentUserId: string;
  currentUser: Usuario;
}

export function HolidayVacationPicker({
  daysOff,
  onRefresh,
  onDelete,
  currentUserId,
  currentUser,
}: HolidayVacationPickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedDates = daysOff.flatMap((d) =>
    d.fechas.map((f) => format(f, "yyyy-MM-dd"))
  );

  const dateRanges = DateManager.groupIntoRanges(selectedDates);

  const getAbsenceForDate = (dateStr: string): Absence | undefined => {
    return daysOff.find((d) =>
      d.fechas.some((f) => format(f, "yyyy-MM-dd") === dateStr)
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendiente: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-300",
        border: "border-yellow-500/30",
        label: "Pendiente",
      },
      aprobada: {
        bg: "bg-green-500/20",
        text: "text-green-300",
        border: "border-green-500/30",
        label: "Aprobada",
      },
      rechazada: {
        bg: "bg-red-500/20",
        text: "text-red-300",
        border: "border-red-500/30",
        label: "Rechazada",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}
      >
        {config.label}
      </span>
    );
  };

  const handleBulkSelect = async (dates: string[]) => {
    try {
      const fechas = dates.map((d) => new Date(d + "T00:00:00"));

      await AbsenceService.createAbsence({
        usuarioId: currentUserId,
        fechas,
        tipoAusencia: "dia_libre",
        horaInicio: "00:00",
        horaFin: "23:59",
        razon: "Vacaciones",
        comentarios: "Bloque de días libres agregado por el usuario",
        createdBy: currentUserId,
        isAdmin: currentUser.isAdmin,
      });

      if (onRefresh) await onRefresh();
      setShowCalendar(false);
    } catch (error) {
      console.error("Error creating days off block:", error);
    }
  };

  const handleRemoveDate = (date: string) => {
    const absence = getAbsenceForDate(date);
    if (absence) onDelete(absence.id);
  };

  const handleRemoveRange = (range: DateRange) => {
    const absencesToDelete = daysOff.filter((d) =>
      d.fechas.some((f) => {
        const dateStr = format(f, "yyyy-MM-dd");
        return dateStr >= range.start && dateStr <= range.end;
      })
    );
    absencesToDelete.forEach((a) => onDelete(a.id));
  };

  const handleClearAll = () => {
    daysOff.forEach((a) => onDelete(a.id));
  };

  const handleRefresh = async () => {
    if (isRefreshing || !onRefresh) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/10 relative">
      <div className="flex items-center justify-between pb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 max-w-[80%]">
          <FiCalendar className="text-white flex-shrink-0" />
          Días Libres y Vacaciones
        </h2>
        <div className="absolute top-6 right-6 flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors ${
                isRefreshing ? "opacity-70" : ""
              }`}
              title="Refrescar"
            >
              <FiRefreshCw
                className={`w-6 h-6 transition-transform duration-500 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
            </button>
          )}
          <button
            ref={buttonRef}
            onClick={() => setShowCalendar(!showCalendar)}
            className="p-2 md:px-4 md:py-2 bg-teal/90 text-white rounded-lg hover:bg-teal flex items-center gap-2 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden md:block">Agregar</span>
          </button>
        </div>
      </div>

      {showCalendar && (
        <CustomCalendar
          selectedDates={selectedDates}
          onBulkSelect={handleBulkSelect}
          onClose={() => setShowCalendar(false)}
          triggerRef={buttonRef}
        />
      )}

      {selectedDates.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">
              {selectedDates.length} días seleccionados
            </span>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
            >
              <FiTrash2 className="w-4 h-4" />
              Limpiar todo
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {dateRanges.map((range, index) => {
              const absence = getAbsenceForDate(range.start);
              
              return (
                <div
                  key={`${range.start}-${range.end}-${index}`}
                  className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-lg border border-white/10"
                >
                  <div className="flex flex-col gap-1 flex-1">
                    {range.count === 1 ? (
                      <>
                        <span className="text-sm font-medium text-white">
                          {format(
                            parseISO(range.start),
                            "d 'de' MMMM 'de' yyyy",
                            { locale: es }
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/60 italic">
                            {absence?.razon || "Vacaciones"}
                          </span>
                          {absence && getStatusBadge(absence.estado)}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-white">
                          {format(parseISO(range.start), "d 'de' MMMM", {
                            locale: es,
                          })}{" "}
                          -{" "}
                          {format(parseISO(range.end), "d 'de' MMMM 'de' yyyy", {
                            locale: es,
                          })}
                        </span>
                        <span className="text-xs text-white/60">
                          {range.count} días consecutivos
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/60 italic">
                            {absence?.razon || "Vacaciones"}
                          </span>
                          {absence && getStatusBadge(absence.estado)}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (range.count === 1) {
                        handleRemoveDate(range.start);
                      } else {
                        handleRemoveRange(range);
                      }
                    }}
                    className="text-red-400 hover:text-red-300 p-1 cursor-pointer ml-3"
                    title={range.count === 1 ? "Eliminar día" : "Eliminar rango"}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-white/60 flex flex-col items-center">
          <FiCalendar className="w-12 h-12 mx-auto opacity-30 pb-2" />
          <p className="text-sm">No hay días libres configurados</p>
          <p className="text-xs">Haz clic en "Agregar" para añadir días</p>
        </div>
      )}
    </div>
  );
}