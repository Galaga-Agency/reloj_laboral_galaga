import { useState, useRef } from "react";
import { TeleworkingService } from "@/services/teleworking-service";
import type { Usuario } from "@/types";
import type { TeleworkingLocation } from "@/types/teleworking";
import { FiX, FiHome, FiMapPin, FiCalendar } from "react-icons/fi";
import { format } from "date-fns";
import { CustomCalendar } from "@/components/ui/CustomCalendar";

interface TeleworkingScheduleModalProps {
  user: Usuario | null;
  date: Date;
  currentAdmin: Usuario;
  allUsers: Usuario[];
  onClose: () => void;
  onSave: () => void;
}

export function TeleworkingScheduleModal({
  user,
  date,
  currentAdmin,
  allUsers,
  onClose,
  onSave,
}: TeleworkingScheduleModalProps) {
  const [selectedUserId, setSelectedUserId] = useState(user?.id || "");
  const [location, setLocation] = useState<TeleworkingLocation>("office");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([
    format(date, "yyyy-MM-dd"),
  ]);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      setError("Selecciona un empleado");
      return;
    }

    if (selectedDates.length === 0) {
      setError("Selecciona al menos una fecha");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const schedules = selectedDates.map((dateStr) => ({
        usuarioId: selectedUserId,
        fecha: new Date(dateStr),
        location,
      }));

      await TeleworkingService.bulkCreateSchedules(schedules, currentAdmin);

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateSelect = (dates: string[]) => {
    setSelectedDates(dates);
    setShowCalendar(false);
  };

  const formatSelectedDates = () => {
    if (selectedDates.length === 0) return "Seleccionar fechas";
    if (selectedDates.length === 1) {
      return format(new Date(selectedDates[0]), "dd/MM/yyyy");
    }
    return `${selectedDates.length} fechas seleccionadas`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-azul-profundo/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-blanco rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between pb-6 border-b border-hielo/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal/10 rounded-lg">
                  <FiCalendar className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-azul-profundo">
                    Programar Teletrabajo
                  </h2>
                  <p className="text-azul-profundo/70 text-sm">
                    Asignar ubicación de trabajo
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-azul-profundo/50 hover:text-azul-profundo hover:bg-hielo/30 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="pt-6 flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-azul-profundo pb-2">
                  Empleado
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={!!user}
                  className="w-full px-4 py-3 border border-hielo/50 rounded-xl bg-blanco/90 text-azul-profundo transition-all duration-200 focus:ring-2 focus:ring-teal focus:border-teal focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecciona un empleado</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-azul-profundo pb-2">
                  Fechas
                </label>
                <button
                  ref={calendarTriggerRef}
                  type="button"
                  onClick={() => setShowCalendar(true)}
                  className="w-full px-4 py-3 bg-hielo/20 border border-hielo/50 rounded-xl text-azul-profundo font-medium hover:bg-hielo/30 focus:ring-2 focus:ring-teal focus:border-teal transition-all duration-200 flex items-center justify-between"
                >
                  <span>{formatSelectedDates()}</span>
                  <FiCalendar className="w-5 h-5 text-azul-profundo/50" />
                </button>
                <p className="text-azul-profundo/60 text-xs mt-1">
                  Puedes seleccionar múltiples fechas o un rango
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-azul-profundo pb-2">
                  Ubicación
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLocation("office")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      location === "office"
                        ? "border-green-500 bg-green-50"
                        : "border-hielo/50 bg-hielo/20 hover:bg-hielo/30"
                    }`}
                  >
                    <FiMapPin
                      className={`w-6 h-6 mx-auto mb-2 ${
                        location === "office"
                          ? "text-green-500"
                          : "text-azul-profundo/50"
                      }`}
                    />
                    <p
                      className={`text-sm font-medium ${
                        location === "office"
                          ? "text-green-700"
                          : "text-azul-profundo/70"
                      }`}
                    >
                      Oficina
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocation("remote")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      location === "remote"
                        ? "border-blue-500 bg-blue-50"
                        : "border-hielo/50 bg-hielo/20 hover:bg-hielo/30"
                    }`}
                  >
                    <FiHome
                      className={`w-6 h-6 mx-auto mb-2 ${
                        location === "remote"
                          ? "text-blue-500"
                          : "text-azul-profundo/50"
                      }`}
                    />
                    <p
                      className={`text-sm font-medium ${
                        location === "remote"
                          ? "text-blue-700"
                          : "text-azul-profundo/70"
                      }`}
                    >
                      Teletrabajo
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-azul-profundo pb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Añade notas sobre esta programación..."
                  className="w-full px-4 py-3 border border-hielo/50 rounded-xl bg-blanco/90 text-azul-profundo placeholder:text-azul-profundo/40 transition-all duration-200 focus:ring-2 focus:ring-teal focus:border-teal focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-hielo/30">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-hielo/20 hover:bg-hielo/30 rounded-xl text-azul-profundo font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-teal hover:bg-teal/90 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showCalendar && (
        <CustomCalendar
          selectedDates={selectedDates}
          onBulkSelect={handleDateSelect}
          onClose={() => setShowCalendar(false)}
          triggerRef={calendarTriggerRef}
          allowPastDates={false}
        />
      )}
    </>
  );
}
