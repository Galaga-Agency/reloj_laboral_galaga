import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import type { RegistroTiempo, Usuario } from "@/types";
import { TimeRecordsService } from "./time-records-service";
import { TimeRecordsUtils } from "@/utils/time-records";
import { PDFReportGenerator, type ReportData } from "@/utils/pdf-reports";

export interface MonthlyReport {
  id: string;
  usuarioId: string;
  year: number;
  month: number;
  reportData: ReportData;
  pdfUrl?: string;
  generatedAt: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  contestedAt?: Date;
  contestReason?: string;
  isAccepted: boolean;
  isContested: boolean;
}

export interface MonthlyReportStatus {
  hasCurrentMonthReport: boolean;
  report?: MonthlyReport;
  needsReview: boolean;
}

export class MonthlyReportsService {
  static async generateMonthlyReport(
    usuario: Usuario,
    year: number,
    month: number
  ): Promise<MonthlyReport> {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    const registros = await TimeRecordsService.getRecordsByDateRange(
      usuario.id,
      startDate,
      endDate
    );

    const statistics = TimeRecordsUtils.calculateStatistics(registros);

    const reportData: ReportData = {
      usuario,
      registros,
      periodo: format(startDate, "MMMM yyyy", { locale: es }),
      fechaInicio: startDate,
      fechaFin: endDate,
      estadisticas: statistics,
    };

    const { data, error } = await supabase
      .from("monthly_reports")
      .insert({
        usuario_id: usuario.id,
        year,
        month,
        report_data: reportData,
        generated_at: new Date().toISOString(),
        is_accepted: false,
        is_contested: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating monthly report: ${error.message}`);
    }

    return this.mapToMonthlyReport(data);
  }

  static async getCurrentMonthReportStatus(
    usuarioId: string
  ): Promise<MonthlyReportStatus> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // For the first few days of the month, check for previous month report
    const targetYear =
      now.getDate() <= 5 && currentMonth === 1 ? currentYear - 1 : currentYear;
    const targetMonth =
      now.getDate() <= 5 && currentMonth === 1
        ? 12
        : now.getDate() <= 5
        ? currentMonth - 1
        : currentMonth;

    const { data, error } = await supabase
      .from("monthly_reports")
      .select("*")
      .eq("usuario_id", usuarioId)
      .eq("year", targetYear)
      .eq("month", targetMonth)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Error fetching monthly report status: ${error.message}`);
    }

    const hasReport = !!data;
    const report = data ? this.mapToMonthlyReport(data) : undefined;
    const needsReview =
      hasReport && !report!.isAccepted && !report!.isContested;

    return {
      hasCurrentMonthReport: hasReport,
      report,
      needsReview,
    };
  }

  static async markReportAsViewed(reportId: string): Promise<void> {
    const { error } = await supabase
      .from("monthly_reports")
      .update({
        viewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (error) {
      throw new Error(`Error marking report as viewed: ${error.message}`);
    }
  }

  static async acceptReport(reportId: string): Promise<void> {
    const { error } = await supabase
      .from("monthly_reports")
      .update({
        accepted_at: new Date().toISOString(),
        is_accepted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (error) {
      throw new Error(`Error accepting report: ${error.message}`);
    }
  }

  static async contestReport(reportId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from("monthly_reports")
      .update({
        contested_at: new Date().toISOString(),
        contest_reason: reason,
        is_contested: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (error) {
      throw new Error(`Error contesting report: ${error.message}`);
    }
  }

  static async generateAndDownloadReport(report: MonthlyReport): Promise<void> {
    await PDFReportGenerator.generateReport(report.reportData);
  }

  static async generateMissingReportsForUser(usuario: Usuario): Promise<void> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Generate report for previous month if we're in the first 5 days
    if (now.getDate() <= 5) {
      const targetYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;

      const { data: existingReport } = await supabase
        .from("monthly_reports")
        .select("id")
        .eq("usuario_id", usuario.id)
        .eq("year", targetYear)
        .eq("month", targetMonth)
        .single();

      if (!existingReport) {
        await this.generateMonthlyReport(usuario, targetYear, targetMonth);
      }
    }
  }

  static createContestEmailData(
    report: MonthlyReport,
    userMessage: string
  ): { subject: string; body: string } {
    const monthName = format(
      new Date(report.year, report.month - 1),
      "MMMM yyyy",
      { locale: es }
    );

    const subject = `Contestación de Informe Mensual - ${monthName}`;

    const body = `Estimado equipo de soporte,

El empleado ${report.reportData.usuario.nombre} (${report.reportData.usuario.email}) desea contestar su informe mensual correspondiente a ${monthName}.

Detalles del informe:
- Período: ${monthName}
- Total de registros: ${report.reportData.registros.length}
- Tiempo total trabajado: ${report.reportData.estadisticas.tiempoTotal}
- Días trabajados: ${report.reportData.estadisticas.diasTrabajados}

Motivo de la contestación:
${userMessage}

Por favor, revisen este caso y contacten al empleado para resolver cualquier discrepancia.

Saludos cordiales,
Sistema de Fichajes`;

    return { subject, body };
  }

  private static mapToMonthlyReport(data: any): MonthlyReport {
    return {
      id: data.id,
      usuarioId: data.usuario_id,
      year: data.year,
      month: data.month,
      reportData: data.report_data,
      pdfUrl: data.pdf_url,
      generatedAt: new Date(data.generated_at),
      viewedAt: data.viewed_at ? new Date(data.viewed_at) : undefined,
      acceptedAt: data.accepted_at ? new Date(data.accepted_at) : undefined,
      contestedAt: data.contested_at ? new Date(data.contested_at) : undefined,
      contestReason: data.contest_reason,
      isAccepted: data.is_accepted,
      isContested: data.is_contested,
    };
  }
}
