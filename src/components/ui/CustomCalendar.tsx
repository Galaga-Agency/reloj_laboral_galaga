import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface CalendarProps {
  selectedDates: string[];
  onBulkSelect: (dates: string[]) => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

export function CustomCalendar({
  selectedDates,
  onBulkSelect,
  onClose,
  triggerRef,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempDates, setTempDates] = useState<string[]>([]);
  const [firstClick, setFirstClick] = useState<string | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 8, left: rect.left });
    }
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days
  const startDate = new Date(monthStart);
  const dayOfWeek = startDate.getDay();
  const paddingDays = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const paddedDays = [];
  for (let i = paddingDays; i > 0; i--) {
    const paddingDate = new Date(monthStart);
    paddingDate.setDate(paddingDate.getDate() - i);
    paddedDays.push(paddingDate);
  }

  // Add next month days
  const totalCells = paddedDays.length + daysInMonth.length;
  const remainingCells = 42 - totalCells;
  const nextMonthDays = [];
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(monthEnd);
    nextDate.setDate(nextDate.getDate() + i);
    nextMonthDays.push(nextDate);
  }

  const allDays = [...paddedDays, ...daysInMonth, ...nextMonthDays];

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    if (isBefore(date, startOfDay(new Date()))) return;

    if (!firstClick) {
      // First click
      setFirstClick(dateStr);
      setTempDates([dateStr]);
    } else {
      // Second click - create range
      const startDate = new Date(firstClick);
      const endDate = date;

      const start = startDate <= endDate ? startDate : endDate;
      const end = startDate <= endDate ? endDate : startDate;

      // Create range using eachDayOfInterval
      const rangeDays = eachDayOfInterval({ start, end });
      const rangeDateStrings = rangeDays.map((d) => format(d, "yyyy-MM-dd"));

      setTempDates(rangeDateStrings);
      setFirstClick(null);
    }
  };

  const handleConfirm = () => {
    onBulkSelect(tempDates);
    setTempDates([]);
    setFirstClick(null);
    onClose();
  };

  const handleCancel = () => {
    setTempDates([]);
    setFirstClick(null);
    onClose();
  };

  const getDayStyle = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isSelected = selectedDates.includes(dateStr);
    const isTempSelected = tempDates.includes(dateStr);
    const isToday_ = isToday(date);
    const isDisabled = isBefore(date, startOfDay(new Date()));

    let classes =
      "w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer";

    if (isDisabled) {
      classes += " text-gray-300 cursor-not-allowed";
    } else if (isSelected || isTempSelected) {
      classes += " bg-teal text-white shadow-md";
    } else if (isToday_) {
      classes +=
        " bg-azul-profundo/10 text-azul-profundo font-bold border-2 border-azul-profundo/30";
    } else if (!isCurrentMonth) {
      classes += " text-gray-400";
    } else {
      classes += " text-azul-profundo hover:bg-hielo/30";
    }

    return classes;
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-transparent z-[9998]"
        onClick={handleCancel}
      />
      <div
        className="fixed bg-blanco rounded-xl shadow-2xl border border-hielo/30 p-4 z-[9999] min-w-80"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-hielo/30 rounded-lg"
          >
            <FiChevronLeft className="w-5 h-5 text-azul-profundo" />
          </button>
          <h3 className="text-lg font-bold text-azul-profundo">
            {format(currentMonth, "MMMM 'de' yyyy", { locale: es })}
          </h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-hielo/30 rounded-lg"
          >
            <FiChevronRight className="w-5 h-5 text-azul-profundo" />
          </button>
        </div>

        {/* Days headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
            <div key={day} className="h-8 flex items-center justify-center">
              <span className="text-xs font-semibold text-azul-profundo/60">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {allDays.map((date, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={isBefore(date, startOfDay(new Date()))}
              className={getDayStyle(date)}
            >
              {format(date, "d")}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-hielo/30 pt-4">
          <div className="text-xs text-azul-profundo/60 text-center pb-3">
            {firstClick
              ? "Selecciona la fecha final del rango"
              : "Haz clic en una fecha o selecciona un rango"}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 text-sm border border-hielo/50 text-azul-profundo rounded-lg hover:bg-hielo/20"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={tempDates.length === 0}
              className="flex-1 px-3 py-2 text-sm bg-teal text-white rounded-lg hover:bg-teal/90 disabled:opacity-50"
            >
              Confirmar ({tempDates.length})
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
