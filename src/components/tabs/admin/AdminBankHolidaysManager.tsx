import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FiCalendar,
  FiPlus,
  FiTrash2,
  FiUsers,
  FiAlertCircle,
} from "react-icons/fi";
import { AbsenceService } from "@/services/absence-service";
import type { Usuario } from "@/types";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { CustomInput } from "@/components/ui/CustomInput";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { CustomCalendar } from "@/components/ui/CustomCalendar";

interface AdminBankHolidaysManagerProps {
  currentAdmin: Usuario;
}

interface Holiday {
  date: string;
  name: string;
}

export function AdminBankHolidaysManager({ currentAdmin }: AdminBankHolidaysManagerProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    date: string;
    name: string;
  }>({ isOpen: false, date: "", name: "" });

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);

      const holidaysList = await AbsenceService.getHolidays(
        startOfYear,
        endOfYear
      );
      setHolidays(holidaysList);
    } catch (error) {
      console.error("Error loading holidays:", error);
    }
  };

  const handleDateSelect = (dates: string[]) => {
    if (dates.length > 0) {
      setNewHolidayDate(dates[0]);
    }
    setShowCalendar(false);
  };

  const handleCreateHoliday = async () => {
    if (!newHolidayDate || !newHolidayName.trim()) {
      setMessage({
        type: "error",
        text: "Por favor completa todos los campos",
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsCreating(true);
    try {
      const holidayDate = new Date(newHolidayDate + "T00:00:00");

      const result = await AbsenceService.createHolidayForAllUsers(
        holidayDate,
        newHolidayName.trim(),
        currentAdmin.id,
        currentAdmin.nombre
      );

      if (result.success) {
        setMessage({
          type: "success",
          text: `Festivo "${newHolidayName}" creado para ${result.count} empleados`,
        });
        setTimeout(() => setMessage(null), 5000);

        setNewHolidayDate("");
        setNewHolidayName("");
        loadHolidays();
      } else {
        setMessage({
          type: "error",
          text: result.error || "Error al crear el festivo",
        });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      console.error("Error creating holiday:", error);
      setMessage({
        type: "error",
        text: "Error al crear el festivo",
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteHoliday = async () => {
    try {
      const holidayDate = new Date(deleteConfirm.date + "T00:00:00");

      const result = await AbsenceService.deleteHolidayForAllUsers(holidayDate);

      if (result.success) {
        setMessage({
          type: "success",
          text: `Festivo "${deleteConfirm.name}" eliminado`,
        });
        setTimeout(() => setMessage(null), 3000);
        loadHolidays();
      } else {
        setMessage({
          type: "error",
          text: result.error || "Error al eliminar el festivo",
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting holiday:", error);
      setMessage({
        type: "error",
        text: "Error al eliminar el festivo",
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setDeleteConfirm({ isOpen: false, date: "", name: "" });
    }
  };

  return (
    <>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <div className="flex items-center gap-3 pb-6 border-b border-white/10">
            <FiCalendar className="w-5 h-5 text-white" />
          <div>
            <h2 className="text-xl font-bold text-white">Festivos</h2>
            <p className="text-white/70 text-sm">
              Crea festivos que se aplicarán a todos los empleados activos
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg ${
              message.type === "success"
                ? "bg-green-500/20 border border-green-500/30 text-green-300"
                : "bg-red-500/20 border border-red-500/30 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            Crear Nuevo Festivo
          </h3>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-white pb-2">
                Fecha del Festivo
              </label>
              <button
                ref={calendarTriggerRef}
                type="button"
                onClick={() => setShowCalendar(true)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white hover:bg-white/10 focus:ring-2 focus:ring-teal focus:border-teal transition-all duration-200 flex items-center justify-between"
              >
                <span>
                  {newHolidayDate
                    ? format(new Date(newHolidayDate), "dd/MM/yyyy")
                    : "Seleccionar fecha"}
                </span>
                <FiCalendar className="w-5 h-5 text-white/50" />
              </button>
            </div>

            <CustomInput
              label="Nombre del Festivo"
              type="text"
              value={newHolidayName}
              onChange={(e) => setNewHolidayName(e.target.value)}
              variant="darkBg"
              placeholder="Ej: Día de Navidad, Año Nuevo..."
            />

            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <FiAlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-300 text-sm">
                Este festivo se creará automáticamente como ausencia aprobada
                para todos los empleados activos del sistema
              </p>
            </div>

            <PrimaryButton
              onClick={handleCreateHoliday}
              disabled={isCreating}
              className="w-full"
            >
              <FiUsers className="w-4 h-4" />
              {isCreating ? "Creando festivo..." : "Crear Festivo Para Todos"}
            </PrimaryButton>
          </div>
        </div>

        {holidays.length > 0 && (
          <div className="mt-6">
            <h3 className="text-white font-semibold mb-4">
              Festivos Programados
            </h3>
            <div className="flex flex-col gap-2">
              {holidays.map((holiday) => (
                <div
                  key={holiday.date}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div>
                    <p className="text-white font-medium">{holiday.name}</p>
                    <p className="text-white/60 text-sm">
                      {format(new Date(holiday.date), "PPP", { locale: es })}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setDeleteConfirm({
                        isOpen: true,
                        date: holiday.date,
                        name: holiday.name,
                      })
                    }
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Eliminar festivo"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDeleteHoliday}
        onCancel={() => setDeleteConfirm({ isOpen: false, date: "", name: "" })}
        title="Eliminar Festivo"
        message={`¿Estás seguro de que quieres eliminar el festivo "${deleteConfirm.name}"? Esto eliminará la ausencia de todos los empleados para esta fecha.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {showCalendar && (
        <CustomCalendar
          selectedDates={newHolidayDate ? [newHolidayDate] : []}
          onBulkSelect={handleDateSelect}
          onClose={() => setShowCalendar(false)}
          triggerRef={calendarTriggerRef}
          allowPastDates={true}
        />
      )}
    </>
  );
}
