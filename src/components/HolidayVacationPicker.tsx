import { useState, useRef } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FiCalendar, FiPlus, FiTrash2 } from "react-icons/fi";
import { DateManager, type DateRange } from "@/utils/date-management";
import { CustomCalendar } from "@/components/ui/CustomCalendar";

interface HolidayVacationPickerProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
}

export function HolidayVacationPicker({
  selectedDates,
  onDatesChange,
}: HolidayVacationPickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleBulkSelect = (dates: string[]) => {
    let newDates = [...selectedDates];

    dates.forEach((date) => {
      if (!newDates.includes(date)) {
        newDates.push(date);
      }
    });

    onDatesChange(newDates.sort());
  };

  const handleRemoveDate = (date: string) => {
    const newDates = DateManager.removeSingleDate(selectedDates, date);
    onDatesChange(newDates);
  };

  const handleRemoveRange = (range: DateRange) => {
    const newDates = DateManager.removeDateRange(selectedDates, range);
    onDatesChange(newDates);
  };

  const handleClearAll = () => {
    onDatesChange([]);
  };

  const dateRanges = DateManager.groupIntoRanges(selectedDates);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/10 relative">
      <div className="flex items-center justify-between pb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 max-w-[80%]">
          <FiCalendar className="text-teal flex-shrink-0" />
          Días Libres y Vacaciones
        </h2>
        <button
          ref={buttonRef}
          onClick={() => setShowCalendar(!showCalendar)}
          className="absolute top-6 right-6 p-2 md:px-4 md:py-2 bg-teal/90 text-white rounded-lg hover:bg-teal flex items-center gap-2 transition-colors cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
          <span className="hidden md:block">Agregar</span>
        </button>
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
            {dateRanges.map((range, index) => (
              <div
                key={`${range.start}-${range.end}-${index}`}
                className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-lg border border-white/10"
              >
                <div className="flex flex-col gap-1">
                  {range.count === 1 ? (
                    <span className="text-sm font-medium text-white">
                      {format(parseISO(range.start), "d 'de' MMMM 'de' yyyy", {
                        locale: es,
                      })}
                    </span>
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
                  className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                  title={range.count === 1 ? "Eliminar día" : "Eliminar rango"}
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
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
