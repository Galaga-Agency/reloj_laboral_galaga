import { useState, useEffect, useRef } from "react";
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
  const [isMobile, setIsMobile] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const recalc = () => {
    if (!triggerRef.current || isMobile) return;
    const btn = triggerRef.current.getBoundingClientRect();
    const width = boxRef.current?.offsetWidth ?? 320;
    const height = boxRef.current?.offsetHeight ?? 360;
    const margin = 8;

    let top = btn.bottom + margin;
    let left = btn.left;

    if (
      top + height + margin > window.innerHeight &&
      btn.top - height - margin >= margin
    ) {
      top = btn.top - height - margin;
    }

    const minLeft = margin;
    const maxLeft = window.innerWidth - width - margin;
    left = Math.max(minLeft, Math.min(left, maxLeft));
    const minTop = margin;
    const maxTop = window.innerHeight - height - margin;
    top = Math.max(minTop, Math.min(top, maxTop));

    setPosition({ top, left });
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    recalc();
    const onResizeScroll = () => recalc();
    window.addEventListener("resize", onResizeScroll);
    window.addEventListener("scroll", onResizeScroll, true);
    return () => {
      window.removeEventListener("resize", onResizeScroll);
      window.removeEventListener("scroll", onResizeScroll, true);
    };
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) recalc();
  }, [boxRef.current]);

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

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (isBefore(date, startOfDay(new Date()))) return;
    if (!firstClick) {
      setFirstClick(dateStr);
      setTempDates([dateStr]);
    } else {
      const start = new Date(firstClick) <= date ? new Date(firstClick) : date;
      const end = new Date(firstClick) <= date ? date : new Date(firstClick);
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
      "w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all";
    if (isDisabled) classes += " text-gray-300 cursor-not-allowed";
    else if (isSelected || isTempSelected)
      classes += " bg-teal text-white shadow-md";
    else if (isToday_)
      classes +=
        " bg-azul-profundo/10 text-azul-profundo font-bold border-2 border-azul-profundo/30";
    else if (!isCurrentMonth) classes += " text-gray-400";
    else classes += " text-azul-profundo hover:bg-hielo/30";
    return classes;
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-transparent z-[9998]"
        onClick={handleCancel}
      />
      {isMobile ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            ref={boxRef}
            className="w-full max-w-sm bg-blanco rounded-xl shadow-2xl border border-hielo/30 p-4"
          >
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
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
                <div key={day} className="h-8 flex items-center justify-center">
                  <span className="text-xs font-semibold text-azul-profundo/60">
                    {day}
                  </span>
                </div>
              ))}
            </div>
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
        </div>
      ) : (
        <div
          ref={boxRef}
          className="fixed bg-blanco rounded-xl shadow-2xl border border-hielo/30 p-4 z-[9999] min-w-80"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
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
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
              <div key={day} className="h-8 flex items-center justify-center">
                <span className="text-xs font-semibold text-azul-profundo/60">
                  {day}
                </span>
              </div>
            ))}
          </div>
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
      )}
    </>,
    document.body
  );
}
