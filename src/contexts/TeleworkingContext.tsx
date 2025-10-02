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

interface TeleworkingContextType {
  schedules: TeleworkingSchedule[];
  isLoading: boolean;
  error: string | null;
  refreshSchedules: (year: number, month: number) => Promise<void>;
  createOrUpdateSchedule: (
    usuarioId: string,
    fecha: Date,
    location: TeleworkingLocation,
    notes?: string
  ) => Promise<void>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  bulkCreateSchedules: (schedules: any[]) => Promise<void>;
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
  initialMonth?: number;
}

export function TeleworkingProvider({
  children,
  initialYear = new Date().getFullYear(),
  initialMonth = new Date().getMonth() + 1,
}: TeleworkingProviderProps) {
  const { usuario } = useAuth();
  const [schedules, setSchedules] = useState<TeleworkingSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSchedules = async (year: number, month: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await TeleworkingService.getSchedulesForMonth(year, month);
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading schedules");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSchedules(initialYear, initialMonth);
  }, [initialYear, initialMonth]);

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
    await refreshSchedules(fecha.getFullYear(), fecha.getMonth() + 1);
  };

  const deleteSchedule = async (scheduleId: string) => {
    await TeleworkingService.deleteSchedule(scheduleId);
    const currentDate = new Date();
    await refreshSchedules(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    );
  };

  const bulkCreateSchedules = async (schedules: any[]) => {
    await TeleworkingService.bulkCreateSchedules(schedules, usuario!);
    if (schedules.length > 0) {
      const firstDate = schedules[0].fecha;
      await refreshSchedules(firstDate.getFullYear(), firstDate.getMonth() + 1);
    }
  };

  return (
    <TeleworkingContext.Provider
      value={{
        schedules,
        isLoading,
        error,
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
