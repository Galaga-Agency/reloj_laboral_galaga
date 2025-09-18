import { useState, useEffect, useRef } from "react";
import { FiEdit3, FiX, FiCalendar } from "react-icons/fi";
import { format } from "date-fns";
import type { RegistroTiempo, Usuario } from "@/types";
import {
  TimeCorrectionsService,
  type CorrectionRequest,
} from "@/services/time-corrections-service";
import { DateFormatUtils } from "@/utils/date-format";
import { CustomInput } from "@/components/ui/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { CustomCalendar } from "@/components/ui/CustomCalendar";

interface TimeRecordCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: RegistroTiempo | null;
  user: Usuario | null;
  currentAdmin: Usuario;
  onSuccess: () => void;
}

export function TimeRecordCorrectionModal({
  isOpen,
  onClose,
  record,
  user,
  currentAdmin,
  onSuccess,
}: TimeRecordCorrectionModalProps) {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [razon, setRazon] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (record && isOpen) {
      setFecha(format(record.fecha, "yyyy-MM-dd"));
      setHora(format(record.fecha, "HH:mm:ss"));
      setRazon("");
      setError(null);
    }
  }, [record, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!record || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (!razon.trim()) {
        setError("Debe proporcionar una razón para la corrección");
        return;
      }

      const newDateTime = new Date(`${fecha}T${hora}`);
      const changes: CorrectionRequest["changes"] = {};
      let hasChanges = false;

      if (newDateTime.getTime() !== record.fecha.getTime()) {
        changes.fecha = newDateTime;
        hasChanges = true;
      }

      if (!hasChanges) {
        setError("No se detectaron cambios en el registro");
        return;
      }

      const correctionRequest: CorrectionRequest = {
        recordId: record.id,
        userId: user.id,
        adminId: currentAdmin.id,
        reason: razon.trim(),
        changes,
        ipAddress: "127.0.0.1",
        userAgent: navigator.userAgent,
      };

      const result = await TimeCorrectionsService.applyCorrection(
        correctionRequest
      );

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Error desconocido");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error applying correction"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateSelect = (dates: string[]) => {
    if (dates.length > 0) {
      setFecha(dates[0]);
    }
    setShowCalendar(false);
  };

  if (!isOpen || !record || !user) return null;

  const recordTypeText =
    record.tipoRegistro === "entrada" ? "Entrada" : "Salida";

  return (
    <>
      <div className="fixed inset-0 bg-azul-profundo/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-blanco rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between pb-6 border-b border-hielo/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal/10 rounded-lg">
                  <FiEdit3 className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-azul-profundo">
                    Corregir {recordTypeText}
                  </h2>
                  <p className="text-azul-profundo/70 text-sm">{user.nombre}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-azul-profundo/50 hover:text-azul-profundo hover:bg-hielo/30 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 p-4 bg-hielo/20 rounded-xl border border-hielo/30">
              <h3 className="text-azul-profundo font-semibold pb-3">
                Registro Actual:
              </h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-azul-profundo/70">Tipo:</span>
                  <span className="font-medium text-azul-profundo">
                    {recordTypeText}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-azul-profundo/70">Fecha y Hora:</span>
                  <span className="font-medium text-azul-profundo">
                    {DateFormatUtils.formatDateTime(record.fecha)}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="pt-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-azul-profundo pb-2">
                  Fecha
                </label>
                <div className="relative">
                  <button
                    ref={calendarTriggerRef}
                    type="button"
                    onClick={() => setShowCalendar(true)}
                    className="w-full px-4 py-3 bg-hielo/20 border border-hielo/50 rounded-xl text-azul-profundo font-medium hover:bg-hielo/30 focus:ring-2 focus:ring-teal focus:border-teal transition-all duration-200 flex items-center justify-between"
                  >
                    <span>
                      {fecha
                        ? format(new Date(fecha), "dd/MM/yyyy")
                        : "Seleccionar fecha"}
                    </span>
                    <FiCalendar className="w-5 h-5 text-azul-profundo/50" />
                  </button>
                </div>
              </div>

              <CustomInput
                label="Hora"
                type="time"
                step="1"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-medium text-azul-profundo pb-2">
                  Razón de la Corrección *
                </label>
                <textarea
                  value={razon}
                  onChange={(e) => setRazon(e.target.value)}
                  placeholder={`Ej: El empleado olvidó marcar la ${record.tipoRegistro} debido a una reunión urgente`}
                  className="w-full px-4 py-3 border border-hielo/50 rounded-xl bg-blanco/90 text-azul-profundo transition-all duration-200 focus:ring-2 focus:ring-teal focus:border-teal focus:outline-none resize-none"
                  rows={3}
                  required
                />
                <p className="text-azul-profundo/60 text-xs mt-1">
                  Esta razón quedará registrada permanentemente en el sistema de
                  auditoría
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-hielo/30">
                <SecondaryButton onClick={onClose} size="sm">
                  Cancelar
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={isSubmitting} size="sm">
                  {isSubmitting ? "Aplicando..." : "Aplicar Corrección"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showCalendar && (
        <CustomCalendar
          selectedDates={fecha ? [fecha] : []}
          onBulkSelect={handleDateSelect}
          onClose={() => setShowCalendar(false)}
          triggerRef={calendarTriggerRef}
          allowPastDates={true}
        />
      )}
    </>
  );
}
