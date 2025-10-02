import { FiAlertCircle, FiHome, FiBriefcase, FiSun } from "react-icons/fi";
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import type { Absence } from "@/types";
import type { TeleworkingSchedule } from "@/types/teleworking";

interface AgendaCalendarProps {
  absences: Absence[];
  teleworkSchedules: TeleworkingSchedule[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function AgendaCalendar({
  absences,
  teleworkSchedules,
  selectedDate,
  onDateSelect,
  currentMonth,
  onMonthChange,
}: AgendaCalendarProps) {
  const getAbsencesForDate = (date: Date) => {
    return absences.filter((absence) =>
      absence.fechas.some((f) => isSameDay(f, date))
    );
  };

  const getTeleworkForDate = (date: Date) => {
    return teleworkSchedules.filter((schedule) =>
      isSameDay(schedule.fecha, date)
    );
  };

  const monthStart = startOfMonth(currentMonth);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-white capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex gap-1.5 md:gap-2">
          <button
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            className="px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-sm md:text-base"
          >
            ←
          </button>
          <button
            onClick={() => {
              const today = new Date();
              onMonthChange(today);
              onDateSelect(today);
            }}
            className="px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs md:text-sm transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            className="px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-sm md:text-base"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
          <div
            key={day}
            className="text-center text-white/50 text-xs md:text-sm font-medium py-1 md:py-2"
          >
            {day}
          </div>
        ))}

        {Array.from({ length: 35 }, (_, i) => {
          const firstDay = monthStart.getDay();
          const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1;
          const dayNumber = i - adjustedFirst + 1;
          const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            dayNumber
          );
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(date, new Date());
          const isSelected = isSameDay(date, selectedDate);

          if (!isCurrentMonth) {
            return <div key={i} className="min-h-[60px] md:min-h-[80px]" />;
          }

          const dayAbsences = getAbsencesForDate(date);
          const dayTelework = getTeleworkForDate(date);

          const hasHoliday = dayAbsences.some(
            (a) => a.tipoAusencia === "dia_libre"
          );
          const hasRealAbsence = dayAbsences.some(
            (a) => a.tipoAusencia !== "dia_libre"
          );

          return (
            <button
              key={i}
              onClick={() => onDateSelect(date)}
              className={`min-h-[60px] md:min-h-[80px] p-1.5 md:p-2 rounded-lg border transition-all relative ${
                hasHoliday
                  ? "bg-amber-500/20 border-amber-500/40"
                  : isSelected
                  ? "bg-teal border-teal shadow-lg"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              } ${
                isToday && !isSelected && !hasHoliday
                  ? "ring-2 ring-teal/50"
                  : ""
              }`}
            >
              <div className="flex flex-col items-center gap-0.5 md:gap-1">
                <span
                  className={`text-xs md:text-sm font-medium ${
                    hasHoliday ? "text-amber-300" : "text-white"
                  }`}
                >
                  {dayNumber}
                </span>

                {hasHoliday && (
                  <FiSun className="w-3 h-3 md:w-4 md:h-4 text-amber-400" />
                )}

                {hasRealAbsence && (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-400" />
                  </div>
                )}

                {dayTelework.length > 0 && (
                  <div className="flex gap-1">
                    {dayTelework.some((t) => t.location === "remote") && (
                      <FiHome className="w-2.5 h-2.5 md:w-3 md:h-3 text-blue-400" />
                    )}
                    {dayTelework.some((t) => t.location === "office") && (
                      <FiBriefcase className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-400" />
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 md:mt-6 p-3 md:p-4 bg-white/10 rounded-xl">
        <h3 className="text-base md:text-lg font-bold text-white mb-2 md:mb-3">
          {format(selectedDate, "EEEE, dd 'de' MMMM yyyy", { locale: es })}
        </h3>

        <div className="space-y-2 md:space-y-3">
          {getAbsencesForDate(selectedDate).map((absence) => (
            <div
              key={absence.id}
              className={`p-2.5 md:p-3 rounded-lg border ${
                absence.tipoAusencia === "dia_libre"
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  {absence.tipoAusencia === "dia_libre" && (
                    <FiSun className="w-4 h-4 md:w-5 md:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div
                      className={`font-medium text-sm md:text-base ${
                        absence.tipoAusencia === "dia_libre"
                          ? "text-amber-300"
                          : "text-white"
                      }`}
                    >
                      {absence.tipoAusencia === "dia_libre"
                        ? "Día Libre"
                        : "Ausencia"}
                    </div>
                    <div className="text-white/60 text-xs md:text-sm mt-1">
                      {absence.razon}
                    </div>
                    {absence.tipoAusencia !== "dia_libre" && (
                      <div className="text-white/50 text-xs mt-1">
                        {absence.horaInicio} - {absence.horaFin}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                    absence.estado === "aprobada"
                      ? "bg-green-500/20 text-green-400"
                      : absence.estado === "pendiente"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {absence.estado}
                </span>
              </div>
            </div>
          ))}

          {getTeleworkForDate(selectedDate).map((schedule) => (
            <div
              key={schedule.id}
              className="p-2.5 md:p-3 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center gap-2">
                {schedule.location === "remote" ? (
                  <FiHome className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                ) : (
                  <FiBriefcase className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400" />
                )}
                <div>
                  <div className="text-white font-medium text-sm md:text-base">
                    {schedule.location === "remote" ? "Teletrabajo" : "Oficina"}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {getAbsencesForDate(selectedDate).length === 0 &&
            getTeleworkForDate(selectedDate).length === 0 && (
              <div className="text-center text-white/50 py-3 md:py-4 text-sm md:text-base">
                No hay eventos para este día
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
