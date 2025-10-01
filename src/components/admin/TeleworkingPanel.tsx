import { useState, useEffect } from "react";
import { TeleworkingService } from "@/services/teleworking-service";
import { AdminService } from "@/services/admin-service";
import type { Usuario } from "@/types";
import type {
  DailyTeleworkingView,
  TeleworkingLocation,
} from "@/types/teleworking";
import { TeleworkingCalendar } from "./TeleworkingCalendar";
import { TeleworkingDailyView } from "./TeleworkingDailyView";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiCalendar } from "react-icons/fi";
import { TeleworkingScheduleModal } from "../modals/TeleworkingScheduleModal";

interface TeleworkingPanelProps {
  currentAdmin: Usuario;
}

export function TeleworkingPanel({ currentAdmin }: TeleworkingPanelProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyView, setDailyView] = useState<DailyTeleworkingView | null>(null);
  const [allUsers, setAllUsers] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [view, users] = await Promise.all([
        TeleworkingService.getScheduleForDate(selectedDate),
        AdminService.getAllUsers(),
      ]);

      setDailyView(view);
      setAllUsers(users.filter((u) => u.isActive && u.role === "employee"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleUser = (user?: Usuario) => {
    setSelectedUser(user || null);
    setShowScheduleModal(true);
  };

  const handleScheduleSaved = async () => {
    setShowScheduleModal(false);
    setSelectedUser(null);
    await loadData();
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await TeleworkingService.deleteSchedule(scheduleId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting schedule");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FiCalendar className="w-6 h-6 text-teal" />
            <h2 className="text-2xl font-bold text-white">
              Gestión de Teletrabajo
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-white/70 text-sm">
              {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", {
                locale: es,
              })}
            </div>
            <button
              onClick={() => handleScheduleUser()}
              className="px-4 py-2 bg-teal hover:bg-teal/90 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
              <FiCalendar className="w-4 h-4" />
              Programar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300 mb-4">
            {error}
          </div>
        )}

        <TeleworkingCalendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>

      {isLoading ? (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mx-auto mb-4"></div>
          <p className="text-white/70">Cargando datos...</p>
        </div>
      ) : (
        dailyView && (
          <TeleworkingDailyView
            view={dailyView}
            selectedDate={selectedDate}
            onScheduleUser={handleScheduleUser}
            onDeleteSchedule={handleDeleteSchedule}
          />
        )
      )}

      {showScheduleModal && (
        <TeleworkingScheduleModal
          user={selectedUser}
          date={selectedDate}
          currentAdmin={currentAdmin}
          allUsers={allUsers}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedUser(null);
          }}
          onSave={handleScheduleSaved}
        />
      )}
    </div>
  );
}
