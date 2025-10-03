import jsPDF from "jspdf";
import { format, addDays, isEqual } from "date-fns";
import { es } from "date-fns/locale";
import type { TeleworkingSchedule } from "@/types/teleworking";
import type { Usuario } from "@/types";

interface GroupedSchedule {
  usuarioId: string;
  usuarioName: string;
  location: "remote" | "office";
  startDate: Date;
  endDate: Date;
  schedules: TeleworkingSchedule[];
}

export class TeleworkingPDFGenerator {
  private static readonly MARGIN = 15;
  private static readonly PAGE_WIDTH = 210;
  private static readonly PAGE_HEIGHT = 297;

  static async generateUserReport(
    usuario: Usuario,
    schedules: TeleworkingSchedule[],
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const userSchedules = schedules.filter((s) => s.usuarioId === usuario.id);

    if (userSchedules.length === 0) {
      throw new Error(
        "No hay registros de teletrabajo para este empleado en el período seleccionado"
      );
    }

    const doc = new jsPDF();
    let y = this.MARGIN;

    y = this.addUserReportHeader(doc, usuario, startDate, endDate, y);
    y = this.addUserSummary(doc, userSchedules, y);
    y = this.addUserSchedulesTable(doc, userSchedules, y);

    this.addFooters(doc);
    doc.save(this.generateUserReportFilename(usuario, startDate, endDate));
  }

  static async generateCompanyReport(
    schedules: TeleworkingSchedule[],
    users: Usuario[],
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    if (schedules.length === 0) {
      throw new Error(
        "No hay registros de teletrabajo para el período seleccionado"
      );
    }

    const doc = new jsPDF();
    let y = this.MARGIN;

    y = this.addCompanyReportHeader(doc, startDate, endDate, y);
    y = this.addCompanySummary(doc, schedules, users, y);
    y = this.addCompanySchedulesByUser(doc, schedules, users, y);

    this.addFooters(doc);
    doc.save(this.generateCompanyReportFilename(startDate, endDate));
  }

