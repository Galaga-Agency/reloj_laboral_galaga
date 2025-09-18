import { useState, useEffect, useCallback } from "react";
import { TimeRecordsService } from "@/services/time-records-service";
import { ClockStateManager } from "@/utils/clock-state";
import type { RegistroTiempo, EstadoTrabajo } from "@/types";

interface UseTimeRecordsReturn {
  registros: RegistroTiempo[];
  estadoActual: EstadoTrabajo;
  tiempoTrabajado: string;
  availableActions: Array<{
    action: "entrada" | "salida";
    label: string;
    type: "primary" | "danger";
  }>;
  performAction: (action: "entrada" | "salida") => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTimeRecords(usuarioId: string): UseTimeRecordsReturn {
  const [registros, setRegistros] = useState<RegistroTiempo[]>([]);
  const [estadoActual, setEstadoActual] = useState<EstadoTrabajo>("parado");
  const [tiempoTrabajado, setTiempoTrabajado] = useState("00:00");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStateFromRecords = useCallback((records: RegistroTiempo[]) => {
    const currentState = ClockStateManager.getCurrentState(records);
    setEstadoActual(currentState);

    const workedTime = ClockStateManager.calculateWorkedTime(records);
    setTiempoTrabajado(workedTime);
  }, []);

  const fetchRegistros = useCallback(async () => {
    if (!usuarioId) return;

    setIsLoading(true);
    setError(null);

    try {
      const records = await TimeRecordsService.getRecordsByUser(usuarioId);
      setRegistros(records);
      updateStateFromRecords(records);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [usuarioId, updateStateFromRecords]);

  const performAction = useCallback(
    async (action: "entrada" | "salida") => {
      const validation = ClockStateManager.canPerformAction(
        action,
        estadoActual
      );
      if (!validation.canPerform) {
        throw new Error(validation.reason || "Acción no permitida");
      }

      setError(null);

      try {
        const now = new Date();

        // Create optimistic record
        const optimisticRecord: RegistroTiempo = {
          id: "temp-" + Date.now(),
          usuarioId,
          fecha: now,
          tipoRegistro: action,
          esSimulado: false,
        };

        // IMMEDIATE UI UPDATE - Don't wait for server
        const optimisticRecords = [optimisticRecord, ...registros];
        setRegistros(optimisticRecords);
        updateStateFromRecords(optimisticRecords);

        // Now do the server request in background
        const serverRecord = await TimeRecordsService.createRecord({
          fecha: now,
          tipoRegistro: action,
          esSimulado: false,
          usuarioId,
        });

        // Replace the optimistic record with the real one
        setRegistros((prev) => [
          serverRecord,
          ...prev.filter((r) => r.id !== optimisticRecord.id),
        ]);
      } catch (err) {
        // Rollback optimistic update on error
        setRegistros(registros);
        updateStateFromRecords(registros);

        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        throw err;
      }
    },
    [usuarioId, estadoActual, registros, updateStateFromRecords]
  );

  // Update worked time every minute when working
  useEffect(() => {
    if (estadoActual === "trabajando") {
      const interval = setInterval(() => {
        const workedTime = ClockStateManager.calculateWorkedTime(registros);
        setTiempoTrabajado(workedTime);
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [registros, estadoActual]);

  useEffect(() => {
    fetchRegistros();
  }, [fetchRegistros]);

  const availableActions = ClockStateManager.getAvailableActions(estadoActual);

  return {
    registros,
    estadoActual,
    tiempoTrabajado,
    availableActions,
    performAction,
    isLoading: false,
    error,
    refetch: fetchRegistros,
  };
}
