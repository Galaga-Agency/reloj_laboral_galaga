import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { TeleworkingService } from "@/services/teleworking-service";
import { useAuth } from "./AuthContext";
import type {
  TeleworkingSchedule,
  TeleworkingLocation,
} from "@/types/teleworking";
import { startOfMonth, endOfMonth } from "date-fns";

interface TeleworkingContextType {
  schedules: TeleworkingSchedule[];
  isLoading: boolean;
  error: string | null;
  refreshSchedules: (start: Date, end: Date) => Promise<void>;
  createOrUpdateSchedule: (
    usuarioId: string,
    fecha: Date,
    location: TeleworkingLocation,
    notes?: string
  ) => Promise<void>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  bulkCreateSchedules: (schedules: any[]) => Promise<void>;
  approveSchedule: (scheduleId: string) => Promise<void>;
  rejectSchedule: (scheduleId: string) => Promise<void>;
}

const TeleworkingContext = createContext<TeleworkingContextType | undefined>(
  undefined
);

export function useTeleworking() {
  const context = useContext(TeleworkingContext);
  if (!context) {
    throw new Error("useTeleworking must be used within TeleworkingProvider");
  }
  return context;
}

interface TeleworkingProviderProps {
  children: ReactNode;
  initialYear?: number;
}

export function TeleworkingProvider({
  children,
  initialYear = new Date().getFullYear(),
}: TeleworkingProviderProps) {
  const { usuario } = useAuth();
  const [schedules, setSchedules] = useState<TeleworkingSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSchedules = useCallback(async (start: Date, end: Date) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await TeleworkingService.getSchedulesInRange(start, end);
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading schedules");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const start = new Date(initialYear, 0, 1);
    const end = new Date(initialYear, 11, 31);
    refreshSchedules(start, end);
  }, [initialYear, refreshSchedules]);

  const createOrUpdateSchedule = useCallback(
    async (
      usuarioId: string,
      fecha: Date,
      location: TeleworkingLocation,
      notes?: string
    ) => {
      await TeleworkingService.createOrUpdateSchedule(
        usuarioId,
        fecha,
        location,
        usuario!,
        notes
      );
      const now = new Date();
      await refreshSchedules(
        new Date(now.getFullYear(), 0, 1),
        new Date(now.getFullYear(), 11, 31)
      );
    },
    [usuario, refreshSchedules]
  );

  const deleteSchedule = useCallback(
    async (scheduleId: string) => {
      await TeleworkingService.deleteSchedule(scheduleId);
      const now = new Date();
      await refreshSchedules(
        new Date(now.getFullYear(), 0, 1),
        new Date(now.getFullYear(), 11, 31)
      );
    },
    [refreshSchedules]
  );

  const approveSchedule = useCallback(
    async (scheduleId: string) => {
      await TeleworkingService.approveSchedule(scheduleId, usuario!);
      const now = new Date();
      await refreshSchedules(
        new Date(now.getFullYear(), 0, 1),
        new Date(now.getFullYear(), 11, 31)
      );
    },
    [usuario, refreshSchedules]
  );

  const rejectSchedule = useCallback(
    async (scheduleId: string) => {
      await TeleworkingService.rejectSchedule(scheduleId);
      const now = new Date();
      await refreshSchedules(
        new Date(now.getFullYear(), 0, 1),
        new Date(now.getFullYear(), 11, 31)
      );
    },
    [refreshSchedules]
  );

  const bulkCreateSchedules = useCallback(
    async (schedules: any[]) => {
      await TeleworkingService.bulkCreateSchedules(schedules, usuario!);
      const now = new Date();
      await refreshSchedules(
        new Date(now.getFullYear(), 0, 1),
        new Date(now.getFullYear(), 11, 31)
      );
    },
    [usuario, refreshSchedules]
  );

  return (
    <TeleworkingContext.Provider
      value={{
        schedules,
        isLoading,
        error,
        approveSchedule,
        rejectSchedule,
        refreshSchedules,
        createOrUpdateSchedule,
        deleteSchedule,
        bulkCreateSchedules,
      }}
    >
      {children}
    </TeleworkingContext.Provider>
  );
}
