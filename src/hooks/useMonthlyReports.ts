import { useState, useEffect } from "react";
import type { Usuario } from "@/types";
import {
  MonthlyReportsService,
  type MonthlyReportStatus,
} from "@/services/monthly-reports-service";

interface UseMonthlyReportsReturn {
  reportStatus: MonthlyReportStatus | null;
  isLoading: boolean;
  error: string | null;
  showModal: boolean;
  handleAcceptReport: () => void;
  handleCloseModal: () => void;
  refetch: () => Promise<void>;
}

export function useMonthlyReports(
  usuario: Usuario | null
): UseMonthlyReportsReturn {
  const [reportStatus, setReportStatus] = useState<MonthlyReportStatus | null>(
    null

    
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchReportStatus = async () => {
    if (!usuario?.id || usuario.role === "official") {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await MonthlyReportsService.generateMissingReportsForUser(usuario);

      const status = await MonthlyReportsService.getCurrentMonthReportStatus(
        usuario.id
      );

      setReportStatus(status);
      setShowModal(status.needsReview);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      console.error("Error fetching monthly report status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptReport = () => {
    setShowModal(false);
    if (reportStatus) {
      setReportStatus({
        ...reportStatus,
        needsReview: false,
        report: reportStatus.report
          ? {
              ...reportStatus.report,
              isAccepted: true,
              acceptedAt: new Date(),
            }
          : undefined,
      });
    }
  };

  const handleCloseModal = () => {
    console.warn("Monthly report must be reviewed before closing");
  };

  useEffect(() => {
    if (usuario?.id && usuario.role !== "official") {
      fetchReportStatus();
    } else {
      setIsLoading(false);
    }
  }, [usuario?.id, usuario?.role]);

  return {
    reportStatus,
    isLoading,
    error,
    showModal,
    handleAcceptReport,
    handleCloseModal,
    refetch: fetchReportStatus,
  };
}
