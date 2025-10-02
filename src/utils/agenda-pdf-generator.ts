import jsPDF from "jspdf";
import { format, differenceInDays, addDays } from "date-fns";
import { es } from "date-fns/locale";
import type { Usuario, Absence } from "@/types";
import type { TeleworkingSchedule } from "@/types/teleworking";

interface AgendaReportData {
  usuario: Usuario;
  absences: Absence[];
  teleworkSchedules: TeleworkingSchedule[];
  fechaInicio: Date;
  fechaFin: Date;
}

interface DateRange {
  start: Date;
  end: Date;
  count: number;
  absence: Absence;
}

export class AgendaPDFGenerator {
  private static readonly MARGIN = 15;
  private static readonly PAGE_WIDTH = 210;
  private static readonly PAGE_HEIGHT = 297;

  static async generateReport(data: AgendaReportData): Promise<void> {
    const doc = new jsPDF();
    let y = this.MARGIN;

    const holidays = data.absences.filter(
      (a) => a.tipoAusencia === "dia_libre"
    );
    const realAbsences = data.absences.filter(
      (a) => a.tipoAusencia !== "dia_libre"
    );

    y = this.addHeader(doc, data, y);
    y = this.addSummary(doc, data, y);
    y = this.addHolidaysSection(doc, holidays, y);
    y = this.addAbsencesSection(doc, realAbsences, y);
    y = this.addTeleworkSection(doc, data.teleworkSchedules, y);

    this.addFooters(doc);
    doc.save(this.generateFilename(data));
  }

  private static groupDateRanges(absence: Absence): DateRange[] {
    const sortedDates = absence.fechas.sort(
      (a, b) => a.getTime() - b.getTime()
    );
    const ranges: DateRange[] = [];
    let currentRange: Date[] = [sortedDates[0]];

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currentDate = sortedDates[i];
      const daysDiff = differenceInDays(currentDate, prevDate);

      if (daysDiff === 1) {
        currentRange.push(currentDate);
      } else {
        ranges.push({
          start: currentRange[0],
          end: currentRange[currentRange.length - 1],
          count: currentRange.length,
          absence,
        });
        currentRange = [currentDate];
      }
    }

    ranges.push({
      start: currentRange[0],
      end: currentRange[currentRange.length - 1],
      count: currentRange.length,
      absence,
    });

