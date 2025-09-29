import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FiClock,
  FiUser,
  FiMessageSquare,
  FiCheck,
  FiX,
  FiFile,
  FiDownload,
} from "react-icons/fi";
import { AbsenceService } from "@/services/absence-service";
import { AdminService } from "@/services/admin-service";
import { AbsenceStatisticsCalculator } from "@/utils/absence-statistics";
import type { Absence, Usuario } from "@/types";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

interface AdminAbsenceDetailsProps {
  selectedDate: Date | null;
  absences: Absence[];
  currentAdmin: Usuario;
  onStatusUpdate: () => void;
}

export function AdminAbsenceDetails({
  selectedDate,
  absences,
  currentAdmin,
  onStatusUpdate,
}: AdminAbsenceDetailsProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [users, setUsers] = useState<Map<string, Usuario>>(new Map());
  const [message, setMessage] = useState<{
    type: "success" | "error";
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

  const handleStatusUpdate = async (
    absenceId: string,
    status: "aprobada" | "rechazada"
  ) => {
    setUpdatingId(absenceId);
    setMessage(null);
    try {
      await AbsenceService.updateAbsenceStatus(
        absenceId,
        status,
        currentAdmin.id
      );
      setMessage({
        type: "success",
        text:
          status === "aprobada"
            ? "Ausencia aprobada correctamente"
            : "Ausencia rechazada correctamente",
      });
      setTimeout(() => setMessage(null), 3000);
      onStatusUpdate();
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

  const getAbsenceTypeLabel = (tipo: string): string => {
    return AbsenceStatisticsCalculator.getReasonLabel(tipo);
  };

  const isSystemGenerated = (absence: Absence): boolean => {
    // Check if it's a system-generated absence (holiday or day off)
    // Adjust these string values to match your actual AbsenceType enum
    return absence.tipoAusencia === "dia_libre";
  };

  const getStatusBadge = (absence: Absence) => {
    const isSystem = isSystemGenerated(absence);

    if (isSystem) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-green-500/20 text-green-300 border-green-500/30">
          Aprobada
        </span>
      );
    }

    const styles: Record<string, string> = {
      pendiente: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      aprobada: "bg-green-500/20 text-green-300 border-green-500/30",
      rechazada: "bg-red-500/20 text-red-300 border-red-500/30",
    };

    const labels: Record<string, string> = {
      pendiente: "Pendiente",
      aprobada: "Aprobada",
      rechazada: "Rechazada",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
          styles[absence.estado]
        }`}
      >
        {labels[absence.estado]}
      </span>
    );
  };

  if (!selectedDate) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 flex items-center justify-center">
        <p className="text-white/60 text-center">
          Selecciona una fecha en el calendario para ver los detalles de las
          ausencias
        </p>
      </div>
    );
  }

  if (absences.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-4">
          {format(selectedDate, "EEEE, dd 'de' MMMM yyyy", { locale: es })}
        </h3>
        <p className="text-white/60">
          No hay ausencias reportadas para esta fecha
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">
        {format(selectedDate, "EEEE, dd 'de' MMMM yyyy", { locale: es })}
      </h3>

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

      <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto">
        {absences.map((absence) => {
          const user = users.get(absence.usuarioId);
          const approverUser = absence.aprobadoPor
            ? users.get(absence.aprobadoPor)
            : null;
          const isSystem = isSystemGenerated(absence);

          return (
            <div
              key={absence.id}
              className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FiUser className="text-white w-5 h-5" />
                  <div>
                    <p className="text-white font-semibold">
                      {user?.nombre || "Usuario desconocido"}
                    </p>
                    <p className="text-white/60 text-sm">
                      {getAbsenceTypeLabel(absence.tipoAusencia)}
                    </p>
                  </div>
                </div>
                {getStatusBadge(absence)}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <FiClock className="text-white/60 w-4 h-4" />
                  <div>
                    <p className="text-white/60 text-xs">Hora Inicio</p>
                    <p className="text-white font-medium">
                      {absence.horaInicio}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FiClock className="text-white/60 w-4 h-4" />
                  <div>
                    <p className="text-white/60 text-xs">Hora Fin</p>
                    <p className="text-white font-medium">{absence.horaFin}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-white/60 text-xs mb-1">Motivo</p>
                <p className="text-white text-sm">
                  {AbsenceStatisticsCalculator.getReasonLabel(absence.razon)}
                </p>
              </div>

              {absence.comentarios && (
                <div className="mb-4 p-3 bg-white/5 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FiMessageSquare className="text-white/60 w-4 h-4 mt-0.5" />
                    <div>
                      <p className="text-white/60 text-xs mb-1">Comentarios</p>
                      <p className="text-white/80 text-sm">
                        {absence.comentarios}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {absence.adjuntoUrl && (
                <div className="mb-4 p-3 bg-white/5 rounded-lg">
                  <a
                    href={absence.adjuntoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white hover:text-white/80 text-sm transition-colors"
                  >
                    <FiFile className="w-4 h-4" />
                    <span>
                      {absence.adjuntoNombre || "Ver documento adjunto"}
                    </span>
                    <FiDownload className="w-4 h-4 ml-auto" />
                  </a>
                </div>
              )}

              <div className="text-white/50 text-xs mb-4">
                {isSystem
                  ? "Generado automáticamente por el sistema"
                  : `Reportado: ${format(
                      absence.createdAt,
                      "dd/MM/yyyy HH:mm",
                      {
                        locale: es,
                      }
                    )}`}
              </div>

              {absence.estado === "pendiente" && !isSystem && (
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
              )}

              {absence.estado !== "pendiente" &&
                absence.aprobadoPor &&
                !isSystem && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-white/50 text-xs">
                      {absence.estado === "aprobada" ? "Aprobada" : "Rechazada"}{" "}
                      por {approverUser?.nombre || "administrador"}
                      {absence.fechaAprobacion &&
                        ` el ${format(
                          absence.fechaAprobacion,
                          "dd/MM/yyyy HH:mm",
                          {
                            locale: es,
                          }
                        )}`}
                    </p>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
