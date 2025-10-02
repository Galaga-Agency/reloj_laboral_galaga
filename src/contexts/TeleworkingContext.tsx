import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
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

  const refreshSchedules = async (start: Date, end: Date) => {
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
  };

  useEffect(() => {
    const start = new Date(initialYear, 0, 1);
    const end = new Date(initialYear, 11, 31);
    refreshSchedules(start, end);
  }, [initialYear]);

  const createOrUpdateSchedule = async (
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
    await refreshSchedules(startOfMonth(fecha), endOfMonth(fecha));
  };

  const deleteSchedule = async (scheduleId: string) => {
    await TeleworkingService.deleteSchedule(scheduleId);
    const currentDate = new Date();
    await refreshSchedules(startOfMonth(currentDate), endOfMonth(currentDate));
  };

  const approveSchedule = async (scheduleId: string) => {
    await TeleworkingService.approveSchedule(scheduleId, usuario!);
    const currentDate = new Date();
    await refreshSchedules(startOfMonth(currentDate), endOfMonth(currentDate));
  };

  const rejectSchedule = async (scheduleId: string) => {
    await TeleworkingService.rejectSchedule(scheduleId);
    const currentDate = new Date();
    await refreshSchedules(startOfMonth(currentDate), endOfMonth(currentDate));
  };

  const bulkCreateSchedules = async (schedules: any[]) => {
    await TeleworkingService.bulkCreateSchedules(schedules, usuario!);
    if (schedules.length > 0) {
      const firstDate = schedules[0].fecha;
      await refreshSchedules(startOfMonth(firstDate), endOfMonth(firstDate));
    }
  };

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
