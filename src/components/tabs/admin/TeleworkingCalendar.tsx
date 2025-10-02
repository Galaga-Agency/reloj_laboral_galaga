import { useEffect, useState } from "react";
import { useTeleworking } from "@/contexts/TeleworkingContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
  FiHome,
} from "react-icons/fi";

interface TeleworkingCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function TeleworkingCalendar({
  selectedDate,
  onDateSelect,
}: TeleworkingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const { schedules, refreshSchedules, isLoading } = useTeleworking();

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    refreshSchedules(year, month);
  }, [currentMonth, refreshSchedules]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const getSchedulesForDay = (day: Date) => {
    return schedules.filter((s) => isSameDay(s.fecha, day));
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Cargando horarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
          <div
            key={day}
            className="text-center text-white/50 text-sm font-medium py-2"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day) => {
          const daySchedules = getSchedulesForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const remoteCount = daySchedules.filter(
            (s) => s.location === "remote"
          ).length;
          const officeCount = daySchedules.filter(
            (s) => s.location === "office"
          ).length;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`
                min-h-[80px] p-2 rounded-lg border transition-all
                ${
                  isSelected
                    ? "bg-teal border-teal shadow-lg"
                    : isCurrentMonth
                    ? "bg-white/5 border-white/10 hover:bg-white/10"
                    : "bg-transparent border-transparent text-white/30"
                }
                ${isToday && !isSelected ? "ring-2 ring-teal/50" : ""}
              `}
            >
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`text-sm font-medium ${
                    isSelected
                      ? "text-white"
                      : isCurrentMonth
                      ? "text-white"
                      : "text-white/30"
                  }`}
                >
                  {format(day, "d")}
                </span>

                {isCurrentMonth && (remoteCount > 0 || officeCount > 0) && (
                  <div className="flex gap-1 mt-1">
                    {remoteCount > 0 && (
                      <div className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-300 flex items-center gap-1">
                        <FiHome className="w-3 h-3" />
                        {remoteCount}
                      </div>
                    )}
                    {officeCount > 0 && (
                      <div className="px-2 py-1 bg-green-500/20 rounded text-xs text-green-300 flex items-center gap-1">
                        <FiBriefcase className="w-3 h-3" />
                        {officeCount}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