    return ranges;
  }

  private static addHeader(
    doc: jsPDF,
    data: AgendaReportData,
    y: number
  ): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("GALAGA AGENCY", this.MARGIN, y);
    doc.setFontSize(14);
    doc.text("INFORME DE AGENDA", this.MARGIN, y + 8);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Empleado: ${data.usuario.nombre}`, this.MARGIN, y);
    doc.text(`Email: ${data.usuario.email}`, this.MARGIN + 100, y);
    y += 8;

    const periodo = `${format(data.fechaInicio, "dd/MM/yyyy", {
      locale: es,
    })} - ${format(data.fechaFin, "dd/MM/yyyy", { locale: es })}`;
    doc.text(`Período: ${periodo}`, this.MARGIN, y);
    doc.text(
      `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`,
      this.MARGIN + 100,
      y
    );
    y += 15;

    doc.setLineWidth(0.5);
    doc.line(this.MARGIN, y, this.PAGE_WIDTH - this.MARGIN, y);
    y += 10;

    return y;
  }

  private static addSummary(
    doc: jsPDF,
    data: AgendaReportData,
    y: number
  ): number {
    const realAbsences = data.absences.filter(
      (a) => a.tipoAusencia !== "dia_libre"
    );
    const daysOff = data.absences.filter((a) => a.tipoAusencia === "dia_libre");
    const remoteDays = data.teleworkSchedules.filter(
      (t) => t.location === "remote"
    );
    const officeDays = data.teleworkSchedules.filter(
      (t) => t.location === "office"
    );

    doc.setFillColor(240, 240, 240);
    doc.rect(this.MARGIN, y, 180, 30, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(this.MARGIN, y, 180, 30, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RESUMEN DEL PERÍODO", this.MARGIN + 5, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Ausencias reportadas: ${realAbsences.length}`,
      this.MARGIN + 5,
      y + 15
    );
    doc.text(
      `Días libres/vacaciones: ${daysOff.length}`,
      this.MARGIN + 70,
      y + 15
    );
    doc.text(
      `Días en teletrabajo: ${remoteDays.length}`,
      this.MARGIN + 5,
      y + 22
    );
    doc.text(`Días en oficina: ${officeDays.length}`, this.MARGIN + 70, y + 22);

    return y + 40;
  }

  private static addHolidaysSection(
    doc: jsPDF,
    holidays: Absence[],
    y: number
  ): number {
    if (holidays.length === 0) return y;

    if (y + 60 > this.PAGE_HEIGHT - this.MARGIN) {
      doc.addPage();
      y = this.MARGIN;
    }

    doc.setFillColor(245, 158, 11);
    doc.rect(this.MARGIN, y, 180, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DÍAS LIBRES Y VACACIONES", this.MARGIN + 5, y + 6);
    doc.setTextColor(0, 0, 0);
    y += 15;

    const allDates: { date: Date; absence: Absence }[] = holidays.flatMap((h) =>
      h.fechas.map((d) => ({ date: d, absence: h }))
    );

    allDates.sort((a, b) => a.date.getTime() - b.date.getTime());

    const ranges: { start: Date; end: Date; count: number; reason: string }[] =
      [];
    let currentStart = allDates[0]?.date;
    let currentEnd = allDates[0]?.date;
    let currentCount = 1;
    let currentReason = allDates[0]?.absence.razon || "";

    for (let i = 1; i < allDates.length; i++) {
      const prev = allDates[i - 1].date;
      const curr = allDates[i].date;
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        currentEnd = curr;
        currentCount++;
      } else {
        ranges.push({
          start: currentStart,
          end: currentEnd,
          count: currentCount,
          reason: currentReason,
        });
        currentStart = curr;
        currentEnd = curr;
        currentCount = 1;
        currentReason = allDates[i].absence.razon || "";
      }
    }
    ranges.push({
      start: currentStart,
      end: currentEnd,
      count: currentCount,
      reason: currentReason,
    });

    for (const range of ranges) {
      if (y + 20 > this.PAGE_HEIGHT - this.MARGIN) {
        doc.addPage();
        y = this.MARGIN;
      }

      doc.setFillColor(254, 243, 199);
      doc.rect(this.MARGIN, y, 180, 16, "F");
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.3);
      doc.rect(this.MARGIN, y, 180, 16, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);

      if (range.count === 1) {
        doc.text(
          format(range.start, "dd/MM/yyyy - EEEE", { locale: es }),
          this.MARGIN + 3,
          y + 6
        );
      } else {
        doc.text(
          `${format(range.start, "dd/MM/yyyy", { locale: es })} - ${format(
            range.end,
            "dd/MM/yyyy",
            { locale: es }
          )}`,
          this.MARGIN + 3,
          y + 6
        );
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`(${range.count} días consecutivos)`, this.MARGIN + 3, y + 11);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Motivo: ${range.reason}`, this.MARGIN + 100, y + 11);

      y += 19;
    }

    return y + 10;
  }

  private static addAbsencesSection(
    doc: jsPDF,
    absences: Absence[],
    y: number
  ): number {
    if (absences.length === 0) return y;

    if (y + 60 > this.PAGE_HEIGHT - this.MARGIN) {
      doc.addPage();
      y = this.MARGIN;
    }

    doc.setFillColor(50, 50, 50);
    doc.rect(this.MARGIN, y, 180, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("AUSENCIAS REPORTADAS", this.MARGIN + 5, y + 6);
    doc.setTextColor(0, 0, 0);
    y += 15;

    // ✅ Flatten all fechas across all absences
    const allDates: { date: Date; absence: Absence }[] = absences.flatMap((a) =>
      a.fechas.map((d) => ({ date: d, absence: a }))
    );

    // ✅ Sort by date
    allDates.sort((a, b) => a.date.getTime() - b.date.getTime());

    // ✅ Merge consecutive days
    const ranges: {
      start: Date;
      end: Date;
      count: number;
      absence: Absence;
    }[] = [];
    let currentStart = allDates[0]?.date;
    let currentEnd = allDates[0]?.date;
    let currentCount = 1;
    let currentAbs = allDates[0]?.absence;

    for (let i = 1; i < allDates.length; i++) {
      const prev = allDates[i - 1].date;
      const curr = allDates[i].date;
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (
        diff === 1 &&
        allDates[i].absence.tipoAusencia === currentAbs?.tipoAusencia
      ) {
        currentEnd = curr;
        currentCount++;
      } else {
        ranges.push({
          start: currentStart,
          end: currentEnd,
          count: currentCount,
          absence: currentAbs!,
        });
        currentStart = curr;
        currentEnd = curr;
        currentCount = 1;
        currentAbs = allDates[i].absence;
      }
    }
    ranges.push({
      start: currentStart,
      end: currentEnd,
      count: currentCount,
      absence: currentAbs!,
    });

    // ✅ Render each range as a block
    for (const range of ranges) {
      const heightNeeded = range.count === 1 ? 25 : 30;
      if (y + heightNeeded > this.PAGE_HEIGHT - this.MARGIN) {
        doc.addPage();
        y = this.MARGIN;
      }

      doc.setFillColor(250, 250, 250);
      doc.rect(this.MARGIN, y, 180, heightNeeded, "F");
      doc.setDrawColor(220, 220, 220);
      doc.rect(this.MARGIN, y, 180, heightNeeded, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);

      if (range.count === 1) {
        doc.text(
          format(range.start, "dd/MM/yyyy - EEEE", { locale: es }),
          this.MARGIN + 3,
          y + 6
        );
      } else {
        doc.text(
          `${format(range.start, "dd/MM/yyyy", { locale: es })} - ${format(
            range.end,
            "dd/MM/yyyy",
            { locale: es }
          )}`,
          this.MARGIN + 3,
          y + 6
        );
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`(${range.count} días consecutivos)`, this.MARGIN + 3, y + 11);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const tipo = range.absence.tipoAusencia
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      const baseY = range.count === 1 ? y + 11 : y + 16;
      doc.text(`Tipo: ${tipo}`, this.MARGIN + 3, baseY);
      doc.text(`Motivo: ${range.absence.razon}`, this.MARGIN + 3, baseY + 5);

      if (range.absence.horaInicio && range.absence.horaFin) {
        doc.text(
          `Horario: ${range.absence.horaInicio} - ${range.absence.horaFin}`,
          this.MARGIN + 100,
          baseY
        );
      }

      const estadoColor: [number, number, number] =
        range.absence.estado === "aprobada"
          ? [34, 197, 94]
          : range.absence.estado === "pendiente"
          ? [234, 179, 8]
          : [239, 68, 68];
      doc.setTextColor(...estadoColor);
      doc.text(
        `Estado: ${range.absence.estado.toUpperCase()}`,
        this.MARGIN + 100,
        baseY + 5
      );
      doc.setTextColor(0, 0, 0);

      y += heightNeeded + 3;
    }

    return y + 10;
  }

  private static addTeleworkSection(
    doc: jsPDF,
    schedules: TeleworkingSchedule[],
    y: number
  ): number {
    // ✅ only keep remote telework
    const remoteSchedules = schedules.filter((s) => s.location === "remote");
    if (remoteSchedules.length === 0) return y;

    if (y + 60 > this.PAGE_HEIGHT - this.MARGIN) {
      doc.addPage();
      y = this.MARGIN;
    }

    doc.setFillColor(50, 50, 50);
    doc.rect(this.MARGIN, y, 180, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("PROGRAMACIÓN DE TELETRABAJO", this.MARGIN + 5, y + 6);
    doc.setTextColor(0, 0, 0);
    y += 15;

    // ✅ Flatten dates
    const allDates = remoteSchedules.map((s) => ({
      date: s.fecha,
      notes: s.notes || "",
    }));

    // ✅ Sort by date
    allDates.sort((a, b) => a.date.getTime() - b.date.getTime());

    // ✅ Merge consecutive dates
    const ranges: { start: Date; end: Date; count: number; notes: string[] }[] =
      [];
    let currentStart = allDates[0].date;
    let currentEnd = allDates[0].date;
    let currentCount = 1;
    let currentNotes: string[] = allDates[0].notes ? [allDates[0].notes] : [];

    for (let i = 1; i < allDates.length; i++) {
      const prev = allDates[i - 1].date;
      const curr = allDates[i].date;
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        currentEnd = curr;
        currentCount++;
        if (allDates[i].notes) currentNotes.push(allDates[i].notes);
      } else {
        ranges.push({
          start: currentStart,
          end: currentEnd,
          count: currentCount,
          notes: currentNotes,
        });
        currentStart = curr;
        currentEnd = curr;
        currentCount = 1;
        currentNotes = allDates[i].notes ? [allDates[i].notes] : [];
      }
    }
    ranges.push({
      start: currentStart,
      end: currentEnd,
      count: currentCount,
      notes: currentNotes,
    });

    // ✅ Render merged ranges
    for (const range of ranges) {
      if (y + 20 > this.PAGE_HEIGHT - this.MARGIN) {
        doc.addPage();
        y = this.MARGIN;
      }

      doc.setFillColor(219, 234, 254);
      doc.rect(this.MARGIN, y, 180, 16, "F");
      doc.setDrawColor(220, 220, 220);
      doc.rect(this.MARGIN, y, 180, 16, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);

      if (range.count === 1) {
        doc.text(
          format(range.start, "dd/MM/yyyy - EEEE", { locale: es }),
          this.MARGIN + 3,
          y + 6
        );
      } else {
        doc.text(
          `${format(range.start, "dd/MM/yyyy", { locale: es })} - ${format(
            range.end,
            "dd/MM/yyyy",
            { locale: es }
          )}`,
          this.MARGIN + 3,
          y + 6
        );
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`(${range.count} días consecutivos)`, this.MARGIN + 3, y + 11);
      }

      // Optional notes
      if (range.notes.length > 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.text(
          `Notas: ${range.notes.join("; ")}`,
          this.MARGIN + 100,
          range.count === 1 ? y + 11 : y + 16
        );
        doc.setFont("helvetica", "normal");
      }

      y += 19;
    }

    return y + 10;
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
      doc.text(
        `Página ${i} de ${pageCount}`,
        this.PAGE_WIDTH - this.MARGIN,
        this.PAGE_HEIGHT - 8,
        { align: "right" }
      );
    }
  }

  private static generateFilename(data: AgendaReportData): string {
    const start = format(data.fechaInicio, "yyyy-MM-dd");
    const end = format(data.fechaFin, "yyyy-MM-dd");
    const nombre = data.usuario.nombre.replace(/[^a-zA-Z0-9]/g, "_");
    return `informe_agenda_${nombre}_${start}_${end}.pdf`;
  }
}
