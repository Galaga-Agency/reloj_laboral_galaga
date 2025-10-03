import { useMemo, useState } from "react";
import { useTeleworking } from "@/contexts/TeleworkingContext";
import type { TeleworkingSchedule } from "@/types/teleworking";
import type { Usuario } from "@/types";
import { format, isEqual, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { FiCheck, FiX, FiHome, FiBriefcase } from "react-icons/fi";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface PendingTeleworkRequestsProps {
  currentAdmin: Usuario;
  allUsers: Usuario[];
  onRequestsChanged?: () => Promise<void>;
}

interface GroupedRequest {
  ids: string[];
  usuarioId: string;
  usuarioName: string;
  location: "remote" | "office";
  startDate: Date;
  endDate: Date;
  notes?: string;
  schedules: TeleworkingSchedule[];
}

export function PendingTeleworkRequests({
  currentAdmin,
  allUsers,
  onRequestsChanged,
}: PendingTeleworkRequestsProps) {
  const {
    schedules: allSchedules,
    approveSchedule,
    rejectSchedule,
  } = useTeleworking();
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    ids: string[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingRequests = useMemo(() => {
    const pending = allSchedules.filter((s) => s.estado === "pendiente");
    return groupConsecutiveRequests(pending, allUsers);
  }, [allSchedules, allUsers]);

  const handleApprove = async (ids: string[]) => {
    setIsProcessing(true);
    try {
      for (const id of ids) {
        await approveSchedule(id);
      }
      if (onRequestsChanged) {
        await onRequestsChanged();
      }
    } catch (error) {
      console.error("Error approving schedule:", error);
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  const handleReject = async (ids: string[]) => {
    setIsProcessing(true);
    try {
      for (const id of ids) {
        await rejectSchedule(id);
      }
      if (onRequestsChanged) {
        await onRequestsChanged();
      }
    } catch (error) {
      console.error("Error rejecting schedule:", error);
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  if (pendingRequests.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-bold text-white mb-4">
          Solicitudes Pendientes
        </h3>
        <p className="text-white/50 text-sm text-center py-8">
          No hay solicitudes pendientes de aprobación
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            Solicitudes Pendientes
          </h3>
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-medium">
            {pendingRequests.length} solicitud
            {pendingRequests.length !== 1 ? "es" : ""}
          </span>
        </div>

        <div className="space-y-3">
          {pendingRequests.map((request, index) => (
            <div
              key={`${request.usuarioId}-${index}`}
              className="bg-white/5 rounded-lg p-4 border border-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-white font-medium">
                      {request.usuarioName}
                    </p>
                    <div
                      className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                        request.location === "remote"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-green-500/20 text-green-300"
                      }`}
                    >
                      {request.location === "remote" ? (
                        <>
                          <FiHome className="w-3 h-3" />
                          Teletrabajo
                        </>
                      ) : (
                        <>
                          <FiBriefcase className="w-3 h-3" />
                          Oficina
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-white/70 text-sm mb-1">
                    {isEqual(request.startDate, request.endDate) ? (
                      format(request.startDate, "EEEE, d 'de' MMMM", {
                        locale: es,
                      })
                    ) : (
                      <>
                        {format(request.startDate, "d 'de' MMMM", {
                          locale: es,
                        })}{" "}
                        -{" "}
                        {format(request.endDate, "d 'de' MMMM 'de' yyyy", {
                          locale: es,
                        })}
                      </>
                    )}
                  </p>

                  {request.notes && (
                    <p className="text-white/50 text-xs mt-2 italic">
                      "{request.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setConfirmAction({ type: "approve", ids: request.ids })
                    }
                    disabled={isProcessing}
                    className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-300 transition-colors disabled:opacity-50"
                    title="Aprobar"
                  >
                    <FiCheck className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setConfirmAction({ type: "reject", ids: request.ids })
                    }
                    disabled={isProcessing}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition-colors disabled:opacity-50"
                    title="Rechazar"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmAction !== null}
        onConfirm={() => {
          if (confirmAction?.type === "approve") {
            handleApprove(confirmAction.ids);
          } else if (confirmAction?.type === "reject") {
            handleReject(confirmAction.ids);
          }
        }}
        onCancel={() => setConfirmAction(null)}
        title={
          confirmAction?.type === "approve"
            ? "Aprobar solicitud"
            : "Rechazar solicitud"
        }
        message={
          confirmAction?.type === "approve"
            ? "¿Deseas aprobar esta solicitud de teletrabajo?"
            : "¿Deseas rechazar esta solicitud de teletrabajo? Esta acción eliminará la solicitud."
        }
        confirmText={confirmAction?.type === "approve" ? "Aprobar" : "Rechazar"}
        cancelText="Cancelar"
      />
    </>
  );
}

function groupConsecutiveRequests(
  schedules: TeleworkingSchedule[],
  allUsers: Usuario[]
): GroupedRequest[] {
  if (schedules.length === 0) return [];

  const sorted = [...schedules].sort(
    (a, b) => a.fecha.getTime() - b.fecha.getTime()
  );

  const groups: GroupedRequest[] = [];
  let currentGroup: GroupedRequest | null = null;

  for (const schedule of sorted) {
    const usuario = allUsers.find((u) => u.id === schedule.usuarioId);
    const usuarioName = usuario?.nombre || schedule.createdByName || "Unknown";

    const nextDay = currentGroup ? addDays(currentGroup.endDate, 1) : null;
    const scheduleDate = new Date(schedule.fecha);
    scheduleDate.setHours(0, 0, 0, 0);

    if (nextDay) {
      nextDay.setHours(0, 0, 0, 0);
    }

    const canGroup =
      currentGroup &&
      currentGroup.usuarioId === schedule.usuarioId &&
      currentGroup.location === schedule.location &&
      (currentGroup.notes || "") === (schedule.notes || "") &&
      nextDay &&
      nextDay.getTime() === scheduleDate.getTime();

    if (canGroup && currentGroup) {
      currentGroup.ids.push(schedule.id);
      currentGroup.endDate = schedule.fecha;
      currentGroup.schedules.push(schedule);
    } else {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        ids: [schedule.id],
        usuarioId: schedule.usuarioId,
        usuarioName,
        location: schedule.location,
        startDate: schedule.fecha,
        endDate: schedule.fecha,
        notes: schedule.notes || undefined,
        schedules: [schedule],
      };
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}