  private static addUserReportHeader(
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
    doc.text("INFORME DE TELETRABAJO", this.MARGIN, y + 8);
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

  private static addUserSummary(
    doc: jsPDF,
    schedules: TeleworkingSchedule[],
    y: number
  ): number {
    const remoteDays = schedules.filter((s) => s.location === "remote").length;
    const officeDays = schedules.filter((s) => s.location === "office").length;
    const pendingDays = schedules.filter(
      (s) => s.estado === "pendiente"
    ).length;
    const approvedDays = schedules.filter(
      (s) => s.estado === "aprobada"
    ).length;

    doc.setFillColor(240, 240, 240);
    doc.rect(this.MARGIN, y, 180, 30, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(this.MARGIN, y, 180, 30, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RESUMEN DE TELETRABAJO", 20, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Días en remoto: ${remoteDays}`, 20, y + 15);
    doc.text(`Días en oficina: ${officeDays}`, 75, y + 15);
    doc.text(`Pendientes: ${pendingDays}`, 20, y + 22);
    doc.text(`Aprobados: ${approvedDays}`, 75, y + 22);

    return y + 40;
  }

  private static addUserSchedulesTable(
    doc: jsPDF,
    schedules: TeleworkingSchedule[],
    y: number
  ): number {
    if (y + 40 > 282) {
      doc.addPage();
      y = this.MARGIN;
    }

    const grouped = this.groupConsecutiveSchedules(schedules);

    doc.setFillColor(50, 50, 50);
    doc.rect(this.MARGIN, y, 180, 10, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    let x = 17;
    doc.text("PERÍODO", x, y + 7);
    x += 70;
    doc.text("UBICACIÓN", x, y + 7);
    x += 50;
    doc.text("ESTADO", x, y + 7);

    doc.setTextColor(0, 0, 0);
    y += 12;

    grouped.forEach((group, index) => {
      if (y + 10 > 282) {
        doc.addPage();
        y = this.MARGIN;
      }

      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(this.MARGIN, y, 180, 8, "F");
      }

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.rect(this.MARGIN, y, 180, 8, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      x = 17;
      const dateText = isEqual(group.startDate, group.endDate)
        ? format(group.startDate, "dd/MM/yyyy", { locale: es })
        : `${format(group.startDate, "dd/MM/yyyy")} - ${format(
            group.endDate,
            "dd/MM/yyyy"
          )} (${group.schedules.length} días)`;

      doc.text(dateText, x, y + 5.5);
      x += 70;
      doc.text(
        group.location === "remote" ? "Teletrabajo" : "Oficina",
        x,
        y + 5.5
      );
      x += 50;
      doc.text(
        group.schedules[0].estado === "pendiente" ? "Pendiente" : "Aprobado",
        x,
        y + 5.5
      );

      y += 8;
    });

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
    doc.text("INFORME CONSOLIDADO DE TELETRABAJO", this.MARGIN, y + 8);
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

  private static addCompanySummary(
    doc: jsPDF,
    schedules: TeleworkingSchedule[],
    users: Usuario[],
    y: number
  ): number {
    const totalRemote = schedules.filter((s) => s.location === "remote").length;
    const totalOffice = schedules.filter((s) => s.location === "office").length;
    const uniqueUsers = new Set(schedules.map((s) => s.usuarioId)).size;
    const pendingCount = schedules.filter(
      (s) => s.estado === "pendiente"
    ).length;
    const approvedCount = schedules.filter(
      (s) => s.estado === "aprobada"
    ).length;

    doc.setFillColor(240, 240, 240);
    doc.rect(this.MARGIN, y, 180, 37, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(this.MARGIN, y, 180, 37, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RESUMEN GENERAL", 20, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total días en remoto: ${totalRemote}`, 20, y + 15);
    doc.text(`Total días en oficina: ${totalOffice}`, 75, y + 15);
    doc.text(`Empleados con registros: ${uniqueUsers}`, 135, y + 15);
    doc.text(`Pendientes: ${pendingCount}`, 20, y + 22);
    doc.text(`Aprobados: ${approvedCount}`, 75, y + 22);
    doc.text(`Total registros: ${schedules.length}`, 20, y + 29);

    return y + 47;
  }

  private static addCompanySchedulesByUser(
    doc: jsPDF,
    schedules: TeleworkingSchedule[],
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

    const userScheduleMap = new Map<string, TeleworkingSchedule[]>();
    schedules.forEach((schedule) => {
      if (!userScheduleMap.has(schedule.usuarioId)) {
        userScheduleMap.set(schedule.usuarioId, []);
      }
      userScheduleMap.get(schedule.usuarioId)!.push(schedule);
    });

    const sortedUsers = Array.from(userScheduleMap.entries()).sort(
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
    doc.text("REMOTO", x, y + 5.5);
    x += 30;
    doc.text("OFICINA", x, y + 5.5);
    x += 30;
    doc.text("PENDIENTE", x, y + 5.5);

    doc.setTextColor(0, 0, 0);
    y += 10;

    sortedUsers.forEach(([userId, userSchedules], index) => {
      if (y + 8 > 282) {
        doc.addPage();
        y = this.MARGIN;
      }

      const user = users.find((u) => u.id === userId);
      const remoteDays = userSchedules.filter(
        (s) => s.location === "remote"
      ).length;
      const officeDays = userSchedules.filter(
        (s) => s.location === "office"
      ).length;
      const pending = userSchedules.filter(
        (s) => s.estado === "pendiente"
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
      doc.text(`${remoteDays}`, x, y + 5.5);
      x += 30;
      doc.text(`${officeDays}`, x, y + 5.5);
      x += 30;
      doc.text(`${pending}`, x, y + 5.5);

      y += 8;
    });

    return y + 10;
  }

  private static groupConsecutiveSchedules(
    schedules: TeleworkingSchedule[]
  ): GroupedSchedule[] {
    if (schedules.length === 0) return [];

    const sorted = [...schedules].sort(
      (a, b) => a.fecha.getTime() - b.fecha.getTime()
    );

    const groups: GroupedSchedule[] = [];
    let currentGroup: GroupedSchedule | null = null;

    for (const schedule of sorted) {
      const nextDay = currentGroup ? addDays(currentGroup.endDate, 1) : null;
      const scheduleDate = new Date(schedule.fecha);
      scheduleDate.setHours(0, 0, 0, 0);

      if (nextDay) {
        nextDay.setHours(0, 0, 0, 0);
      }

      const canGroup =
        currentGroup &&
        currentGroup.location === schedule.location &&
        nextDay &&
        nextDay.getTime() === scheduleDate.getTime();

      if (canGroup && currentGroup) {
        currentGroup.endDate = schedule.fecha;
        currentGroup.schedules.push(schedule);
      } else {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          usuarioId: schedule.usuarioId,
          usuarioName: schedule.createdByName,
          location: schedule.location,
          startDate: schedule.fecha,
          endDate: schedule.fecha,
          schedules: [schedule],
        };
      }
    }

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
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
    return `informe_teletrabajo_${nombre}_${start}_${end}.pdf`;
  }

  private static generateCompanyReportFilename(
    startDate: Date,
    endDate: Date
  ): string {
    const start = format(startDate, "yyyy-MM-dd");
    const end = format(endDate, "yyyy-MM-dd");
    return `informe_consolidado_teletrabajo_${start}_${end}.pdf`;
  }
}
