import jsPDF from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { RegistroTiempo } from "@/types";
import {
  TimeCorrectionsService,
  type TimeCorrection,
} from "@/services/time-corrections-service";

export interface ReportData {
  usuario: { id: string; nombre: string; email: string; firstLogin?: boolean };
  registros: RegistroTiempo[];
  periodo: string;
  fechaInicio: Date;
  fechaFin: Date;
  estadisticas: {
    tiempoTotal: string;
    diasTrabajados: number;
    promedioDiario: string;
  };
}

export class PDFReportGenerator {
  private static readonly MARGIN = 16;
  private static readonly PAGE_WIDTH = 210;
  private static readonly PAGE_HEIGHT = 297;
  private static readonly ROW_HEIGHT = 8;

  static async generateReport(data: ReportData): Promise<void> {
    const doc = new jsPDF();
    let y = this.MARGIN;

    // Fetch corrections for all records
    const recordIds = data.registros.map((r) => r.id);
    const correctionsMap =
      await TimeCorrectionsService.getCorrectionsForRecords(recordIds);
    const hasCorrections = correctionsMap.size > 0;

    y = this.addHeader(doc, data, y);

    // Add corrections notice if any exist
    if (hasCorrections) {
      y = this.addCorrectionsNotice(doc, y, correctionsMap.size);
    }

    y = this.addTableHeader(doc, y);

    const days = this.buildDayBlocks(data.registros, correctionsMap);

    let periodTotalMs = 0;

    for (const day of days) {
      for (const row of day.rows) {
        if (y > this.PAGE_HEIGHT - this.MARGIN - this.ROW_HEIGHT * 2) {
          doc.addPage();
          y = this.MARGIN;
          y = this.addHeader(doc, data, y);
          y = this.addTableHeader(doc, y);
        }
        y = this.drawRow(doc, y, row);
      }

      // Total del día
      if (y > this.PAGE_HEIGHT - this.MARGIN - this.ROW_HEIGHT) {
        doc.addPage();
        y = this.MARGIN;
        y = this.addHeader(doc, data, y);
        y = this.addTableHeader(doc, y);
      }

      y += 8;
      doc.setLineWidth(0.2);
      doc.line(this.MARGIN, y - 6, this.PAGE_WIDTH - this.MARGIN, y - 6);

      const { dateX, durX } = this.columns();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Total del día (${day.labelDate})`, dateX, y);
      doc.text(day.totalLabel, durX, y);
      doc.setFont("helvetica", "normal");
      y += this.ROW_HEIGHT;

      periodTotalMs += day.totalMs;
    }

    // Total del período
    if (y > this.PAGE_HEIGHT - this.MARGIN - this.ROW_HEIGHT) {
      doc.addPage();
      y = this.MARGIN;
      y = this.addHeader(doc, data, y);
      y = this.addTableHeader(doc, y);
    }
    y += 10;
    doc.setLineWidth(0.4);
    doc.line(this.MARGIN, y - 7, this.PAGE_WIDTH - this.MARGIN, y - 7);

    const { dateX, durX } = this.columns();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Total del período", dateX, y);
    doc.text(this.msLabel(periodTotalMs), durX, y);
    doc.setFont("helvetica", "normal");
    y += this.ROW_HEIGHT;

    // Add corrections appendix if any exist
    if (hasCorrections) {
      y = this.addCorrectionsAppendix(doc, y, correctionsMap);
    }

    this.addFooters(doc);
    doc.save(this.generateFilename(data));
  }

  // Corrections helper methods
  private static addCorrectionsNotice(
    doc: jsPDF,
    y: number,
    correctionCount: number
  ): number {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Este informe contiene ${correctionCount} corrección${
        correctionCount > 1 ? "es" : ""
      } administrativas marcadas con (*), con detalles al fin de este documento`,
      this.MARGIN,
      y
    );
    doc.setFont("helvetica", "normal");
    return y + 8;
  }

