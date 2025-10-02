import jsPDF from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Absence, Usuario } from "@/types";
import {
  AbsenceStatisticsCalculator,
  type AbsenceStats,
} from "@/utils/absence-statistics";

export class AbsencePDFGenerator {
  private static readonly MARGIN = 15;
  private static readonly PAGE_WIDTH = 210;
  private static readonly PAGE_HEIGHT = 297;

  static async generateUserReport(
    usuario: Usuario,
    absences: Absence[],
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    if (absences.length === 0) {
      throw new Error(
        "No hay ausencias registradas para este empleado en el período seleccionado"
      );
    }

    const realAbsences = absences.filter((a) => a.tipoAusencia !== "dia_libre");
    const scheduledDaysOff = absences.filter(
      (a) => a.tipoAusencia === "dia_libre"
    );

    const doc = new jsPDF();
    let y = this.MARGIN;

    y = this.addReportHeader(doc, usuario, startDate, endDate, y);
    y = this.addReportSummary(doc, absences, realAbsences, scheduledDaysOff, y);

    if (scheduledDaysOff.length > 0) {
      y = this.addScheduledDaysOffSection(doc, scheduledDaysOff, y);
    }

    if (absences.length > 0) {
      y = this.addAbsencesTable(doc, absences, y);
    }

    this.addFooters(doc);
    doc.save(this.generateUserReportFilename(usuario, startDate, endDate));
  }

  static async generateCompanyReport(
    absences: Absence[],
    users: Usuario[],
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    if (absences.length === 0) {
      throw new Error(
        "No hay ausencias registradas para el período seleccionado"
      );
    }

    const realAbsences = absences.filter((a) => a.tipoAusencia !== "dia_libre");
    const scheduledDaysOff = absences.filter(
      (a) => a.tipoAusencia === "dia_libre"
    );

    const userHoursMap: Record<string, number> = {};
    users.forEach((user) => {
      userHoursMap[user.id] = user.horas_diarias || 8;
    });

    const stats = AbsenceStatisticsCalculator.calculate(
      realAbsences,
      userHoursMap
    );
    (stats as any).rawAbsences = [...realAbsences, ...scheduledDaysOff];

    const doc = new jsPDF();
    let y = this.MARGIN;

    y = this.addCompanyReportHeader(doc, startDate, endDate, y);
    y = this.addCompanyReportSummary(doc, stats, scheduledDaysOff.length, y);
    y = this.addCompanyReasonStatistics(doc, stats, y);
    y = this.addCompanyTypeStatistics(doc, stats, y);
    y = this.addCompanyAbsencesByUser(doc, absences, users, y);

    this.addFooters(doc);
    doc.save(this.generateCompanyReportFilename(startDate, endDate));
  }

