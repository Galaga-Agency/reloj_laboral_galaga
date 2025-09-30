import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiUser, FiPlus, FiTrash2, FiEdit3, FiCalendar } from "react-icons/fi";
import { AbsenceService } from "@/services/absence-service";
import { AdminService } from "@/services/admin-service";
import type { Usuario } from "@/types";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { CustomInput } from "@/components/ui/CustomInput";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { CustomCalendar } from "@/components/ui/CustomCalendar";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface AdminDaysOffManagerProps {
  currentAdmin: Usuario;
}

interface DayOff {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  fecha: string;
  razon: string;
}

export function AdminDaysOffManager({
  currentAdmin,
}: AdminDaysOffManagerProps) {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dayOffReason, setDayOffReason] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    dayOffId: string;
    userNombre: string;
    fecha: string;
  }>({ isOpen: false, dayOffId: "", userNombre: "", fecha: "" });

  const [editDayOff, setEditDayOff] = useState<DayOff | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadUsers();
    loadDaysOff();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await AdminService.getAllUsers();
      const activeUsers = allUsers.filter((u) => u.isActive);
      setUsers(activeUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadDaysOff = async () => {
    try {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);

      const absences = await AbsenceService.getAllAbsences(
        startOfYear,
        endOfYear
      );

      const daysOffList = absences
        .filter((a) => a.tipoAusencia === "dia_libre")
        .flatMap((a) =>
          a.fechas.map((f) => ({
            id: a.id,
            usuarioId: a.usuarioId,
            usuarioNombre: "",
            fecha: format(new Date(f), "yyyy-MM-dd"),
            razon: a.razon,
          }))
        );

      const allUsers = await AdminService.getAllUsers();
      const userMap = new Map(allUsers.map((u) => [u.id, u.nombre]));

      daysOffList.forEach((d) => {
        d.usuarioNombre = userMap.get(d.usuarioId) || "Usuario desconocido";
      });

      setDaysOff(daysOffList);
    } catch (error) {
      console.error("Error loading days off:", error);
    }
  };

  const handleDateSelect = (dates: string[]) => {
    setSelectedDates(dates);
    setShowCalendar(false);
  };

  const handleCreateDaysOff = async () => {
    if (!selectedUserId || selectedDates.length === 0 || !dayOffReason.trim()) {
      setMessage({
        type: "error",
        text: "Por favor completa todos los campos",
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsCreating(true);
    try {
      for (const dateStr of selectedDates) {
        const dayOffDate = new Date(dateStr + "T00:00:00");

        await AbsenceService.createAbsence({
          usuarioId: selectedUserId,
          fechas: [dayOffDate],
          tipoAusencia: "dia_libre",
          horaInicio: "00:00",
          horaFin: "23:59",
          razon: dayOffReason.trim(),
          comentarios: `Día libre creado por ${currentAdmin.nombre}`,
          createdBy: currentAdmin.id,
          isAdmin: currentAdmin.isAdmin,
        });
      }

      const userName =
        users.find((u) => u.id === selectedUserId)?.nombre || "usuario";
      setMessage({
        type: "success",
        text: `${selectedDates.length} día(s) libre(s) creado(s) para ${userName}`,
      });
      setTimeout(() => setMessage(null), 5000);

      setSelectedUserId("");
      setSelectedDates([]);
      setDayOffReason("");
      loadDaysOff();
    } catch (error) {
      console.error("Error creating days off:", error);
      setMessage({ type: "error", text: "Error al crear los días libres" });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDayOff = async () => {
    try {
      await AbsenceService.deleteAbsence(deleteConfirm.dayOffId);
      setMessage({
        type: "success",
        text: "Día libre eliminado correctamente",
      });
      setTimeout(() => setMessage(null), 3000);
      loadDaysOff();
    } catch (error) {
      console.error("Error deleting day off:", error);
      setMessage({ type: "error", text: "Error al eliminar el día libre" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setDeleteConfirm({
        isOpen: false,
        dayOffId: "",
        userNombre: "",
        fecha: "",
      });
    }
  };

  const handleUpdateDayOff = async () => {
    if (!editDayOff) return;

    setIsUpdating(true);
    try {
      await AbsenceService.updateAbsence(
        editDayOff.id,
        {
          fechas: [new Date(editDayOff.fecha)],
          razon: editDayOff.razon,
        },
        { id: currentAdmin.id, isAdmin: currentAdmin.isAdmin }
      );

      setMessage({
        type: "success",
        text: "Día libre actualizado correctamente",
      });
      setTimeout(() => setMessage(null), 3000);

      setEditDayOff(null);
      loadDaysOff();
    } catch (error) {
      console.error("Error updating day off:", error);
      setMessage({ type: "error", text: "Error al actualizar el día libre" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const userOptions = users.map((u) => ({ value: u.id, label: u.nombre }));

  const groupedDaysOff = daysOff.reduce((acc, dayOff) => {
    if (!acc[dayOff.usuarioId]) {
      acc[dayOff.usuarioId] = { usuarioNombre: dayOff.usuarioNombre, days: [] };
    }
    acc[dayOff.usuarioId].days.push(dayOff);
    return acc;
  }, {} as Record<string, { usuarioNombre: string; days: DayOff[] }>);

  return (
    <>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-white/10">
          <FiUser className="w-5 h-5 text-white" />

          <div>
            <h2 className="text-xl font-bold text-white">
              Gestión de Días Libres
            </h2>
            <p className="text-white/70 text-sm">
              Asigna días libres individuales a empleados específicos
            </p>
          </div>
        </div>

        {/* Message */}
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

        {/* Create Section */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            Asignar Día(s) Libre(s)
          </h3>

          <div className="flex flex-col gap-4">
            <CustomDropdown
              options={userOptions}
              value={selectedUserId}
              onChange={(value: any) => setSelectedUserId(value as string)}
              placeholder="Seleccionar empleado"
              variant="darkBg"
            />

            <div>
              <label className="block text-sm font-medium text-white pb-2">
                Fecha(s) del Día Libre
              </label>
              <button
                ref={calendarTriggerRef}
                type="button"
                onClick={() => setShowCalendar(true)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white hover:bg-white/10 flex items-center justify-between"
              >
                <span>
                  {selectedDates.length > 0
                    ? `${selectedDates.length} fecha(s) seleccionada(s)`
                    : "Seleccionar fecha(s)"}
                </span>
                <FiCalendar className="w-5 h-5 text-white/50" />
              </button>
            </div>

            <CustomInput
              label="Motivo del Día Libre"
              type="text"
              value={dayOffReason}
              onChange={(e) => setDayOffReason(e.target.value)}
              variant="darkBg"
              placeholder="Ej: Asuntos personales, vacaciones..."
            />

            <PrimaryButton
              onClick={handleCreateDaysOff}
              disabled={isCreating}
              className="w-full"
            >
              <FiUser className="w-4 h-4" />
              {isCreating ? "Creando..." : "Crear Día(s) Libre(s)"}
            </PrimaryButton>
          </div>
        </div>

        {/* List Section */}
        {Object.keys(groupedDaysOff).length > 0 && (
          <div className="mt-6">
            <h3 className="text-white font-semibold mb-4">
              Días Libres Programados
            </h3>
            <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto">
              {Object.entries(groupedDaysOff).map(([userId, data]) => (
                <div
                  key={userId}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FiUser className="w-4 h-4 text-white" />
                    <p className="text-white font-semibold">
                      {data.usuarioNombre}
                    </p>
                    <span className="ml-auto text-white/60 text-sm">
                      {data.days.length} día(s)
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {data.days.map((dayOff) => (
                      <div
                        key={dayOff.id}
                        className="flex items-center justify-between p-2 bg-white/5 rounded"
                      >
                        <div>
                          <p className="text-white text-sm">
                            {format(new Date(dayOff.fecha), "PPP", {
                              locale: es,
                            })}
                          </p>
                          <p className="text-white/60 text-xs">
                            {dayOff.razon}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditDayOff(dayOff)}
                            className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                dayOffId: dayOff.id,
                                userNombre: dayOff.usuarioNombre,
                                fecha: dayOff.fecha,
                              })
                            }
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDeleteDayOff}
        onCancel={() =>
          setDeleteConfirm({
            isOpen: false,
            dayOffId: "",
            userNombre: "",
            fecha: "",
          })
        }
        title="Eliminar Día Libre"
        message={`¿Eliminar el día libre de ${deleteConfirm.userNombre} del ${
          deleteConfirm.fecha
            ? format(new Date(deleteConfirm.fecha), "PPP", { locale: es })
            : ""
        }?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Edit Modal */}
      {editDayOff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiEdit3 className="w-5 h-5" /> Editar Día Libre
            </h3>

            <CustomInput
              label="Motivo"
              type="text"
              value={editDayOff.razon}
              onChange={(e) =>
                setEditDayOff({ ...editDayOff, razon: e.target.value })
              }
              variant="lightBg"
            />

            <div className="mt-4 flex justify-end gap-2">
              <SecondaryButton onClick={() => setEditDayOff(null)}>
                Cancelar
              </SecondaryButton>
              <PrimaryButton onClick={handleUpdateDayOff} disabled={isUpdating}>
                {isUpdating ? "Guardando..." : "Guardar Cambios"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      {showCalendar && (
        <CustomCalendar
          selectedDates={selectedDates}
          onBulkSelect={handleDateSelect}
          onClose={() => setShowCalendar(false)}
          triggerRef={calendarTriggerRef}
          allowPastDates={true}
        />
      )}
    </>
  );
}
