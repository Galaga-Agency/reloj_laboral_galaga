import jsPDF from "jspdf";
import { format, differenceInMilliseconds } from "date-fns";
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

interface WorkSegment {
  entrada: Date;
  salida?: Date;
  duracion: number;
  isModified: boolean;
  recordIds: string[];
}

interface DayData {
  date: Date;
  segments: WorkSegment[];
  totalMs: number;
}

export class PDFReportGenerator {
  private static readonly MARGIN = 15;
  private static readonly PAGE_WIDTH = 210;
  private static readonly PAGE_HEIGHT = 297;
  private static readonly LINE_HEIGHT = 5;

  private static readonly TABLE_WIDTH = 180;
  private static readonly COL_DATE = 35;
  private static readonly COL_ENTRADA = 30;
  private static readonly COL_SALIDA = 30;
  private static readonly COL_DURACION = 30;
  private static readonly COL_TOTAL = 35;

  static async generateReport(data: ReportData): Promise<void> {
    const doc = new jsPDF();
    let y = this.MARGIN;

    const recordIds = data.registros.map((r) => r.id);
    const correctionsMap =
      await TimeCorrectionsService.getCorrectionsForRecords(recordIds);
    const hasCorrections = correctionsMap.size > 0;

    y = this.addHeader(doc, data, y);
    y = this.addSummary(doc, data, y);

    if (hasCorrections) {
      y = this.addCorrectionsNotice(doc, y, correctionsMap.size);
    }

    const dailyData = this.processDailyData(data.registros, correctionsMap);
    y = this.addTableHeader(doc, y);

    let grandTotalMs = 0;

    for (const dayData of dailyData) {
      const estimatedHeight = (dayData.segments.length + 1) * 7 + 15;
      if (y + estimatedHeight > this.PAGE_HEIGHT - this.MARGIN) {
        doc.addPage();
        y = this.MARGIN;
        y = this.addTableHeader(doc, y);
      }

      y = this.addDayRow(doc, dayData, y);
      grandTotalMs += dayData.totalMs;
    }

    y = this.addGrandTotal(doc, grandTotalMs, y);

    if (hasCorrections) {
      y = this.addCorrectionsAppendix(doc, y, correctionsMap);
    }

    this.addFooters(doc);
    doc.save(this.generateFilename(data));
  }

  private static addHeader(doc: jsPDF, data: ReportData, y: number): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("GALAGA AGENCY", this.MARGIN, y);
    doc.setFontSize(14);
    doc.text("INFORME DE FICHAJES", this.MARGIN, y + 8);
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

