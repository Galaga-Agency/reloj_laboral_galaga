import { useState, useMemo } from "react";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import type { RegistroTiempo, Usuario } from "@/types";
import { TimeRecordsUtils } from "@/utils/time-records";
import { PDFReportGenerator, type ReportData } from "@/utils/pdf-reports";

export type ReportPeriod = "today" | "week" | "month" | "custom";

interface UseReportsProps {
  registros: RegistroTiempo[];
  usuario: Usuario;
}

export function useReports({ registros, usuario }: UseReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("today");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const dateRange = useMemo(() => {
    const today = new Date();

    switch (selectedPeriod) {
      case "today":
        return {
          start: startOfDay(today),
          end: endOfDay(today),
          label: "Hoy",
        };

      case "week":
        return {
          start: startOfWeek(today, { weekStartsOn: 1 }),
          end: endOfWeek(today, { weekStartsOn: 1 }),
          label: "Esta Semana",
        };

      case "month":
        return {
          start: startOfMonth(today),
          end: endOfMonth(today),
          label: "Este Mes",
        };

      case "custom":
        if (customDateRange.start && customDateRange.end) {
          return {
            start: startOfDay(new Date(customDateRange.start)),
            end: endOfDay(new Date(customDateRange.end)),
            label: "Rango Personalizado",
          };
        }
        return null;

      default:
        return null;
    }
  }, [selectedPeriod, customDateRange]);

  const filteredRecords = useMemo(() => {
    if (!dateRange) return [];

    return registros.filter((registro) => {
      const recordDate = new Date(registro.fecha);
      return recordDate >= dateRange.start && recordDate <= dateRange.end;
    });
  }, [registros, dateRange]);

  const statistics = useMemo(() => {
    return TimeRecordsUtils.calculateStatistics(filteredRecords);
  }, [filteredRecords]);

  const generatePDFReport = async () => {
    if (!dateRange || filteredRecords.length === 0) {
      throw new Error("No hay datos para generar el informe");
    }

    setIsGenerating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const reportData: ReportData = {
        usuario,
        registros: filteredRecords,
        periodo: dateRange.label,
        fechaInicio: dateRange.start,
        fechaFin: dateRange.end,
        estadisticas: statistics,
      };

      await PDFReportGenerator.generateReport(reportData);

      return { success: true, message: "Informe generado correctamente" };
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new Error("Error al generar el informe PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const isCustomRangeValid = useMemo(() => {
    if (selectedPeriod !== "custom") return true;

    return !!(
      customDateRange.start &&
      customDateRange.end &&
      new Date(customDateRange.start) <= new Date(customDateRange.end)
    );
  }, [selectedPeriod, customDateRange]);

  const canGenerateReport = useMemo(() => {
    return !!(
      dateRange &&
      filteredRecords.length > 0 &&
      isCustomRangeValid &&
      !isGenerating
    );
  }, [dateRange, filteredRecords.length, isCustomRangeValid, isGenerating]);

  return {
    selectedPeriod,
    customDateRange,
    isGenerating,

    dateRange,
    filteredRecords,
    statistics,

    setSelectedPeriod,
    setCustomDateRange,
    generatePDFReport,

    isCustomRangeValid,
    canGenerateReport,

    recordCount: filteredRecords.length,
    hasData: filteredRecords.length > 0,
  };
}