  private static addReportHeader(
    doc: jsPDF,
    usuario: Usuario,
    startDate: Date,
    endDate: Date,
    y: number
  ): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("GALAGA AGENCY", this.MARGIN, y);
    doc.setFontSize(14);
    doc.text("INFORME DE AUSENCIAS", this.MARGIN, y + 8);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Empleado: ${usuario.nombre}`, this.MARGIN, y);
    doc.text(`Email: ${usuario.email}`, 115, y);
    y += 8;

    const periodo = `${format(startDate, "dd/MM/yyyy", {
      locale: es,
    })} - ${format(endDate, "dd/MM/yyyy", { locale: es })}`;
    doc.text(`Período: ${periodo}`, this.MARGIN, y);
    doc.text(
      `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`,
      115,
      y
    );
    y += 15;

    doc.setLineWidth(0.5);
    doc.line(this.MARGIN, y, 195, y);
    y += 10;

    return y;
  }

  private static addReportSummary(
    doc: jsPDF,
    allAbsences: Absence[],
    realAbsences: Absence[],
    scheduledDaysOff: Absence[],
    y: number
  ): number {
    const uniqueRealAbsencesArr = Array.from(
      new Map(realAbsences.map((a) => [a.id, a])).values()
    );

    const totalAbsences = uniqueRealAbsencesArr.length;
    const totalMinutes = uniqueRealAbsencesArr.reduce(
      (sum, a) => sum + a.duracionMinutos,
      0
    );
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    const approvedCount = uniqueRealAbsencesArr.filter(
      (a) => a.estado === "aprobada"
    ).length;
    const rejectedCount = uniqueRealAbsencesArr.filter(
      (a) => a.estado === "rechazada"
    ).length;
    const pendingCount = uniqueRealAbsencesArr.filter(
      (a) => a.estado === "pendiente"
    ).length;

    doc.setFillColor(240, 240, 240);
    doc.rect(this.MARGIN, y, 180, 37, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(this.MARGIN, y, 180, 37, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RESUMEN DE AUSENCIAS", 20, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total ausencias: ${totalAbsences}`, 20, y + 15);
    doc.text(`Horas totales perdidas: ${totalHours}h`, 75, y + 15);
    doc.text(`Pendientes: ${pendingCount}`, 20, y + 22);
    doc.text(`Aprobadas: ${approvedCount}`, 75, y + 22);
    doc.text(`Rechazadas: ${rejectedCount}`, 135, y + 22);
    doc.text(`Días libres programados: ${scheduledDaysOff.length}`, 20, y + 29);

    return y + 47;
  }

  private static addScheduledDaysOffSection(
    doc: jsPDF,
    scheduledDaysOff: Absence[],
    y: number
  ): number {
    if (scheduledDaysOff.length === 0) return y;

    if (y + 40 > 282) {
      doc.addPage();
      y = this.MARGIN;
    }

    doc.setFillColor(200, 230, 255);
    doc.rect(this.MARGIN, y, 180, 10, "F");
    doc.setDrawColor(100, 150, 200);
    doc.rect(this.MARGIN, y, 180, 10, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DÍAS LIBRES PROGRAMADOS", 17, y + 7);

    y += 12;

    scheduledDaysOff.forEach((absence, index) => {
      if (y + 8 > 282) {
        doc.addPage();
        y = this.MARGIN;
      }
      if (index % 2 === 0) {
        doc.setFillColor(245, 250, 255);
        doc.rect(this.MARGIN, y, 180, 6, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const dateText =
        absence.fechas.length > 1
          ? `${format(absence.fechas[0], "dd/MM/yyyy", {
              locale: es,
            })} - ${format(
              absence.fechas[absence.fechas.length - 1],
              "dd/MM/yyyy",
              { locale: es }
            )} (${absence.fechas.length} días)`
          : format(absence.fechas[0], "EEEE, dd 'de' MMMM yyyy", {
              locale: es,
            });

      doc.text(
        `${dateText} - ${absence.razon} - ${this.getEstadoShortLabel(
          absence.estado
        )}`,
        17,
        y + 4
      );
      y += 6;
    });

    return y + 10;
  }

  private static addAbsencesTable(
    doc: jsPDF,
    absences: Absence[],
    y: number
  ): number {
    if (y + 40 > 282) {
      doc.addPage();
      y = this.MARGIN;
    }

    doc.setFillColor(50, 50, 50);
    doc.rect(this.MARGIN, y, 180, 10, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    let x = 17;
    doc.text("FECHA", x, y + 7);
    x += 30;
    doc.text("TIPO", x, y + 7);
    x += 45;
    doc.text("HORARIO", x, y + 7);
    x += 35;
    doc.text("DURACIÓN", x, y + 7);
    x += 30;
    doc.text("ESTADO", x, y + 7);

    doc.setTextColor(0, 0, 0);
    y += 12;

    const sortedAbsences = absences
      .flatMap((a) => a.fechas.map((f) => ({ ...a, fecha: f })))
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    for (let i = 0; i < sortedAbsences.length; i++) {
      const absence = sortedAbsences[i];

      if (y + 10 > 282) {
        doc.addPage();
        y = this.MARGIN;
      }
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(this.MARGIN, y, 180, 8, "F");
      }

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.rect(this.MARGIN, y, 180, 8, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      x = 17;
      doc.text(format(absence.fecha, "dd/MM/yyyy", { locale: es }), x, y + 5.5);
      x += 30;
      doc.text(this.getAbsenceTypeShortLabel(absence.tipoAusencia), x, y + 5.5);
      x += 45;
      doc.text(`${absence.horaInicio} - ${absence.horaFin}`, x, y + 5.5);
      x += 35;

      if (absence.tipoAusencia === "dia_libre") {
        doc.text("-", x, y + 5.5);
      } else {
        const hours = Math.floor(absence.duracionMinutos / 60);
        const minutes = absence.duracionMinutos % 60;
        doc.text(`${hours}h ${minutes}m`, x, y + 5.5);
      }

      x += 30;
      doc.text(this.getEstadoShortLabel(absence.estado), x, y + 5.5);

      y += 8;
    }

    return y + 10;
  }

  private static addCompanyReportHeader(
    doc: jsPDF,
    startDate: Date,
    endDate: Date,
    y: number
  ): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("GALAGA AGENCY", this.MARGIN, y);
    doc.setFontSize(14);
    doc.text("INFORME CONSOLIDADO DE AUSENCIAS", this.MARGIN, y + 8);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const periodo = `${format(startDate, "dd/MM/yyyy", {
      locale: es,
    })} - ${format(endDate, "dd/MM/yyyy", { locale: es })}`;
    doc.text(`Período: ${periodo}`, this.MARGIN, y);
    doc.text(
      `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`,
      115,
      y
    );
    y += 15;

    doc.setLineWidth(0.5);
    doc.line(this.MARGIN, y, 195, y);
    y += 10;

    return y;
  }

  private static addCompanyReportSummary(
    doc: jsPDF,
    stats: AbsenceStats,
    scheduledDaysOffCount: number,
    y: number
  ): number {
    doc.setFillColor(240, 240, 240);
    doc.rect(this.MARGIN, y, 180, 42, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(this.MARGIN, y, 180, 42, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RESUMEN GENERAL", 20, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const uniqueAbsencesArr = Array.from(
      new Map((stats as any).rawAbsences.map((a: any) => [a.id, a])).values()
    );

    doc.text(`Total de ausencias: ${uniqueAbsencesArr.length}`, 20, y + 15);
    doc.text(`Empleados afectados: ${stats.affectedUsers}`, 75, y + 15);
    doc.text(`Horas perdidas: ${stats.totalHoursMissed}h`, 135, y + 15);

    doc.text(`Días completos perdidos: ${stats.totalDaysMissed}`, 20, y + 22);
    doc.text(
      `Duración promedio: ${
        Math.round((stats.averageAbsenceDuration / 60) * 10) / 10
      }h`,
      75,
      y + 22
    );

    const approvedCount = uniqueAbsencesArr.filter(
      (a: any) => a.estado === "aprobada"
    ).length;
    const rejectedCount = uniqueAbsencesArr.filter(
      (a: any) => a.estado === "rechazada"
    ).length;
    const pendingCount = uniqueAbsencesArr.filter(
      (a: any) => a.estado === "pendiente"
    ).length;

    doc.text(`Pendientes: ${pendingCount}`, 20, y + 29);
    doc.text(`Aprobadas: ${approvedCount}`, 75, y + 29);
    doc.text(`Rechazadas: ${rejectedCount}`, 135, y + 29);

    doc.text(`Días libres programados: ${scheduledDaysOffCount}`, 20, y + 36);

    return y + 52;
  }

  private static addCompanyReasonStatistics(
    doc: jsPDF,
    stats: AbsenceStats,
    y: number
  ): number {
    if (y + 60 > 282) {
      doc.addPage();
      y = this.MARGIN;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("ANÁLISIS POR MOTIVO DE AUSENCIA", this.MARGIN, y);
    y += 8;

    doc.setFillColor(50, 50, 50);
    doc.rect(this.MARGIN, y, 180, 8, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    let x = 17;
    doc.text("#", x, y + 5.5);
    x += 10;
    doc.text("MOTIVO", x, y + 5.5);
    x += 80;
    doc.text("CASOS", x, y + 5.5);
    x += 30;
    doc.text("%", x, y + 5.5);
    x += 25;
    doc.text("HORAS", x, y + 5.5);

    doc.setTextColor(0, 0, 0);
    y += 10;

    stats.reasonStats.forEach((reason, index) => {
      if (y + 8 > 282) {
        doc.addPage();
        y = this.MARGIN;
      }
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(this.MARGIN, y, 180, 8, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      x = 17;
      doc.text(`${index + 1}`, x, y + 5.5);
      x += 10;
      doc.text(
        AbsenceStatisticsCalculator.getReasonLabel(reason.razon),
        x,
        y + 5.5
      );
      x += 80;
      doc.text(`${reason.count}`, x, y + 5.5);
      x += 30;
      doc.text(`${reason.percentage}%`, x, y + 5.5);
      x += 25;
      doc.text(`${reason.totalHours}h`, x, y + 5.5);

      y += 8;
    });

    return y + 10;
  }

  private static addCompanyTypeStatistics(
    doc: jsPDF,
    stats: AbsenceStats,
    y: number
  ): number {
    if (y + 60 > 282) {
      doc.addPage();
      y = this.MARGIN;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("ANÁLISIS POR TIPO DE AUSENCIA", this.MARGIN, y);
    y += 8;

    doc.setFillColor(50, 50, 50);
    doc.rect(this.MARGIN, y, 180, 8, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    let x = 17;
    doc.text("#", x, y + 5.5);
    x += 10;
    doc.text("TIPO", x, y + 5.5);
    x += 80;
    doc.text("CASOS", x, y + 5.5);
    x += 30;
    doc.text("%", x, y + 5.5);
    x += 25;
    doc.text("HORAS", x, y + 5.5);

    doc.setTextColor(0, 0, 0);
    y += 10;

    stats.typeStats.forEach((type, index) => {
      if (y + 8 > 282) {
        doc.addPage();
        y = this.MARGIN;
      }
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(this.MARGIN, y, 180, 8, "F");
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      x = 17;
      doc.text(`${index + 1}`, x, y + 5.5);
      x += 10;
      doc.text(AbsenceStatisticsCalculator.getTypeLabel(type.tipo), x, y + 5.5);
      x += 80;
      doc.text(`${type.count}`, x, y + 5.5);
      x += 30;
      doc.text(`${type.percentage}%`, x, y + 5.5);
      x += 25;
      doc.text(
        `${Math.round((type.totalMinutes / 60) * 10) / 10}h`,
        x,
        y + 5.5
      );

      y += 8;
    });

    return y + 10;
  }

  private static addCompanyAbsencesByUser(
    doc: jsPDF,
    absences: Absence[],
    users: Usuario[],
    y: number
  ): number {
    if (y + 60 > 282) {
      doc.addPage();
      y = this.MARGIN;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DETALLE POR EMPLEADO", this.MARGIN, y);
    y += 8;

    const userAbsenceMap = new Map<string, Absence[]>();
    absences.forEach((absence) => {
      if (!userAbsenceMap.has(absence.usuarioId)) {
        userAbsenceMap.set(absence.usuarioId, []);
      }
      userAbsenceMap.get(absence.usuarioId)!.push(absence);
    });

    const sortedUsers = Array.from(userAbsenceMap.entries()).sort(
      (a, b) => b[1].length - a[1].length
    );

    doc.setFillColor(50, 50, 50);
    doc.rect(this.MARGIN, y, 180, 8, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    let x = 17;
    doc.text("EMPLEADO", x, y + 5.5);
    x += 80;
    doc.text("AUSENCIAS", x, y + 5.5);
    x += 35;
    doc.text("HORAS", x, y + 5.5);
    x += 30;
    doc.text("ESTADO", x, y + 5.5);

    doc.setTextColor(0, 0, 0);
    y += 10;

    sortedUsers.forEach(([userId, userAbsences], index) => {
      if (y + 8 > 282) {
        doc.addPage();
        y = this.MARGIN;
      }

      const user = users.find((u) => u.id === userId);

      const totalMinutes = userAbsences
        .filter((a) => a.tipoAusencia !== "dia_libre")
        .reduce((sum, a) => sum + a.duracionMinutos, 0);
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

      const pending = userAbsences.filter(
        (a) => a.estado === "pendiente"
      ).length;

      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(this.MARGIN, y, 180, 8, "F");
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      x = 17;
      doc.text(user?.nombre || userId, x, y + 5.5);
      x += 80;
      doc.text(`${userAbsences.length}`, x, y + 5.5);
      x += 35;
      doc.text(`${totalHours}h`, x, y + 5.5);
      x += 30;
      doc.text(`${pending} pend.`, x, y + 5.5);

      y += 8;
    });

    return y + 10;
  }

  private static getAbsenceTypeShortLabel(tipo: string): string {
    const labels: Record<string, string> = {
      tardanza: "Tardanza",
      salida_temprana: "Salida Temp.",
      ausencia_parcial: "Ausencia Parc.",
      ausencia_completa: "Día Completo",
      permiso_medico: "Permiso Médico",
      permiso_personal: "Permiso Pers.",
      dia_libre: "Día Libre",
    };
    return labels[tipo] || tipo;
  }

  private static getEstadoShortLabel(estado: string): string {
    const labels: Record<string, string> = {
      pendiente: "Pendiente",
      aprobada: "Aprobada",
      rechazada: "Rechazada",
      programada: "Programada",
    };
    return labels[estado] || estado;
  }

  private static addFooters(doc: jsPDF) {
    const anyDoc = doc as any;
    const pageCount: number =
      typeof anyDoc.getNumberOfPages === "function"
        ? anyDoc.getNumberOfPages()
        : anyDoc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${pageCount}`, 195, 289, { align: "right" });
    }
  }

  private static generateUserReportFilename(
    usuario: Usuario,
    startDate: Date,
    endDate: Date
  ): string {
    const nombre = usuario.nombre.replace(/[^a-zA-Z0-9]/g, "_");
    const start = format(startDate, "yyyy-MM-dd");
    const end = format(endDate, "yyyy-MM-dd");
    return `informe_ausencias_${nombre}_${start}_${end}.pdf`;
  }

  private static generateCompanyReportFilename(
    startDate: Date,
    endDate: Date
  ): string {
    const start = format(startDate, "yyyy-MM-dd");
    const end = format(endDate, "yyyy-MM-dd");
    return `informe_consolidado_ausencias_${start}_${end}.pdf`;
  }
}
