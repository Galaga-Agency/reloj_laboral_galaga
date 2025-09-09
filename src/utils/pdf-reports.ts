// utils/pdf-reports.ts
import jsPDF from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { RegistroTiempo } from "@/types";

export interface ReportData {
  usuario: { id: string; nombre: string; email: string; firstLogin?: boolean };
  registros: RegistroTiempo[];
  periodo: string;
  fechaInicio: Date;
  fechaFin: Date;
  // kept for compatibility with your hook
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

  static generateReport(data: ReportData): void {
    const doc = new jsPDF();
    let y = this.MARGIN;

    y = this.addHeader(doc, data, y);
    y = this.addTableHeader(doc, y);

    const days = this.buildDayBlocks(data.registros);

    let periodTotalMs = 0;

    for (const day of days) {
      for (const row of day.rows) {
        if (y > this.PAGE_HEIGHT - this.MARGIN - this.ROW_HEIGHT) {
          doc.addPage();
          y = this.MARGIN;
          y = this.addHeader(doc, data, y);
          y = this.addTableHeader(doc, y);
        }
        y = this.drawRow(doc, y, row.fecha, row.inicio, row.stop, row.duracion);
      }

      // ----- TOTAL DEL DÍA -----
      if (y > this.PAGE_HEIGHT - this.MARGIN - this.ROW_HEIGHT) {
        doc.addPage();
        y = this.MARGIN;
        y = this.addHeader(doc, data, y);
        y = this.addTableHeader(doc, y);
      }

      // padding above the total line
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

    // ----- TOTAL DEL PERÍODO -----
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

    this.addFooters(doc);
    doc.save(this.generateFilename(data));
  }

  // ---------- LAYOUT ----------
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

  private static drawRow(
    doc: jsPDF,
    y: number,
    fecha: string,
    inicio: string,
    stop: string,
    duracion: string
  ): number {
    const { dateX, inX, outX, durX } = this.columns();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(fecha, dateX, y);
    doc.text(inicio, inX, y);
    doc.text(stop, outX, y);
    doc.text(duracion, durX, y);
    return y + this.ROW_HEIGHT;
  }

  private static columns() {
    const usable = this.PAGE_WIDTH - this.MARGIN * 2; // 178
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

  // ---------- BUILD DAY BLOCKS (pair sequentially + treat zero-length full as STOP) ----------
  private static buildDayBlocks(registros: RegistroTiempo[]) {
    type Segment = { start: Date; end?: Date };
    type Row = {
      fecha: string;
      inicio: string;
      stop: string;
      duracion: string;
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
      const coveredTimes: number[] = []; // timestamps used by non-zero full segments
      const extraStopEvents: Date[] = []; // zero-length full records become STOP events

      // PASS 1: Full records
      for (const r of list) {
        if (r.fechaSalida) {
          const start = new Date(r.fechaEntrada);
          const end = new Date(r.fechaSalida);
          const tIn = start.getTime();
          const tOut = end.getTime();

          if (tOut > tIn) {
            // normal full segment
            segments.push({ start, end });
            coveredTimes.push(tIn, tOut);
          } else if (tOut === tIn) {
            // ZERO-LENGTH full record => this is actually a STOP event
            extraStopEvents.push(end);
          }
          // if tOut < tIn we ignore it as corrupted
        }
      }

      // PASS 2: Build event list from remaining single-timestamp records
      const events = list
        .filter((r) => !r.fechaSalida) // single timestamp rows
        .map((r) => new Date(r.fechaEntrada))
        .filter((t) => !coveredTimes.some((ct) => sameTs(ct, t.getTime())))
        .concat(extraStopEvents) // add converted stops from zero-length full records
        .sort((a, b) => a.getTime() - b.getTime());

      // Deduplicate events within tolerance (avoid double log at same ms)
      const dedup: Date[] = [];
      for (const t of events) {
        const last = dedup.length ? dedup[dedup.length - 1] : null;
        if (!last || !sameTs(last.getTime(), t.getTime())) dedup.push(t);
      }

      // Pair sequentially: [start, stop], [start, stop], ...
      for (let i = 0; i < dedup.length; i += 2) {
        const start = dedup[i];
        const end = dedup[i + 1];
        if (start && end) {
          if (end.getTime() > start.getTime()) {
            segments.push({ start, end });
          } else {
            // anomaly: stop before start -> treat start as open and re-use this 'end' as next start
            segments.push({ start });
            i -= 1;
          }
        } else if (start && !end) {
          segments.push({ start }); // open segment
        }
      }

      // Normalize → rows
      const rows: Row[] = [];
      let totalMs = 0;
      for (const s of segments) {
        const f = fmtDay(s.start);
        const startStr = fmtTime(s.start);
        if (s.end) {
          const dur = s.end.getTime() - s.start.getTime();
          if (dur <= 0) continue;
          rows.push({
            fecha: f,
            inicio: startStr,
            stop: fmtTime(s.end),
            duracion: this.msLabel(dur),
          });
          totalMs += dur;
        } else {
          rows.push({ fecha: f, inicio: startStr, stop: "—", duracion: "—" });
        }
      }

      // Sort rows by start time within the day (HH:mm:ss -> numeric)
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