  private static addCorrectionsAppendix(
    doc: jsPDF,
    y: number,
    correctionsMap: Map<string, TimeCorrection[]>
  ): number {
    const estimatedHeight = correctionsMap.size * 20 + 40;
    if (y + estimatedHeight > this.PAGE_HEIGHT - this.MARGIN) {
      doc.addPage();
      y = this.MARGIN;
    }

    y += 10;
    doc.setLineWidth(0.3);
    doc.line(this.MARGIN, y, this.PAGE_WIDTH - this.MARGIN, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Registro de Correcciones Administrativas", this.MARGIN, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    let correctionNumber = 1;
    for (const [recordId, corrections] of correctionsMap.entries()) {
      for (const correction of corrections) {
        if (y + 20 > this.PAGE_HEIGHT - this.MARGIN) {
          doc.addPage();
          y = this.MARGIN;
        }

        doc.text(
          `${correctionNumber}. Corrección aplicada el ${format(
            correction.fechaCorreccion,
            "dd/MM/yyyy HH:mm",
            { locale: es }
          )}`,
          this.MARGIN,
          y
        );
        y += 4;

        doc.text(
          `   Administrador: ${correction.adminUserName}`,
          this.MARGIN,
          y
        );
        y += 4;

        doc.text(
          `   Campo modificado: ${this.getFieldDisplayName(
            correction.campoModificado
          )}`,
          this.MARGIN,
          y
        );
        y += 4;

        doc.text(
          `   Valor anterior: ${this.formatCorrectionValue(
            correction.valorAnterior
          )}`,
          this.MARGIN,
          y
        );
        y += 4;

        doc.text(
          `   Valor nuevo: ${this.formatCorrectionValue(
            correction.valorNuevo
          )}`,
          this.MARGIN,
          y
        );
        y += 4;

        doc.text(`   Razón: ${correction.razon}`, this.MARGIN, y);
        y += 8;

        correctionNumber++;
      }
    }

    return y;
  }

  private static getFieldDisplayName(field: string): string {
    const names: Record<string, string> = {
      fecha_entrada: "Hora de entrada",
      fecha_salida: "Hora de salida",
      tipo_registro: "Tipo de registro",
    };
    return names[field] || field;
  }

  private static formatCorrectionValue(value: string): string {
    if (value === "null") return "Sin valor";

    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return format(date, "dd/MM/yyyy HH:mm:ss", { locale: es });
      }
    } catch {}

