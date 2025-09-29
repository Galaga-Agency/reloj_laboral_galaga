import { useState, useEffect } from "react";
import { FiAlertCircle, FiCheck, FiX, FiDownload, FiFile } from "react-icons/fi";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AbsenceService } from "@/services/absence-service";
import { AdminService } from "@/services/admin-service";
import { AbsenceStatisticsCalculator } from "@/utils/absence-statistics";
import type { Absence, Usuario } from "@/types";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

interface AdminPendingAbsencesProps {
  currentAdmin: Usuario;
  onUpdate: () => void;
}

export function AdminPendingAbsences({ currentAdmin, onUpdate }: AdminPendingAbsencesProps) {
  const [pendingAbsences, setPendingAbsences] = useState<Absence[]>([]);
  const [users, setUsers] = useState<Map<string, Usuario>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [absences, allUsers] = await Promise.all([
        AbsenceService.getAllAbsences(),
        AdminService.getAllUsers(),
      ]);

      const pending = absences.filter(a => a.estado === "pendiente");
      pending.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const userMap = new Map<string, Usuario>();
      allUsers.forEach(user => userMap.set(user.id, user));

      setPendingAbsences(pending);
      setUsers(userMap);
    } catch (error) {
      console.error("Error loading pending absences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (absenceId: string, status: "aprobada" | "rechazada") => {
    setUpdatingId(absenceId);
    setMessage(null);
    try {
      await AbsenceService.updateAbsenceStatus(absenceId, status, currentAdmin.id);
      setMessage({
        type: "success",
        text: status === "aprobada" ? "Ausencia aprobada correctamente" : "Ausencia rechazada correctamente",
      });
      setTimeout(() => setMessage(null), 3000);
      await loadData();
      onUpdate();
    } catch (error) {
      console.error("Error updating absence status:", error);
      setMessage({
        type: "error",
        text: "Error al actualizar el estado de la ausencia",
      });
      setTimeout(() => setMessage(null), 5000);
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FiAlertCircle className="text-yellow-400 text-2xl" />
          <div>
            <h3 className="text-xl font-bold text-white">Ausencias Pendientes de Aprobación</h3>
            <p className="text-white/60 text-sm">{pendingAbsences.length} solicitudes esperando revisión</p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg mb-4 ${
            message.type === "success"
              ? "bg-green-500/20 border border-green-500/30 text-green-300"
              : "bg-red-500/20 border border-red-500/30 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {pendingAbsences.length === 0 ? (
        <div className="text-center py-12">
          <FiCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <p className="text-white/60">No hay ausencias pendientes de aprobación</p>
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
                      {AbsenceStatisticsCalculator.getTypeLabel(absence.tipoAusencia)}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                    Pendiente
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Fecha:</span>
                    <span className="text-white font-medium">
                      {format(absence.fecha, "dd/MM/yyyy EEEE", { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Horario:</span>
                    <span className="text-white font-medium">
                      {absence.horaInicio} - {absence.horaFin}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Duración:</span>
                    <span className="text-white font-medium">
                      {Math.floor(absence.duracionMinutos / 60)}h {absence.duracionMinutos % 60}m
                    </span>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-white/60 text-xs mb-1">Motivo:</p>
                    <p className="text-white text-sm">
                      {AbsenceStatisticsCalculator.getReasonLabel(absence.razon)}
                    </p>
                  </div>
                  {absence.comentarios && (
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-white/60 text-xs mb-1">Comentarios:</p>
                      <p className="text-white/80 text-sm">{absence.comentarios}</p>
                    </div>
                  )}
                  {absence.adjuntoUrl && (
                    <div className="pt-2 border-t border-white/10">
                      
                      <a  href={absence.adjuntoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-teal hover:text-teal/80 text-sm transition-colors"
                      >
                        <FiFile className="w-4 h-4" />
                        <span>{absence.adjuntoNombre || "Ver documento adjunto"}</span>
                        <FiDownload className="w-4 h-4 ml-auto" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="text-white/50 text-xs mb-4">
                  Reportado: {format(absence.createdAt, "dd/MM/yyyy HH:mm", { locale: es })}
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
                    onClick={() => handleStatusUpdate(absence.id, "rechazada")}
                    disabled={updatingId === absence.id}
                    size="sm"
                    darkBg
                    className="flex-1"
                  >
                    <FiX className="w-4 h-4" />
                    Rechazar
                  </SecondaryButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}