  private static addSummary(doc: jsPDF, data: ReportData, y: number): number {
    doc.setFillColor(240, 240, 240);
    doc.rect(this.MARGIN, y, this.TABLE_WIDTH, 25, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(this.MARGIN, y, this.TABLE_WIDTH, 25, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RESUMEN DEL PERÍODO", this.MARGIN + 5, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Días trabajados: ${data.estadisticas.diasTrabajados}`,
      this.MARGIN + 5,
      y + 15
    );
    doc.text(
      `Tiempo total: ${data.estadisticas.tiempoTotal}`,
      this.MARGIN + 60,
      y + 15
    );
    doc.text(
      `Promedio diario: ${data.estadisticas.promedioDiario}`,
      this.MARGIN + 120,
      y + 15
    );
    doc.text(
      `Total registros: ${data.registros.length}`,
      this.MARGIN + 5,
      y + 22
    );

    return y + 35;
  }

  private static addTableHeader(doc: jsPDF, y: number): number {
    doc.setFillColor(50, 50, 50);
    doc.rect(this.MARGIN, y, this.TABLE_WIDTH, 10, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    let x = this.MARGIN + 2;
    doc.text("FECHA", x, y + 7);
    x += this.COL_DATE;
    doc.text("ENTRADA", x, y + 7);
    x += this.COL_ENTRADA;
    doc.text("SALIDA", x, y + 7);
    x += this.COL_SALIDA;
    doc.text("DURACIÓN", x, y + 7);
    x += this.COL_DURACION;
    doc.text("TOTAL DÍA", x, y + 7);

    doc.setTextColor(0, 0, 0);

    return y + 12;
  }

  private static addDayRow(doc: jsPDF, dayData: DayData, y: number): number {
    const startY = y;
    const dateStr = format(dayData.date, "dd/MM/yyyy EEE", { locale: es });

    for (let i = 0; i < dayData.segments.length; i++) {
      const segment = dayData.segments[i];
      const isFirstSegment = i === 0;

      const rowIndex = Math.floor((y - startY) / 7);
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(this.MARGIN, y, this.TABLE_WIDTH, 7, "F");
      }

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.rect(this.MARGIN, y, this.TABLE_WIDTH, 7, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      let x = this.MARGIN + 2;

      if (isFirstSegment) {
        doc.text(dateStr, x, y + 5);
      }
      x += this.COL_DATE;

      const entradaText =
        format(segment.entrada, "HH:mm:ss") + (segment.isModified ? " *" : "");
      doc.text(entradaText, x, y + 5);
      x += this.COL_ENTRADA;

      const salidaText = segment.salida
        ? format(segment.salida, "HH:mm:ss") + (segment.isModified ? " *" : "")
        : "—";
      doc.text(salidaText, x, y + 5);
      x += this.COL_SALIDA;

      const duracionText =
        segment.duracion > 0 ? this.formatDuration(segment.duracion) : "—";
      doc.text(duracionText, x, y + 5);
      x += this.COL_DURACION;

      if (i === dayData.segments.length - 1) {
        doc.setFont("helvetica", "bold");
        doc.text(this.formatDuration(dayData.totalMs), x, y + 5);
        doc.setFont("helvetica", "normal");
      }

      y += 7;
    }

    return y + 2;
  }

  private static addGrandTotal(
    doc: jsPDF,
    grandTotalMs: number,
    y: number
  ): number {
    if (y + 15 > this.PAGE_HEIGHT - this.MARGIN) {
      doc.addPage();
      y = this.MARGIN;
    }

    y += 5;

    doc.setFillColor(50, 50, 50);
    doc.rect(this.MARGIN, y, this.TABLE_WIDTH, 10, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL DEL PERÍODO:", this.MARGIN + 5, y + 7);
    doc.text(
      this.formatDuration(grandTotalMs),
      this.MARGIN + this.TABLE_WIDTH - 40,
      y + 7
    );

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    return y + 20;
  }

  private static processDailyData(
    registros: RegistroTiempo[],
    correctionsMap: Map<string, TimeCorrection[]>
  ): DayData[] {
    const dailyRecords = new Map<string, RegistroTiempo[]>();

    for (const registro of registros) {
      const dayKey = format(new Date(registro.fecha), "yyyy-MM-dd");
      if (!dailyRecords.has(dayKey)) {
        dailyRecords.set(dayKey, []);
      }
      dailyRecords.get(dayKey)!.push(registro);
    }

    const dailyData: DayData[] = [];

    for (const [dayKey, dayRecords] of dailyRecords.entries()) {
      const date = new Date(dayKey);
      const segments = this.processWorkSegments(dayRecords, correctionsMap);
      const totalMs = segments.reduce(
        (sum, segment) => sum + segment.duracion,
        0
      );

      dailyData.push({
        date,
        segments,
        totalMs,
      });
    }

    return dailyData.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private static processWorkSegments(
    dayRecords: RegistroTiempo[],
    correctionsMap: Map<string, TimeCorrection[]>
  ): WorkSegment[] {
    const sortedRecords = dayRecords.sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    const segments: WorkSegment[] = [];
    let currentEntrada: { time: Date; recordId: string } | null = null;

    for (const record of sortedRecords) {
      const isModified = correctionsMap.has(record.id);

      if (record.tipoRegistro === "entrada") {
        if (currentEntrada) {
          segments.push({
            entrada: currentEntrada.time,
            salida: undefined,
            duracion: 0,
            isModified: correctionsMap.has(currentEntrada.recordId),
            recordIds: [currentEntrada.recordId],
          });
        }

        currentEntrada = {
          time: new Date(record.fecha),
          recordId: record.id,
        };
      } else if (record.tipoRegistro === "salida" && currentEntrada) {
        const salida = new Date(record.fecha);
        const duracion = differenceInMilliseconds(salida, currentEntrada.time);

        segments.push({
          entrada: currentEntrada.time,
          salida,
          duracion: Math.max(0, duracion),
          isModified: isModified || correctionsMap.has(currentEntrada.recordId),
          recordIds: [currentEntrada.recordId, record.id],
        });

        currentEntrada = null;
      }
    }

    if (currentEntrada) {
      segments.push({
        entrada: currentEntrada.time,
        salida: undefined,
        duracion: 0,
        isModified: correctionsMap.has(currentEntrada.recordId),
        recordIds: [currentEntrada.recordId],
      });
    }

    return segments;
  }

  private static addCorrectionsNotice(
    doc: jsPDF,
    y: number,
    correctionCount: number
  ): number {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(
      `(*) Los registros marcados con asterisco han sido modificados administrativamente. Ver detalles al final del informe.`,
      this.MARGIN,
      y
    );
    doc.setFont("helvetica", "normal");
    return y + 10;
  }

  private static addCorrectionsAppendix(
    doc: jsPDF,
    y: number,
    correctionsMap: Map<string, TimeCorrection[]>
  ): number {
    const estimatedHeight = correctionsMap.size * 30 + 40;
    if (y + estimatedHeight > this.PAGE_HEIGHT - this.MARGIN) {
      doc.addPage();
      y = this.MARGIN;
    }

    y += 10;

    doc.setFillColor(50, 50, 50);
    doc.rect(this.MARGIN, y, this.TABLE_WIDTH, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(
      "REGISTRO DE CORRECCIONES ADMINISTRATIVAS",
      this.MARGIN + 5,
      y + 6
    );

    doc.setTextColor(0, 0, 0);
    y += 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    let correctionNumber = 1;
    for (const [recordId, corrections] of correctionsMap.entries()) {
      for (const correction of corrections) {
        if (y + 30 > this.PAGE_HEIGHT - this.MARGIN) {
          doc.addPage();
          y = this.MARGIN;
        }

        doc.setFont("helvetica", "bold");
        doc.text(
          `${correctionNumber}. Corrección del ${format(
            correction.fechaCorreccion,
            "dd/MM/yyyy HH:mm",
            { locale: es }
          )}`,
          this.MARGIN,
          y
        );
        y += 5;

        doc.setFont("helvetica", "normal");

        // Show who edited
        const editorText =
          correction.usuarioId === correction.adminUserId
            ? `Editado por: ${correction.adminUserName} (Usuario)`
            : `Editado por: ${correction.adminUserName} (Administrador)`;

        doc.text(editorText, this.MARGIN + 5, y);
        y += 4;

        // Show validation info if available
        if (correction.revisadoPor && correction.revisadoPorNombre) {
          doc.text(
            `Validado por: ${correction.revisadoPorNombre} (Administrador)`,
            this.MARGIN + 5,
            y
          );
          y += 4;

          if (correction.fechaRevision) {
            doc.text(
              `Fecha de validación: ${format(
                correction.fechaRevision,
                "dd/MM/yyyy HH:mm",
                { locale: es }
              )}`,
              this.MARGIN + 5,
              y
            );
            y += 4;
          }
        }

        // Show what was changed
        doc.text(
          `Campo modificado: ${this.getFieldDisplayName(
            correction.campoModificado
          )}`,
          this.MARGIN + 5,
          y
        );
        y += 4;

        doc.text(
          `Valor anterior: ${this.formatCorrectionValue(
            correction.valorAnterior
          )}`,
          this.MARGIN + 5,
          y
        );
        y += 4;

        doc.text(
          `Valor nuevo: ${this.formatCorrectionValue(correction.valorNuevo)}`,
          this.MARGIN + 5,
          y
        );
        y += 4;

        doc.text(`Motivo: ${correction.razon}`, this.MARGIN + 5, y);
        y += 4;

        // Show status
        if (correction.estado) {
          const estadoText =
            correction.estado === "aprobado"
              ? "Estado: Aprobado"
              : correction.estado === "rechazado"
              ? "Estado: Rechazado"
              : "Estado: Pendiente de aprobación";

          doc.setFont("helvetica", "italic");
          doc.text(estadoText, this.MARGIN + 5, y);
          doc.setFont("helvetica", "normal");
          y += 4;
        }

        y += 4;
        correctionNumber++;
      }
    }

    return y;
  }

  private static formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  private static getFieldDisplayName(field: string): string {
    const names: Record<string, string> = {
      fecha: "Fecha y hora",
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
    return `informe_${nombre}_${start}_${end}.pdf`;
  }
}
