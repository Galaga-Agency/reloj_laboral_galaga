import { useState, useRef } from "react";
import { FiX, FiHome, FiCalendar } from "react-icons/fi";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CustomCalendar } from "@/components/ui/CustomCalendar";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { TeleworkingService } from "@/services/teleworking-service";
import type { Usuario } from "@/types";

interface TeleworkRequestModalProps {
  usuario: Usuario;
  onClose: () => void;
  onSuccess: () => void;
}

export function TeleworkRequestModal({
  usuario,
  onClose,
  onSuccess,
}: TeleworkRequestModalProps) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calendarTriggerRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = async () => {
    if (selectedDates.length === 0) {
      setError("Debes seleccionar al menos una fecha");
      return;
    }

    if (!reason.trim()) {
      setError("Debes indicar el motivo de la solicitud");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const schedules = selectedDates.map((dateStr) => ({
        usuarioId: usuario.id,
        fecha: new Date(dateStr),
        location: "remote" as const,
      }));

      await TeleworkingService.bulkCreateSchedules(schedules, usuario);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al enviar solicitud"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-white border-b border-hielo/30 p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <FiHome className="text-teal text-2xl" />
            <h2 className="text-2xl font-bold text-azul-profundo">
              Solicitar Teletrabajo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hielo/20 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6 text-azul-profundo" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-azul-profundo">
              Fechas solicitadas
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
                        { locale: es }
                      )
                    : `${selectedDates.length} días seleccionados`
                  : "Seleccionar fechas"}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-azul-profundo">
              Motivo de la solicitud
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica por qué necesitas teletrabajar estos días..."
              rows={4}
              className="w-full px-4 py-3 border rounded-xl bg-hielo/20 border-hielo/50 text-azul-profundo focus:ring-2 focus:ring-teal focus:border-teal focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              Tu solicitud será enviada a un administrador para su aprobación.
              Recibirás una notificación cuando sea procesada.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-hielo/30 flex gap-3">
          <SecondaryButton onClick={onClose} className="flex-1">
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Solicitud"
            )}
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
          allowPastDates={false}
        />
      )}
    </div>
  );
}
