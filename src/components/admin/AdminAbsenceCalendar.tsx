import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";
import type { Absence } from "@/types";
import { AbsenceService } from "@/services/absence-service";

interface AdminAbsenceCalendarProps {
  onDateSelect: (date: Date, absences: Absence[]) => void;
  refreshKey: number;
}

export function AdminAbsenceCalendar({
  onDateSelect,
  refreshKey
}: AdminAbsenceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAbsences();
  }, [currentMonth, refreshKey]);

  const loadAbsences = async () => {
    setIsLoading(true);
    console.log(
      "🗓️ AdminAbsenceCalendar: Loading absences for month",
      currentMonth
    );
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      console.log("📅 Date range:", { monthStart, monthEnd });

      const data = await AbsenceService.getAllAbsences(
        monthStart,
        monthEnd,
        true
      );
      console.log("✅ Absences loaded in calendar:", data.length);
      console.log(
        "🔍 Scheduled days in data:",
        data.filter((a) => a.tipoAusencia === "dia_libre").length
      );
      setAbsences(data);
    } catch (error) {
      console.error("❌ Error loading absences:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDatePadded = new Date(monthStart);
  const dayOfWeek = startDatePadded.getDay();
  const paddingDays = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const paddedDays: Date[] = [];
  for (let i = paddingDays; i > 0; i--) {
    const d = new Date(monthStart);
    d.setDate(d.getDate() - i);
    paddedDays.push(d);
  }

  const totalCells = paddedDays.length + daysInMonth.length;
  const remainingCells = 42 - totalCells;
  const nextMonthDays: Date[] = [];
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(monthEnd);
    d.setDate(d.getDate() + i);
    nextMonthDays.push(d);
  }

  const allDays = [...paddedDays, ...daysInMonth, ...nextMonthDays];

  const getAbsencesForDate = (date: Date): Absence[] => {
    return absences.filter((absence) =>
      (absence.fechas || []).some((f) => isSameDay(new Date(f), date))
    );
  };

  const handleDateClick = (date: Date) => {
    const dayAbsences = getAbsencesForDate(date);
    setSelectedDate(date);
    onDateSelect(date, dayAbsences);
  };

  const getDayStyle = (date: Date) => {
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isToday_ = isToday(date);
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const dayAbsences = getAbsencesForDate(date);
    const hasAbsences = dayAbsences.length > 0;

    let classes =
      "relative w-full aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer";

    if (!isCurrentMonth) {
      classes += " text-gray-400 opacity-50";
    } else if (isSelected) {
      classes += " bg-teal text-white shadow-md ring-2 ring-teal ring-offset-2";
    } else if (isToday_) {
      classes +=
        " bg-azul-profundo/10 text-azul-profundo font-bold border-2 border-azul-profundo/30";
    } else {
      classes += " text-white hover:bg-white/10";
    }

    if (hasAbsences && isCurrentMonth) {
      classes += " font-bold";
    }

    return { classes, hasAbsences, absenceCount: dayAbsences.length };
  };

  const getAbsenceIndicatorColor = (absences: Absence[]): string => {
    if (
      absences.some(
        (a) => a.tipoAusencia === "dia_libre"
      )
    ) {
      return "bg-green-500";
    }

    if (absences.some((a) => a.tipoAusencia === "ausencia_completa")) {
      return "bg-red-500";
    }

    if (
      absences.some(
        (a) =>
          a.tipoAusencia === "tardanza" || a.tipoAusencia === "salida_temprana"
      )
    ) {
      return "bg-yellow-500";
    }
    return "bg-orange-500";
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FiCalendar className="text-2xl text-white" />
          <h3 className="text-xl font-bold text-white text-nowrap">
            Calendario de Ausencias
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h4 className="text-lg font-semibold text-white min-w-[180px] text-center">
            {format(currentMonth, "MMMM 'de' yyyy", { locale: es })}
          </h4>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-white">Cargando ausencias...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
              <div key={day} className="h-8 flex items-center justify-center">
                <span className="text-sm font-semibold text-white/60">
                  {day}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {allDays.map((date, index) => {
              const { classes, hasAbsences, absenceCount } = getDayStyle(date);
              const dayAbsences = getAbsencesForDate(date);

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={classes}
                >
                  <span>{format(date, "d")}</span>
                  {hasAbsences && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {Array.from({ length: Math.min(absenceCount, 3) }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${getAbsenceIndicatorColor(
                              dayAbsences
                            )}`}
                          />
                        )
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-white/80">Día completo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-white/80">Tardanza/Salida temprana</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-white/80">Ausencia parcial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-white/80">Día libre programado</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
