import { useState, useEffect } from "react";
import { FiAlertCircle, FiHome } from "react-icons/fi";
import { startOfMonth, endOfMonth } from "date-fns";
import { AbsenceFormModal } from "@/components/modals/AbsenceFormModal";
import { TeleworkRequestModal } from "@/components/modals/TeleworkRequestModal";
import { AbsenceService } from "@/services/absence-service";
import { TeleworkingService } from "@/services/teleworking-service";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import type { Usuario, Absence } from "@/types";
import type { TeleworkingSchedule } from "@/types/teleworking";
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
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showTeleworkModal, setShowTeleworkModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [teleworkSchedules, setTeleworkSchedules] = useState<
    TeleworkingSchedule[]
  >([]);
  const [daysOff, setDaysOff] = useState<Absence[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadUserData();
  }, [currentMonth, usuario.id]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const [absencesData, allTeleworkData, allDaysOffData] = await Promise.all(
        [
          AbsenceService.getAbsencesByUser(
            usuario.id,
            monthStart,
            monthEnd,
            false
          ),
          TeleworkingService.getSchedulesForMonth(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1
          ),
          AbsenceService.getAbsencesByUser(
            usuario.id,
            undefined,
            undefined,
            true
          ),
        ]
      );

      const userTelework = allTeleworkData.filter(
        (t) => t.usuarioId === usuario.id
      );
      const daysOffData = allDaysOffData.filter(
        (a) => a.tipoAusencia === "dia_libre"
      );

      setAbsences(absencesData);
      setDaysOff(daysOffData);
      setTeleworkSchedules(userTelework);
    } catch (error) {
      console.error("Error loading user agenda data:", error);
      setToast({ type: "error", message: "Error al cargar agenda" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbsenceSuccess = () => {
    loadUserData();
    setShowAbsenceModal(false);
    setToast({ type: "success", message: "Ausencia registrada correctamente" });
  };

  const handleTeleworkSuccess = () => {
    loadUserData();
    setShowTeleworkModal(false);
    setToast({ type: "success", message: "Solicitud de teletrabajo enviada" });
  };

  const handleDeleteDayOff = async (absenceId: string) => {
    try {
      await AbsenceService.deleteAbsence(absenceId);
      await loadUserData();
      setToast({ type: "success", message: "Día libre eliminado" });
    } catch (error) {
      console.error("Error deleting day off:", error);
      setToast({ type: "error", message: "Error al eliminar día libre" });
    }
  };

  const handleDismissTelework = async (id: string) => {
    await TeleworkingService.deleteSchedule(id);
    await loadUserData();
  };

  const handleDismissAbsence = async (id: string) => {
    await AbsenceService.deleteAbsence(id);
    await loadUserData();
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDaysOff = daysOff.filter((d) =>
    d.fechas.some((f) => f >= monthStart && f <= monthEnd)
  );

  const allAbsencesForCalendar = [...absences, ...monthDaysOff];

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
            absences={allAbsencesForCalendar}
            teleworkSchedules={teleworkSchedules}
          />
        </div>
      </div>

      <NotificationCenter
        usuario={usuario}
        teleworkSchedules={teleworkSchedules}
        absences={absences}
        onDismissTelework={handleDismissTelework}
        onDismissAbsence={handleDismissAbsence}
      />

      <HolidayVacationPicker
        daysOff={daysOff}
        onRefresh={loadUserData}
        onDelete={handleDeleteDayOff}
        currentUserId={usuario.id}
        currentUser={usuario}
      />

      <AgendaCalendar
        absences={allAbsencesForCalendar}
        teleworkSchedules={teleworkSchedules}
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
        absences={[...absences, ...daysOff]}
        teleworkSchedules={teleworkSchedules}
        onRefresh={loadUserData}
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
