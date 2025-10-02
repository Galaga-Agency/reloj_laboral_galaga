import { useState, useEffect } from "react";
import { useTeleworking } from "@/contexts/TeleworkingContext";
import { TeleworkingService } from "@/services/teleworking-service";
import type { Usuario } from "@/types";
import type { DailyTeleworkingView } from "@/types/teleworking";
import { FiHome, FiMapPin, FiPlus, FiTrash2 } from "react-icons/fi";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface TeleworkingDailyViewProps {
  selectedDate: Date;
  onScheduleUser: (user: Usuario) => void;
}

export function TeleworkingDailyView({
  selectedDate,
  onScheduleUser,
}: TeleworkingDailyViewProps) {
  const [dailyView, setDailyView] = useState<DailyTeleworkingView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { deleteSchedule, refreshSchedules } = useTeleworking();

  useEffect(() => {
    loadDailyView();
  }, [selectedDate]);

  const loadDailyView = async () => {
    setIsLoading(true);
    try {
      const view = await TeleworkingService.getScheduleForDate(selectedDate);
      setDailyView(view);
    } catch (error) {
      console.error("Error loading daily view:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskDelete = (scheduleId: string) => {
    setPendingDeleteId(scheduleId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId) {
      await deleteSchedule(pendingDeleteId);
      await loadDailyView();
      await refreshSchedules(
        new Date(selectedDate.getFullYear(), 0, 1),
        new Date(selectedDate.getFullYear(), 11, 31)
      );
    }
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mx-auto mb-4"></div>
        <p className="text-white/70">Cargando datos...</p>
      </div>
    );
  }

  if (!dailyView) return null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <FiMapPin className="w-5 h-5 text-green-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Oficina</h3>
                <p className="text-sm text-white/60">
                  {dailyView.office.length} empleados
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {dailyView.office.length === 0 ? (
              <p className="text-white/50 text-sm py-4 text-center">
                No hay empleados programados para oficina
              </p>
            ) : (
              dailyView.office.map(({ usuario, schedule }) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div>
                    <p className="text-white font-medium">{usuario.nombre}</p>
                    <p className="text-white/50 text-sm">{usuario.email}</p>
                    {schedule.notes && (
                      <p className="text-white/40 text-xs mt-1">
                        {schedule.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAskDelete(schedule.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-red-300 transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FiHome className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Teletrabajo</h3>
                <p className="text-sm text-white/60">
                  {dailyView.remote.length} empleados
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {dailyView.remote.length === 0 ? (
              <p className="text-white/50 text-sm py-4 text-center">
                No hay empleados en teletrabajo
              </p>
            ) : (
              dailyView.remote.map(({ usuario, schedule }) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div>
                    <p className="text-white font-medium">{usuario.nombre}</p>
                    <p className="text-white/50 text-sm">{usuario.email}</p>
                    {schedule.notes && (
                      <p className="text-white/40 text-xs mt-1">
                        {schedule.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAskDelete(schedule.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-red-300 transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {dailyView.unscheduled.length > 0 && (
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Sin Programar</h3>
                <p className="text-sm text-white/60">
                  {dailyView.unscheduled.length} empleados sin ubicación
                  asignada
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dailyView.unscheduled.map((usuario) => (
                <button
                  key={usuario.id}
                  onClick={() => onScheduleUser(usuario as Usuario)}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <div className="text-left">
                    <p className="text-white font-medium">{usuario.nombre}</p>
                    <p className="text-white/50 text-sm">{usuario.email}</p>
                  </div>
                  <FiPlus className="w-5 h-5 text-white/40 group-hover:text-teal transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Eliminar asignación"
        message="¿Seguro que deseas eliminar esta asignación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </>
  );
}
