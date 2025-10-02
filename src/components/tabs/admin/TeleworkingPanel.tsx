import { useState } from "react";
import { useTeleworking } from "@/contexts/TeleworkingContext";
import type { Usuario } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiCalendar } from "react-icons/fi";
import { TeleworkingCalendar } from "./TeleworkingCalendar";
import { TeleworkingDailyView } from "./TeleworkingDailyView";
import { TeleworkingScheduleModal } from "../../modals/TeleworkingScheduleModal";

interface TeleworkingPanelProps {
  currentAdmin: Usuario;
}

export function TeleworkingPanel({ currentAdmin }: TeleworkingPanelProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { refreshSchedules } = useTeleworking();

  const handleScheduleUser = (user?: Usuario) => {
    setSelectedUser(user || null);
    setShowScheduleModal(true);
  };

  const handleScheduleSaved = async () => {
    setShowScheduleModal(false);
    setSelectedUser(null);
    await refreshSchedules(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1
    );
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

      <TeleworkingDailyView
        selectedDate={selectedDate}
        onScheduleUser={handleScheduleUser}
      />

      {showScheduleModal && (
        <TeleworkingScheduleModal
          user={selectedUser}
          date={selectedDate}
          currentAdmin={currentAdmin}
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