    return value;
  }

  // Layout methods
  private static addHeader(doc: jsPDF, data: ReportData, y: number): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Informe de fichajes", this.MARGIN, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Empleado: ${data.usuario.nombre}`, this.MARGIN, y);
    y += 6;

    const periodo = `${format(data.fechaInicio, "dd/MM/yyyy", {
      locale: es,
    })} - ${format(data.fechaFin, "dd/MM/yyyy", { locale: es })}`;
    doc.text(`Período: ${periodo}`, this.MARGIN, y);
    y += 6;

    doc.text(
      `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`,
      this.MARGIN,
      y
    );
    y += 8;

    doc.setLineWidth(0.2);
    doc.line(this.MARGIN, y, this.PAGE_WIDTH - this.MARGIN, y);
    return y + 6;
  }

  private static addTableHeader(doc: jsPDF, y: number): number {
    const { dateX, inX, outX, durX } = this.columns();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Fecha", dateX, y);
    doc.text("Inicio", inX, y);
    doc.text("Stop", outX, y);
    doc.text("Duración", durX, y);
    y += 4;
    doc.setLineWidth(0.2);
    doc.line(this.MARGIN, y, this.PAGE_WIDTH - this.MARGIN, y);
    return y + 6;
  }

  private static drawRow(doc: jsPDF, y: number, row: any): number {
    const { dateX, inX, outX, durX } = this.columns();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const dateText = row.isModified ? `${row.fecha} *` : row.fecha;
    doc.text(dateText, dateX, y);
    doc.text(row.inicio, inX, y);
    doc.text(row.stop, outX, y);
    doc.text(row.duracion, durX, y);

    return y + this.ROW_HEIGHT;
  }

  private static columns() {
    const usable = this.PAGE_WIDTH - this.MARGIN * 2;
    const dateW = 92;
    const timeW = 34;
    const dateX = this.MARGIN;
    const inX = dateX + dateW;
    const outX = inX + timeW;
    const durX = outX + timeW;
    return { dateX, inX, outX, durX };
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

  private static generateFilename(data: ReportData): string {
    const start = format(data.fechaInicio, "yyyy-MM-dd");
    const end = format(data.fechaFin, "yyyy-MM-dd");
    const nombre = data.usuario.nombre.replace(/[^a-zA-Z0-9]/g, "_");
    return `fichajes_${nombre}_${start}_${end}.pdf`;
  }

  // Build day blocks with correction tracking
  private static buildDayBlocks(
    registros: RegistroTiempo[],
    correctionsMap: Map<string, TimeCorrection[]>
  ) {
    type Segment = { start: Date; end?: Date; recordId?: string | null };
    type Row = {
      fecha: string;
      inicio: string;
      stop: string;
      duracion: string;
      isModified: boolean;
    };
    type DayBlock = {
      key: string;
      labelDate: string;
      rows: Row[];
      totalMs: number;
      totalLabel: string;
    };

    // Group by day using fechaEntrada
    const byDay = new Map<string, RegistroTiempo[]>();
    for (const r of registros ?? []) {
      const dIn = new Date(r.fechaEntrada);
      const key = `${dIn.getFullYear()}-${(dIn.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${dIn.getDate().toString().padStart(2, "0")}`;
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(r);
    }

    const fmtDay = (d: Date) => format(d, "EEE dd/MM/yyyy", { locale: es });
    const fmtTime = (d: Date) => format(d, "HH:mm:ss");
    const tolMs = 1000;
    const sameTs = (a: number, b: number) => Math.abs(a - b) <= tolMs;

    const blocks: DayBlock[] = [];
    const dayKeys = Array.from(byDay.keys()).sort();

    for (const key of dayKeys) {
      const list = byDay
        .get(key)!
        .slice()
        .sort(
          (a, b) =>
            new Date(a.fechaEntrada).getTime() -
            new Date(b.fechaEntrada).getTime()
        );

      const segments: Segment[] = [];
      const coveredTimes: number[] = [];
      const extraStopEvents: Date[] = [];

      // Process full records
      for (const r of list) {
        if (r.fechaSalida) {
          const start = new Date(r.fechaEntrada);
          const end = new Date(r.fechaSalida);
          const tIn = start.getTime();
          const tOut = end.getTime();

          if (tOut > tIn) {
            segments.push({ start, end, recordId: r.id });
            coveredTimes.push(tIn, tOut);
          } else if (tOut === tIn) {
            extraStopEvents.push(end);
          }
        }
      }

      // Process single timestamp records
      const singleEvents = list
        .filter((r) => !r.fechaSalida)
        .map((r) => ({
          time: new Date(r.fechaEntrada),
          recordId: r.id as string | null,
        }))
        .filter(
          (e) => !coveredTimes.some((ct) => sameTs(ct, e.time.getTime()))
        );

      const stopEvents = extraStopEvents.map((t) => ({
        time: t,
        recordId: null as string | null,
      }));

      const events = [...singleEvents, ...stopEvents].sort(
        (a, b) => a.time.getTime() - b.time.getTime()
      );

      // Deduplicate events
      const dedup: { time: Date; recordId: string | null }[] = [];
      for (const e of events) {
        const last = dedup.length ? dedup[dedup.length - 1] : null;
        if (!last || !sameTs(last.time.getTime(), e.time.getTime()))
          dedup.push(e);
      }

      // Pair sequentially
      for (let i = 0; i < dedup.length; i += 2) {
        const start = dedup[i];
        const end = dedup[i + 1];
        if (start && end) {
          if (end.time.getTime() > start.time.getTime()) {
            segments.push({
              start: start.time,
              end: end.time,
              recordId: start.recordId,
            });
          } else {
            segments.push({ start: start.time, recordId: start.recordId });
            i -= 1;
          }
        } else if (start && !end) {
          segments.push({ start: start.time, recordId: start.recordId });
        }
      }

      // Create rows
      const rows: Row[] = [];
      let totalMs = 0;
      for (const s of segments) {
        const f = fmtDay(s.start);
        const startStr = fmtTime(s.start);
        const isModified = s.recordId ? correctionsMap.has(s.recordId) : false;

        if (s.end) {
          const dur = s.end.getTime() - s.start.getTime();
          if (dur <= 0) continue;
          rows.push({
            fecha: f,
            inicio: startStr,
            stop: fmtTime(s.end),
            duracion: this.msLabel(dur),
            isModified,
          });
          totalMs += dur;
        } else {
          rows.push({
            fecha: f,
            inicio: startStr,
            stop: "—",
            duracion: "—",
            isModified,
          });
        }
      }

      // Sort rows by start time
      rows.sort((a, b) => {
        const ta = a.inicio === "—" ? 0 : Number(a.inicio.replace(/:/g, ""));
        const tb = b.inicio === "—" ? 0 : Number(b.inicio.replace(/:/g, ""));
        return ta - tb;
      });

      blocks.push({
        key,
        labelDate: fmtDay(new Date(key)),
        rows,
        totalMs,
        totalLabel: this.msLabel(totalMs),
      });
    }

    return blocks;
  }

  private static msLabel(ms: number) {
    const sign = ms < 0 ? "-" : "";
    ms = Math.abs(ms);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${sign}${pad(h)}:${pad(m)}:${pad(s)}`;
  }
}
