import { useState, useEffect } from "react";
import { FiAlertCircle, FiCheck, FiX, FiClock, FiEdit3 } from "react-icons/fi";
import {
  TimeCorrectionsService,
  type TimeCorrection,
} from "@/services/time-corrections-service";
import { DateFormatUtils } from "@/utils/date-format";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { TimeRecordCorrectionModal } from "@/components/modals/TimeRecordCorrectionModal";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import type { Usuario, RegistroTiempo } from "@/types";

interface PendingChangesPanelProps {
  currentAdmin: Usuario;
  onChangesProcessed: () => void;
}

export function PendingChangesPanel({
  currentAdmin,
  onChangesProcessed,
}: PendingChangesPanelProps) {
  const [pendingChanges, setPendingChanges] = useState<TimeCorrection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChange, setSelectedChange] = useState<TimeCorrection | null>(
    null
  );
  const [approveConfirm, setApproveConfirm] = useState<{
    isOpen: boolean;
    changeId: string;
  }>({
    isOpen: false,
    changeId: "",
  });
  const [rejectConfirm, setRejectConfirm] = useState<{
    isOpen: boolean;
    changeId: string;
  }>({
    isOpen: false,
    changeId: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<{
    record: RegistroTiempo;
    user: { id: string; nombre: string };
  } | null>(null);

  useEffect(() => {
    loadPendingChanges();
  }, []);

  const loadPendingChanges = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const changes = await TimeCorrectionsService.getPendingChanges();
      setPendingChanges(changes);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error loading pending changes"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const result = await TimeCorrectionsService.approveChange(
        approveConfirm.changeId,
        currentAdmin.id,
        currentAdmin.nombre
      );

      if (result.success) {
        await loadPendingChanges();
        onChangesProcessed();
      } else {
        setError(result.error || "Error approving change");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error approving change");
    } finally {
      setApproveConfirm({ isOpen: false, changeId: "" });
    }
  };

  const handleReject = async () => {
    try {
      const result = await TimeCorrectionsService.rejectChange(
        rejectConfirm.changeId,
        currentAdmin.id,
        currentAdmin.nombre
      );

      if (result.success) {
        await loadPendingChanges();
        onChangesProcessed();
      } else {
        setError(result.error || "Error rejecting change");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error rejecting change");
    } finally {
      setRejectConfirm({ isOpen: false, changeId: "" });
    }
  };

  const handleEditChange = async (change: TimeCorrection) => {
    setEditingRecord({
      record: {
        id: change.registroTiempoId,
        usuarioId: change.usuarioId,
        fecha: new Date(change.valorNuevo),
        tipoRegistro:
          change.campoModificado === "tipo_registro"
            ? (change.valorNuevo as "entrada" | "salida")
            : "entrada",
        esSimulado: false,
      },
      user: {
        id: change.usuarioId,
        nombre: change.adminUserName,
      },
    });
    setSelectedChange(change);
    setShowEditModal(true);
  };

  const handleEditSuccess = async () => {
    await TimeCorrectionsService.rejectChange(
      selectedChange!.id,
      currentAdmin.id,
      currentAdmin.nombre
    );
    await loadPendingChanges();
    onChangesProcessed();
    setShowEditModal(false);
    setEditingRecord(null);
    setSelectedChange(null);
  };

  const getFieldDisplayName = (field: string): string => {
    const names: Record<string, string> = {
      fecha: "Fecha y hora",
      tipo_registro: "Tipo de registro",
    };
    return names[field] || field;
  };

  const formatValue = (value: string, field: string): string => {
    if (field === "fecha") {
      try {
        return DateFormatUtils.formatDateTime(new Date(value));
      } catch {
        return value;
      }
    }
    if (field === "tipo_registro") {
      return value === "entrada" ? "Entrada" : "Salida";
    }
    return value;
  };

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <FiAlertCircle className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Cambios Pendientes de Aprobación
            </h2>
            <p className="text-white/70 text-sm">
              {pendingChanges.length} solicitud
              {pendingChanges.length !== 1 ? "es" : ""} pendiente
              {pendingChanges.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {pendingChanges.length === 0 ? (
          <div className="text-center py-12 text-white/70">
            <FiCheck className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p>No hay cambios pendientes de aprobación</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-6 max-h-[600px] overflow-y-auto">
            {pendingChanges.map((change) => (
              <div
                key={change.id}
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FiClock className="w-4 h-4 text-yellow-400" />
                      <span className="font-semibold text-white">
                        {change.adminUserName}
                      </span>
                      <span className="text-white/50 text-sm">
                        {DateFormatUtils.formatDateTime(change.fechaCorreccion)}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-white/70">Campo:</span>
                        <span className="text-white font-medium">
                          {getFieldDisplayName(change.campoModificado)}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-white/70">Valor anterior:</span>
                        <span className="text-white/90 line-through">
                          {formatValue(
                            change.valorAnterior,
                            change.campoModificado
                          )}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-white/70">Valor nuevo:</span>
                        <span className="text-green-400 font-medium">
                          {formatValue(
                            change.valorNuevo,
                            change.campoModificado
                          )}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-white/70">Razón:</span>
                        <span className="text-white/90 italic">
                          "{change.razon}"
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2">
                    <PrimaryButton
                      onClick={() =>
                        setApproveConfirm({ isOpen: true, changeId: change.id })
                      }
                      size="sm"
                      className="flex-1 md:flex-none"
                    >
                      <FiCheck className="w-4 h-4" />
                      Aprobar
                    </PrimaryButton>

                    <SecondaryButton
                      onClick={() => handleEditChange(change)}
                      size="sm"
                      className="flex-1 md:flex-none"
                      borderColor="white"
                    >
                      <FiEdit3 className="w-4 h-4" />
                      Editar
                    </SecondaryButton>

                    <button
                      onClick={() =>
                        setRejectConfirm({ isOpen: true, changeId: change.id })
                      }
                      className="flex-1 md:flex-none px-4 py-2 bg-red-500/20 border border-red-500 hover:bg-red-500/30 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <FiX className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={approveConfirm.isOpen}
        onConfirm={handleApprove}
        onCancel={() => setApproveConfirm({ isOpen: false, changeId: "" })}
        title="Aprobar Cambio"
        message="¿Estás seguro de que quieres aprobar este cambio? El registro será actualizado inmediatamente."
        confirmText="Aprobar"
        cancelText="Cancelar"
      />

      <ConfirmModal
        isOpen={rejectConfirm.isOpen}
        onConfirm={handleReject}
        onCancel={() => setRejectConfirm({ isOpen: false, changeId: "" })}
        title="Rechazar Cambio"
        message="¿Estás seguro de que quieres rechazar este cambio? La solicitud será marcada como rechazada."
        confirmText="Rechazar"
        cancelText="Cancelar"
      />

      {showEditModal && editingRecord && (
        <TimeRecordCorrectionModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingRecord(null);
            setSelectedChange(null);
          }}
          record={editingRecord.record}
          user={editingRecord.user}
          currentUser={currentAdmin}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
