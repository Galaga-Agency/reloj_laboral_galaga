import { useState, useEffect } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiX,
  FiDownload,
  FiEdit,
  FiFile,
} from "react-icons/fi";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAbsences } from "@/contexts/AbsenceContext";
import { AdminService } from "@/services/admin-service";
import { AbsenceStatisticsCalculator } from "@/utils/absence-statistics";
import type { Usuario, Absence } from "@/types";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { AbsenceEditModal } from "../../modals/AbsenceEditModal";
import { Toast } from "@/components/ui/Toast";

interface AdminPendingAbsencesProps {
  currentAdmin: Usuario;
  onUpdate: () => void;
}

export function AdminPendingAbsences({
  currentAdmin,
  onUpdate,
}: AdminPendingAbsencesProps) {
  const {
    absences,
    updateAbsenceStatus,
    updateAbsence,
    deleteAbsence,
    isLoading,
  } = useAbsences();
  const [users, setUsers] = useState<Map<string, Usuario>>(new Map());
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [absenceBeingEdited, setAbsenceBeingEdited] = useState<Absence | null>(
    null
  );
  const [toast, setToast] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await AdminService.getAllUsers();
      const userMap = new Map<string, Usuario>();
      allUsers.forEach((user) => userMap.set(user.id, user));
      setUsers(userMap);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const pendingAbsences = absences
    .filter((a) => {
      if (a.estado !== "pendiente") return false;
      if (!a.createdBy) return true;
      if (a.createdBy === currentAdmin.id) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleStatusUpdate = async (
    absenceId: string,
    status: "aprobada" | "rechazada"
  ) => {
    setUpdatingId(absenceId);
    try {
      await updateAbsenceStatus(absenceId, status);
      setToast({
        type: "success",
        text:
          status === "aprobada"
            ? "Ausencia aprobada correctamente"
            : "Ausencia rechazada correctamente",
      });
      onUpdate();
    } catch (error) {
      setToast({
        type: "error",
        text: "Error al actualizar el estado de la ausencia",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (absenceId: string) => {
    setUpdatingId(absenceId);
    try {
      await deleteAbsence(absenceId);
      setToast({
        type: "success",
        text: "Ausencia eliminada correctamente",
      });
      onUpdate();
    } catch (error) {
      setToast({
        type: "error",
        text: "Error al eliminar la ausencia",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="text-center py-12">
          <div className="text-white">Cargando ausencias pendientes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.text}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FiAlertCircle className="text-yellow-400 text-2xl" />
          <div>
            <h3 className="text-xl font-bold text-white">
              Ausencias Pendientes de Aprobación
            </h3>
            <p className="text-white/60 text-sm">
              {pendingAbsences.length} solicitudes esperando revisión
            </p>
          </div>
        </div>
      </div>

      {pendingAbsences.length === 0 ? (
        <div className="text-center py-12">
          <FiCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <p className="text-white/60">
            No hay ausencias pendientes de aprobación
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pendingAbsences.map((absence) => {
            const user = users.get(absence.usuarioId);

            return (
              <div
                key={absence.id}
                className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-yellow-400/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {user?.nombre || "Usuario desconocido"}
                    </p>
                    <p className="text-white/60 text-sm">
                      {AbsenceStatisticsCalculator.getTypeLabel(
                        absence.tipoAusencia
                      )}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                    Pendiente
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Fecha(s):</span>
                    <span className="text-white font-medium">
                      {absence.fechas.length === 1
                        ? format(absence.fechas[0], "dd/MM/yyyy EEEE", {
                            locale: es,
                          })
                        : `${format(absence.fechas[0], "dd/MM/yyyy", {
                            locale: es,
                          })} - ${format(
                            absence.fechas[absence.fechas.length - 1],
                            "dd/MM/yyyy",
                            { locale: es }
                          )} (${absence.fechas.length} días)`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Horario:</span>
                    <span className="text-white font-medium">
                      {absence.horaInicio} - {absence.horaFin}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-white/60 text-xs mb-1">Motivo:</p>
                    <p className="text-white text-sm">
                      {AbsenceStatisticsCalculator.getReasonLabel(
                        absence.razon
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <PrimaryButton
                    onClick={() => handleStatusUpdate(absence.id, "aprobada")}
                    disabled={updatingId === absence.id}
                    size="sm"
                    className="flex-1"
                  >
                    <FiCheck className="w-4 h-4" />
                    {updatingId === absence.id ? "Procesando..." : "Aprobar"}
                  </PrimaryButton>

                  <SecondaryButton
                    onClick={() => setAbsenceBeingEdited(absence)}
                    size="sm"
                    className="flex-1 bg-white/10 text-white/80 hover:text-white border-white/80 hover:border-white"
                  >
                    <FiEdit /> Editar
                  </SecondaryButton>

                  <SecondaryButton
                    onClick={() => handleDelete(absence.id)}
                    disabled={updatingId === absence.id}
                    size="sm"
                    darkBg
                    className="flex-1 !bg-red-500/10 !text-red-500 !border-red-500/80 !hover:border-red"
                  >
                    <FiX className="w-4 h-4" />
                    Eliminar
                  </SecondaryButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {absenceBeingEdited && (
        <AbsenceEditModal
          isOpen={!!absenceBeingEdited}
          onClose={() => setAbsenceBeingEdited(null)}
          isLoading={isUpdating}
          editingAbsence={absenceBeingEdited}
          currentAdmin={currentAdmin}
          onSubmit={async (updates) => {
            setIsUpdating(true);
            try {
              await updateAbsence(absenceBeingEdited.id, updates);
              setToast({
                type: "success",
                text: "Ausencia actualizada correctamente",
              });
              setAbsenceBeingEdited(null);
              onUpdate();
            } catch (err) {
              setToast({
                type: "error",
                text: "Error al actualizar ausencia",
              });
            } finally {
              setIsUpdating(false);
            }
          }}
        />
      )}
    </div>
  );
}
