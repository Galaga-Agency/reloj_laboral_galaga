import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AbsenceService } from "@/services/absence-service";
import { useAuth } from "./AuthContext";
import type { Absence } from "@/types";

interface AbsenceContextType {
  absences: Absence[];
  isLoading: boolean;
  error: string | null;
  refreshAbsences: (startDate?: Date, endDate?: Date) => Promise<void>;
  createAbsence: (data: any) => Promise<Absence>;
  updateAbsence: (id: string, updates: any) => Promise<void>;
  deleteAbsence: (id: string) => Promise<void>;
  updateAbsenceStatus: (id: string, status: string) => Promise<void>;
}

const AbsenceContext = createContext<AbsenceContextType | undefined>(undefined);

export function useAbsences() {
  const context = useContext(AbsenceContext);
  if (!context) {
    throw new Error("useAbsences must be used within AbsenceProvider");
  }
  return context;
}

interface AbsenceProviderProps {
  children: ReactNode;
  startDate?: Date;
  endDate?: Date;
  includeScheduledDaysOff?: boolean;
}

export function AbsenceProvider({
  children,
  startDate,
  endDate,
  includeScheduledDaysOff = false,
}: AbsenceProviderProps) {
  const { usuario } = useAuth();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAbsences = async (start?: Date, end?: Date) => {
    if (!usuario) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = usuario.isAdmin
        ? await AbsenceService.getAllAbsences(
            start || startDate,
            end || endDate,
            includeScheduledDaysOff
          )
        : await AbsenceService.getAbsencesByUser(
            usuario.id,
            start || startDate,
            end || endDate,
            includeScheduledDaysOff
          );

      setAbsences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading absences");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAbsences();
  }, [usuario, startDate, endDate, includeScheduledDaysOff]);

  const createAbsence = async (data: any) => {
    const newAbsence = await AbsenceService.createAbsence(data);
    await refreshAbsences();
    return newAbsence;
  };

  const updateAbsence = async (id: string, updates: any) => {
    await AbsenceService.updateAbsence(id, updates, {
      id: usuario!.id,
      isAdmin: usuario!.isAdmin,
    });
    await refreshAbsences();
  };

  const deleteAbsence = async (id: string) => {
    await AbsenceService.deleteAbsence(id);
    await refreshAbsences();
  };

  const updateAbsenceStatus = async (id: string, status: string) => {
    await AbsenceService.updateAbsenceStatus(id, status as any, usuario!.id);
    await refreshAbsences();
  };

  return (
    <AbsenceContext.Provider
      value={{
        absences,
        isLoading,
        error,
        refreshAbsences,
        createAbsence,
        updateAbsence,
        deleteAbsence,
        updateAbsenceStatus,
      }}
    >
      {children}
    </AbsenceContext.Provider>
  );
}
