import { useState, useEffect } from "react";
import { FiClock, FiEyeOff, FiEdit3, FiAlertCircle } from "react-icons/fi";
import type { Usuario, RegistroTiempo } from "@/types";
import { TimeRecordsUtils } from "@/utils/time-records";
import { DateFormatUtils } from "@/utils/date-format";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { TimeRecordCorrectionModal } from "@/components/modals/TimeRecordCorrectionModal";
import {
  TimeCorrectionsService,
  type TimeCorrection,
} from "@/services/time-corrections-service";
import type { TimeRange } from "@/services/admin-service";

interface UserRecordsListProps {
  selectedUser: Usuario | null;
  userRecords: RegistroTiempo[];
  timeRange: TimeRange;
  isRecordsLoading: boolean;
  currentAdmin: Usuario;
  onTimeRangeChange: (newRange: string) => void;
  onRecordUpdated: () => void;
}

export function UserRecordsList({
  selectedUser,
  userRecords,
  timeRange,
  isRecordsLoading,
  currentAdmin,
  onTimeRangeChange,
  onRecordUpdated,
}: UserRecordsListProps) {
  const [selectedRecord, setSelectedRecord] = useState<RegistroTiempo | null>(
    null
  );
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  const [corrections, setCorrections] = useState<Map<string, TimeCorrection[]>>(
    new Map()
  );
  const [loadingCorrections, setLoadingCorrections] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCorrections(true);
        const ids = userRecords.map((r) => r.id);
        const map = await TimeCorrectionsService.getCorrectionsForRecords(ids);
        setCorrections(map);
      } catch (e) {
        console.error("Failed to load corrections", e);
        setCorrections(new Map());
      } finally {
        setLoadingCorrections(false);
      }
    };
    if (userRecords.length > 0) load();
    else setCorrections(new Map());
  }, [userRecords]);

  const timeRangeOptions = [
    { value: "yesterday", label: "Ayer" },
    { value: "past2days", label: "Últimos 2 días" },
    { value: "thisweek", label: "Esta semana" },
    { value: "past7days", label: "Últimos 7 días" },
    { value: "thismonth", label: "Este mes" },
    { value: "pastmonth", label: "Mes pasado" },
    { value: "all", label: "Todo el historial" },
  ];

  const handleEditRecord = (record: RegistroTiempo) => {
    setSelectedRecord(record);
    setShowCorrectionModal(true);
  };

  const handleCorrectionSuccess = () => {
    onRecordUpdated();
    setShowCorrectionModal(false);
    setSelectedRecord(null);
  };

  const getOriginalTime = (record: RegistroTiempo): string | null => {
    const recordCorrections = corrections.get(record.id);
    if (!recordCorrections || recordCorrections.length === 0) return null;

    const correction = recordCorrections.find(
      (c) => c.campoModificado === "fecha"
    );
    if (!correction) return null;

    try {
      const originalDate =
        correction.valorAnterior && correction.valorAnterior !== "null"
          ? new Date(correction.valorAnterior)
          : null;
      return originalDate ? DateFormatUtils.formatTime(originalDate) : null;
    } catch {
      return null;
    }
  };

  const getModificationInfo = (record: RegistroTiempo) => {
    const list = corrections.get(record.id) || [];
    const latest = list[0];
    return {
      isModified: list.length > 0,
      modifiedBy: latest?.adminUserName ?? "Admin",
    };
  };

  return (
    <>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between pb-4">
          <div className="flex items-center gap-2">
            <FiClock className="w-5 h-5 text-white flex-shrink-0" />
            <h2 className="text-xl font-semibold text-white">
              {selectedUser
                ? `Registros de ${selectedUser.nombre}`
                : "Selecciona un usuario"}
            </h2>
          </div>

          {selectedUser && (
            <div className="w-48">
              <CustomDropdown
                options={timeRangeOptions}
                value={timeRange as unknown as string}
                onChange={onTimeRangeChange}
                variant="darkBg"
                className="text-sm"
              />
            </div>
          )}
        </div>

        {selectedUser ? (
          <>
            {selectedUser.isActive === false && (
              <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-300 text-sm">
                <FiEyeOff className="inline w-4 h-4 mr-2" />
                Este usuario está desactivado y no puede acceder al sistema
              </div>
            )}

            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
              {isRecordsLoading || loadingCorrections ? (
                <div className="text-center flex flex-col items-center text-white/70 py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white mx-auto pb-3 rounded-full"></div>
                  Cargando registros...
                </div>
              ) : userRecords.length === 0 ? (
                <div className="text-center text-white/70 py-8">
                  Este usuario no tiene registros en el período seleccionado
                </div>
              ) : (
                userRecords.map((record) => {
                  const { isModified, modifiedBy } =
                    getModificationInfo(record);
                  const displayTime = DateFormatUtils.formatTime(record.fecha);

                  return (
                    <div
                      key={record.id}
                      className="relative group p-4 rounded-lg border transition-all hover:bg-white/10 bg-white/5 border-white/10"
                    >
                      <div className="md:hidden">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 flex-shrink-0">
                              {TimeRecordsUtils.getTypeIcon(
                                record.tipoRegistro
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-white">
                                {TimeRecordsUtils.getTypeText(
                                  record.tipoRegistro
                                )}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditRecord(record)}
                            className="p-2 text-white/50 hover:text-white hover:bg-blue-500/20 rounded transition-colors flex-shrink-0"
                            title="Editar registro"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-white/70">
                            {DateFormatUtils.formatDate(record.fecha)}
                          </div>
                          <div className="font-mono font-bold text-white text-lg">
                            {displayTime}
                          </div>
                        </div>

                        {isModified && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex items-center gap-1 text-xs text-yellow-300/70">
                              <FiAlertCircle className="w-3 h-3 flex-shrink-0 text-yellow-400" />
                              <span>Modificado por {modifiedBy}</span>
                            </div>
                            {getOriginalTime(record) && (
                              <div className="text-xs text-yellow-300/70 mt-1">
                                Original: {getOriginalTime(record)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="hidden md:flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 flex-shrink-0">
                            {TimeRecordsUtils.getTypeIcon(record.tipoRegistro)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-white">
                              {TimeRecordsUtils.getTypeText(
                                record.tipoRegistro
                              )}
                            </span>
                            <div className="text-sm text-white/70">
                              {DateFormatUtils.formatDate(record.fecha)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-mono font-bold text-white text-lg">
                              {displayTime}
                            </div>
                            {isModified && (
                              <div className="mt-1 space-y-1">
                                <div className="flex items-center justify-end gap-1 text-xs text-yellow-300/70">
                                  <FiAlertCircle className="w-3 h-3 flex-shrink-0 text-yellow-400" />
                                  <span>Modificado por {modifiedBy}</span>
                                </div>
                                {getOriginalTime(record) && (
                                  <div className="text-xs text-yellow-300/70">
                                    Original: {getOriginalTime(record)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleEditRecord(record)}
                            className="p-2 text-white/50 hover:text-white hover:bg-blue-500/20 rounded transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                            title="Editar registro"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-white/70 py-8">
            Selecciona un usuario para ver sus registros
          </div>
        )}
      </div>

      <TimeRecordCorrectionModal
        isOpen={showCorrectionModal}
        onClose={() => {
          setShowCorrectionModal(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
        user={selectedUser}
        currentUser={currentAdmin}
        onSuccess={handleCorrectionSuccess}
      />
    </>
  );
}
