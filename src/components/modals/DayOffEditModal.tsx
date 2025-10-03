import { createPortal } from "react-dom";
import { useState, useRef } from "react";
import { FiX, FiCalendar } from "react-icons/fi";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { CustomCalendar } from "@/components/ui/CustomCalendar";
import { CustomInput } from "@/components/ui/CustomInput";
import { parse } from "date-fns";

interface DayOffEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updates: { fechas: Date[]; razon: string }) => Promise<void>;
  isLoading: boolean;
  dayOff: {
    id: string;
    usuarioId: string;
    usuarioNombre: string;
    fecha: string;
    razon: string;
    dateCount: number;
  } | null;
}

export function DayOffEditModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  dayOff,
}: DayOffEditModalProps) {
  if (!isOpen || !dayOff) return null;

  const parseFechaString = (fechaStr: string): string[] => {
    if (fechaStr.includes(" - ")) {
      const [start, end] = fechaStr.split(" - ");
      const startDate = parse(start, "dd/MM/yyyy", new Date());
      const endDate = parse(end, "dd/MM/yyyy", new Date());
      const dates: string[] = [];
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        dates.push(format(d, "yyyy-MM-dd"));
      }
      return dates;
    } else {
      const singleDate = parse(fechaStr, "dd/MM/yyyy", new Date());
      return [format(singleDate, "yyyy-MM-dd")];
    }
  };

  const [selectedDates, setSelectedDates] = useState<string[]>(
    parseFechaString(dayOff.fecha)
  );
  const [razon, setRazon] = useState(dayOff.razon);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = async () => {
    await onSubmit({
      fechas: selectedDates.map((d) => new Date(d)),
      razon,
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-6">
          <h3 className="text-2xl font-bold text-azul-profundo">
            Editar Día Libre
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-azul-profundo/60 hover:text-azul-profundo hover:bg-hielo/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-azul-profundo">
              Empleado
            </label>
            <div className="px-4 py-3 bg-hielo/10 border border-hielo/30 rounded-xl text-azul-profundo">
              {dayOff.usuarioNombre}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-azul-profundo">
              Fecha(s) del Día Libre
            </label>
            <button
              ref={calendarTriggerRef}
              onClick={() => setShowCalendar(true)}
              className="flex items-center gap-2 px-4 py-3 bg-hielo/20 border border-hielo/50 rounded-xl text-azul-profundo hover:bg-hielo/30 transition-colors"
            >
              <FiCalendar className="w-5 h-5" />
              <span>
                {selectedDates.length > 0
                  ? selectedDates.length === 1
                    ? format(
                        new Date(selectedDates[0]),
                        "EEEE, dd 'de' MMMM yyyy",
                        {
                          locale: es,
                        }
                      )
                    : `${selectedDates.length} días seleccionados`
                  : "Seleccionar fecha"}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-azul-profundo">
              Motivo
            </label>
            <CustomInput
              type="text"
              variant="lightBg"
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <SecondaryButton onClick={onClose} disabled={isLoading}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </PrimaryButton>
        </div>
      </div>

      {showCalendar && (
        <CustomCalendar
          selectedDates={selectedDates}
          onBulkSelect={(dates) => {
            setSelectedDates(dates);
            setShowCalendar(false);
          }}
          onClose={() => setShowCalendar(false)}
          triggerRef={calendarTriggerRef}
          allowPastDates={true}
        />
      )}
    </div>,
    document.body
  );
}
