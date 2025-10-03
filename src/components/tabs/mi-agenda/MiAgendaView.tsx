import { useState, useEffect } from "react";
import { FiAlertCircle, FiHome } from "react-icons/fi";
import { startOfMonth, endOfMonth } from "date-fns";
import { AbsenceFormModal } from "@/components/modals/AbsenceFormModal";
import { TeleworkRequestModal } from "@/components/modals/TeleworkRequestModal";
import { useAbsences } from "@/contexts/AbsenceContext";
import { useTeleworking } from "@/contexts/TeleworkingContext";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import type { Usuario } from "@/types";
import { AgendaStats } from "@/components/tabs/mi-agenda/AgendaStats";
import { AgendaCalendar } from "@/components/tabs/mi-agenda/AgendaCalendar";
import { HolidayVacationPicker } from "@/components/tabs/mi-agenda/HolidayVacationPicker";
import { AgendaReportGenerator } from "./AgendaReportGenerator";
import { Toast } from "@/components/ui/Toast";
import { NotificationCenter } from "./NotificationCenter";

interface MiAgendaViewProps {
  usuario: Usuario;
}

export function MiAgendaView({ usuario }: MiAgendaViewProps) {
  const { absences: allAbsences, deleteAbsence } = useAbsences();
  const {
    schedules: allTeleworkSchedules,
    deleteSchedule: deleteTeleworkSchedule,
  } = useTeleworking();

  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showTeleworkModal, setShowTeleworkModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [toast, setToast] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  const handleAbsenceSuccess = () => {
    setShowAbsenceModal(false);
    setToast({ type: "success", message: "Ausencia registrada correctamente" });
  };

  const handleTeleworkSuccess = () => {
    setShowTeleworkModal(false);
    setToast({ type: "success", message: "Solicitud de teletrabajo enviada" });
  };

  const handleDeleteDayOff = async (absenceId: string) => {
    try {
      await deleteAbsence(absenceId);
      setToast({ type: "success", message: "Día libre eliminado" });
    } catch (error) {
      console.error("Error deleting day off:", error);
      setToast({ type: "error", message: "Error al eliminar día libre" });
    }
  };

  const handleDismissTelework = async (id: string) => {
    await deleteTeleworkSchedule(id);
  };

  const handleDismissAbsence = async (id: string) => {
    await deleteAbsence(id);
  };

  const userAbsences = allAbsences.filter((a) => a.usuarioId === usuario.id);
  const userTeleworkSchedules = allTeleworkSchedules.filter(
    (t) => t.usuarioId === usuario.id
  );

  const daysOff = userAbsences.filter((a) => a.tipoAusencia === "dia_libre");
  const regularAbsences = userAbsences.filter(
    (a) => a.tipoAusencia !== "dia_libre"
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const monthRegularAbsences = regularAbsences.filter((a) =>
    a.fechas.some((f) => f >= monthStart && f <= monthEnd)
  );

  const monthDaysOff = daysOff.filter((d) =>
    d.fechas.some((f) => f >= monthStart && f <= monthEnd)
  );

  const allAbsencesForCalendar = [...monthRegularAbsences, ...monthDaysOff];

  const monthTeleworkSchedules = userTeleworkSchedules.filter(
    (t) => t.fecha >= monthStart && t.fecha <= monthEnd
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold text-white">Mi Agenda</h1>
            <p className="text-white/60 mt-1">
              Gestiona tus ausencias, teletrabajo y días libres
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <PrimaryButton
              onClick={() => setShowAbsenceModal(true)}
              className="flex items-center gap-2"
            >
              <FiAlertCircle className="w-4 h-4" />
              Reportar Ausencia
            </PrimaryButton>
            <SecondaryButton
              onClick={() => setShowTeleworkModal(true)}
              borderColor="white"
              className="flex items-center gap-2"
            >
              <FiHome className="w-4 h-4" />
              Solicitar Teletrabajo
            </SecondaryButton>
          </div>
        </div>

        <div className="pt-6 relative z-10">
          <AgendaStats
            absences={userAbsences}
            teleworkSchedules={userTeleworkSchedules}
          />
        </div>
      </div>

      <NotificationCenter
        usuario={usuario}
        teleworkSchedules={monthTeleworkSchedules}
        absences={userAbsences.filter((a) =>
          a.fechas.some((f) => f >= monthStart && f <= monthEnd)
        )}
        onDismissTelework={handleDismissTelework}
        onDismissAbsence={handleDismissAbsence}
      />

      <HolidayVacationPicker
        daysOff={daysOff}
        onRefresh={() => {}}
        onDelete={handleDeleteDayOff}
        currentUserId={usuario.id}
        currentUser={usuario}
      />

      <AgendaCalendar
        absences={allAbsencesForCalendar}
        teleworkSchedules={monthTeleworkSchedules}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
      />

      {showAbsenceModal && (
        <AbsenceFormModal
          usuario={usuario}
          onClose={() => setShowAbsenceModal(false)}
          onSuccess={handleAbsenceSuccess}
        />
      )}

      {showTeleworkModal && (
        <TeleworkRequestModal
          usuario={usuario}
          onClose={() => setShowTeleworkModal(false)}
          onSuccess={handleTeleworkSuccess}
        />
      )}

      <AgendaReportGenerator
        usuario={usuario}
        absences={userAbsences}
        teleworkSchedules={userTeleworkSchedules}
        onRefresh={() => {}}
      />

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
    </div>
  );
}
