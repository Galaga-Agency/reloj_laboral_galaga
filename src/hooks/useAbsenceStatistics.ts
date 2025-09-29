import { useState, useEffect, useRef } from "react";
import { AbsenceService } from "@/services/absence-service";
import {
  AbsenceStatisticsCalculator,
  type AbsenceStats,
} from "@/utils/absence-statistics";

export function useAbsenceStatistics(startDate: Date, endDate: Date) {
  const [stats, setStats] = useState<AbsenceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDateRef = useRef(startDate.getTime());
  const endDateRef = useRef(endDate.getTime());

  useEffect(() => {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    if (startDateRef.current === startTime && endDateRef.current === endTime) {
      return;
    }

    startDateRef.current = startTime;
    endDateRef.current = endTime;

    loadStatistics();
  }, [startDate, endDate]);

  const loadStatistics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const absences = await AbsenceService.getAllAbsences(startDate, endDate);
      const calculatedStats = AbsenceStatisticsCalculator.calculate(absences);
      setStats(calculatedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading statistics");
    } finally {
      setIsLoading(false);
    }
  };

  return { stats, isLoading, error, reload: loadStatistics };
}
