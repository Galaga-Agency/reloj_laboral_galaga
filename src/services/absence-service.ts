import { supabase } from "@/lib/supabase";
import type { Absence, AbsenceType, AbsenceStatus, Usuario } from "@/types";
import {
  differenceInMinutes,
  parse,
  format,
} from "date-fns";
import jsPDF from "jspdf";
import { es } from "date-fns/locale";
import {
  AbsenceStatisticsCalculator,
  type AbsenceStats,
} from "@/utils/absence-statistics";

export class AbsenceService {
  static async createAbsence(data: {
    usuarioId: string;
    fechas: Date[];
    tipoAusencia: AbsenceType;
    horaInicio: string;
    horaFin: string;
    razon: string;
    comentarios?: string;
    file?: File;
    createdBy: string;
    isAdmin: boolean;
  }): Promise<Absence> {
    const startTime = parse(data.horaInicio, "HH:mm", data.fechas[0]);
    const endTime = parse(data.horaFin, "HH:mm", data.fechas[0]);
    const duracionMinutos = differenceInMinutes(endTime, startTime);

    const { data: result, error } = await supabase
      .from("ausencias")
      .insert({
        usuario_id: data.usuarioId,
        fechas: data.fechas.map((d) => d.toISOString().split("T")[0]),
        tipo_ausencia: data.tipoAusencia,
        hora_inicio: data.horaInicio,
        hora_fin: data.horaFin,
        duracion_minutos: duracionMinutos,
        razon: data.razon,
        comentarios: data.comentarios || null,
        estado: data.isAdmin ? "aprobada": "pendiente",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: data.createdBy,
      })
      .select()
      .single();

    if (error) throw new Error(`Error creating absence: ${error.message}`);

    return this.mapToAbsence(result);
  }

  static async createAbsenceBlock(data: {
    usuarioId: string;
    fechas: Date[]; // <-- multiple dates
    tipoAusencia: AbsenceType;
    horaInicio: string;
    horaFin: string;
    razon: string;
    comentarios?: string;
    createdBy: string;
  }): Promise<Absence> {
    const { data: result, error } = await supabase
      .from("ausencias")
      .insert({
        usuario_id: data.usuarioId,
        fechas: data.fechas.map((d) => d.toISOString().split("T")[0]), // <-- array of dates
        tipo_ausencia: data.tipoAusencia,
        hora_inicio: data.horaInicio,
        hora_fin: data.horaFin,
        razon: data.razon,
        comentarios: data.comentarios || null,
        estado: "pendiente",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: data.createdBy,
      })
      .select()
      .single();

    if (error)
      throw new Error(`Error creating absence block: ${error.message}`);

    return this.mapToAbsence(result);
  }

  static async getAbsencesByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    includeScheduledDaysOff: boolean = false
  ): Promise<Absence[]> {
    let query = supabase
      .from("ausencias")
      .select("*")
      .eq("usuario_id", userId)
      .order("fechas", { ascending: false });

    if (!includeScheduledDaysOff) {
      query = query.neq("tipo_ausencia", "dia_libre");
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching absences: ${error.message}`);
    }

    const allAbsences = (data || []).map(this.mapToAbsence);

    return allAbsences.filter((a) =>
      a.fechas.some((f) => {
        if (startDate && f < startDate) return false;
        if (endDate && f > endDate) return false;
        return true;
      })
    );
  }

  static async getAllAbsences(
    startDate?: Date,
    endDate?: Date,
    includeScheduledDaysOff: boolean = false
  ): Promise<Absence[]> {
    let query = supabase
      .from("ausencias")
      .select("*")
      .order("fechas", { ascending: false });

    if (!includeScheduledDaysOff) {
      query = query.neq("tipo_ausencia", "dia_libre");
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching all absences: ${error.message}`);
    }

    const allAbsences = (data || []).map(this.mapToAbsence);

    return allAbsences.filter((a) =>
      a.fechas.some((f) => {
        if (startDate && f < startDate) return false;
        if (endDate && f > endDate) return false;
        return true;
      })
    );
  }

  static async updateAbsenceStatus(
    absenceId: string,
    status: AbsenceStatus,
    adminId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("ausencias")
      .update({
        estado: status,
        aprobado_por: adminId,
        fecha_aprobacion: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", absenceId);

    if (error) {
      throw new Error(`Error updating absence status: ${error.message}`);
    }
  }

  static async getAbsenceForDate(
    userId: string,
    date: Date
  ): Promise<Absence | null> {
    const dateStr = date.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("ausencias")
      .select("*")
      .eq("usuario_id", userId)
      .contains("fechas", [dateStr])
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error fetching absence for date: ${error.message}`);
    }

    return data ? this.mapToAbsence(data) : null;
  }

  private static mapToAbsence(row: any): Absence {
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      fechas: (row.fechas || []).map((f: string) => new Date(f)),
      tipoAusencia: row.tipo_ausencia,
      horaInicio: row.hora_inicio,
      horaFin: row.hora_fin,
      duracionMinutos: row.duracion_minutos,
      razon: row.razon,
      comentarios: row.comentarios,
      estado: row.estado,
      aprobadoPor: row.aprobado_por,
      fechaAprobacion: row.fecha_aprobacion
        ? new Date(row.fecha_aprobacion)
        : undefined,
      adjuntoUrl: row.adjunto_url,
      adjuntoNombre: row.adjunto_nombre,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      editedBy: row.edited_by,
      editedAt: row.edited_at ? new Date(row.edited_at) : undefined,
      editedFecha: row.edited_fecha ? new Date(row.edited_fecha) : undefined,
      editedHoraInicio: row.edited_hora_inicio,
      editedHoraFin: row.edited_hora_fin,
      editedRazon: row.edited_razon,
      editedComentarios: row.edited_comentarios,
    };
  }

  static getAbsenceReasons(): Array<{ value: string; label: string }> {
    return [
      { value: "tardanza_trafico", label: "Tardanza - Tráfico" },
      {
        value: "tardanza_transporte",
        label: "Tardanza - Problema de transporte",
      },
      { value: "tardanza_personal", label: "Tardanza - Motivo personal" },
      { value: "cita_medica", label: "Cita médica" },
      { value: "cita_banco", label: "Gestión bancaria" },
      { value: "cita_oficial", label: "Gestión administrativa" },
      { value: "emergencia_familiar", label: "Emergencia familiar" },
      { value: "enfermedad", label: "Enfermedad" },
      { value: "otro", label: "Otro motivo" },
    ];
  }

  static async generateUserAbsenceReport(
    usuario: Usuario,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const absences = await this.getAbsencesByUser(
      usuario.id,
      startDate,
      endDate,
      true
    );

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
    let y = 15;

    y = this.addReportHeader(doc, usuario, startDate, endDate, y);
    y = this.addReportSummary(doc, realAbsences, scheduledDaysOff, y);

    if (scheduledDaysOff.length > 0) {
      y = this.addScheduledDaysOffSection(doc, scheduledDaysOff, y);
    }

    if (realAbsences.length > 0) {
      y = this.addAbsencesTable(doc, realAbsences, y);
    }

    this.addReportFooters(doc);
    doc.save(this.generateReportFilename(usuario, startDate, endDate));
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
    doc.text("GALAGA AGENCY", 15, y);
    doc.setFontSize(14);
    doc.text("INFORME DE AUSENCIAS", 15, y + 8);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Empleado: ${usuario.nombre}`, 15, y);
    doc.text(`Email: ${usuario.email}`, 115, y);
    y += 8;

    const periodo = `${format(startDate, "dd/MM/yyyy", {
      locale: es,
    })} - ${format(endDate, "dd/MM/yyyy", { locale: es })}`;
    doc.text(`Período: ${periodo}`, 15, y);
    doc.text(
      `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`,
      115,
      y
    );
    y += 15;

    doc.setLineWidth(0.5);
    doc.line(15, y, 195, y);
    y += 10;

    return y;
  }

  private static addReportSummary(
    doc: jsPDF,
    realAbsences: Absence[],
    scheduledDaysOff: Absence[],
    y: number
  ): number {
    const totalMinutes = realAbsences.reduce(
      (sum, a) => sum + a.duracionMinutos,
      0
    );
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const pendingCount = realAbsences.filter(
      (a) => a.estado === "pendiente"
    ).length;
    const approvedCount = realAbsences.filter(
      (a) => a.estado === "aprobada"
    ).length;
    const rejectedCount = realAbsences.filter(
      (a) => a.estado === "rechazada"
    ).length;

    doc.setFillColor(240, 240, 240);
    doc.rect(15, y, 180, 37, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, y, 180, 37, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RESUMEN DE AUSENCIAS", 20, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total ausencias: ${realAbsences.length}`, 20, y + 15);
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
    if (y + 40 > 282) {
      doc.addPage();
      y = 15;
    }

    doc.setFillColor(200, 230, 255);
    doc.rect(15, y, 180, 10, "F");
    doc.setDrawColor(100, 150, 200);
    doc.rect(15, y, 180, 10, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DÍAS LIBRES PROGRAMADOS", 17, y + 7);

    y += 12;

    const allDates = scheduledDaysOff.flatMap((a) => a.fechas);
    const sortedDays = allDates.sort((a, b) => a.getTime() - b.getTime());

    sortedDays.forEach((day, index) => {
      if (y + 8 > 282) {
        doc.addPage();
        y = 15;
      }

      if (index % 2 === 0) {
        doc.setFillColor(245, 250, 255);
        doc.rect(15, y, 180, 6, "F");
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        format(day, "EEEE, dd 'de' MMMM yyyy", { locale: es }),
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
      y = 15;
    }

    doc.setFillColor(50, 50, 50);
    doc.rect(15, y, 180, 10, "F");

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
        y = 15;
      }

      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y, 180, 8, "F");
      }

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.rect(15, y, 180, 8, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      x = 17;
      doc.text(format(absence.fecha, "dd/MM/yyyy", { locale: es }), x, y + 5.5);

      x += 30;
      const tipoLabel = this.getAbsenceTypeShortLabel(absence.tipoAusencia);
      doc.text(tipoLabel, x, y + 5.5);

      x += 45;
      doc.text(`${absence.horaInicio} - ${absence.horaFin}`, x, y + 5.5);

      x += 35;
      const hours = Math.floor(absence.duracionMinutos / 60);
      const minutes = absence.duracionMinutos % 60;
      doc.text(`${hours}h ${minutes}m`, x, y + 5.5);

      x += 30;
      const estadoLabel = this.getEstadoShortLabel(absence.estado);
      doc.text(estadoLabel, x, y + 5.5);

      y += 8;
    }

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

  private static addReportFooters(doc: jsPDF) {
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

  private static generateReportFilename(
    usuario: Usuario,
    startDate: Date,
    endDate: Date
  ): string {
    const nombre = usuario.nombre.replace(/[^a-zA-Z0-9]/g, "_");
    const start = format(startDate, "yyyy-MM-dd");
    const end = format(endDate, "yyyy-MM-dd");
    return `informe_ausencias_${nombre}_${start}_${end}.pdf`;
  }

  static async generateCompanyAbsenceReport(
    startDate: Date,
    endDate: Date,
    users: Usuario[]
  ): Promise<void> {
    const absences = await this.getAllAbsences(startDate, endDate, true);

    if (absences.length === 0) {
      throw new Error(
        "No hay ausencias registradas para el período seleccionado"
      );
    }

    const realAbsences = absences.filter((a) => a.tipoAusencia !== "dia_libre");
    const scheduledDaysOff = absences.filter(
      (a) => a.tipoAusencia === "dia_libre"
    );

    const stats = AbsenceStatisticsCalculator.calculate(realAbsences, {});

    const doc = new jsPDF();
    let y = 15;

    y = this.addCompanyReportHeader(doc, startDate, endDate, y);
    y = this.addCompanyReportSummary(doc, stats, scheduledDaysOff.length, y);
    y = this.addCompanyReasonStatistics(doc, stats, y);
    y = this.addCompanyTypeStatistics(doc, stats, y);
    y = this.addCompanyAbsencesByUser(doc, realAbsences, users, y);

    this.addReportFooters(doc);
    doc.save(this.generateCompanyReportFilename(startDate, endDate));
  }

  private static addCompanyReportHeader(
    doc: jsPDF,
    startDate: Date,
    endDate: Date,
    y: number
  ): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("GALAGA AGENCY", 15, y);
    doc.setFontSize(14);
    doc.text("INFORME CONSOLIDADO DE AUSENCIAS", 15, y + 8);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const periodo = `${format(startDate, "dd/MM/yyyy", {
      locale: es,
    })} - ${format(endDate, "dd/MM/yyyy", { locale: es })}`;
    doc.text(`Período: ${periodo}`, 15, y);
    doc.text(
      `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`,
      115,
      y
    );
    y += 15;

    doc.setLineWidth(0.5);
    doc.line(15, y, 195, y);
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
    doc.rect(15, y, 180, 42, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, y, 180, 42, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RESUMEN GENERAL", 20, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total de ausencias: ${stats.totalAbsences}`, 20, y + 15);
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

    doc.text(`Pendientes: ${stats.pendingCount}`, 20, y + 29);
    doc.text(`Aprobadas: ${stats.approvedCount}`, 75, y + 29);
    doc.text(`Rechazadas: ${stats.rejectedCount}`, 135, y + 29);

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
      y = 15;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("ANÁLISIS POR MOTIVO DE AUSENCIA", 15, y);
    y += 8;

    doc.setFillColor(50, 50, 50);
    doc.rect(15, y, 180, 8, "F");

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
        y = 15;
      }

      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y, 180, 8, "F");
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
      y = 15;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("ANÁLISIS POR TIPO DE AUSENCIA", 15, y);
    y += 8;

    doc.setFillColor(50, 50, 50);
    doc.rect(15, y, 180, 8, "F");

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
        y = 15;
      }

      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y, 180, 8, "F");
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
      y = 15;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DETALLE POR EMPLEADO", 15, y);
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
    doc.rect(15, y, 180, 8, "F");

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
        y = 15;
      }

      const user = users.find((u) => u.id === userId);
      const totalMinutes = userAbsences.reduce(
        (sum, a) => sum + a.duracionMinutos,
        0
      );
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
      const pending = userAbsences.filter(
        (a) => a.estado === "pendiente"
      ).length;

      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y, 180, 8, "F");
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

  private static generateCompanyReportFilename(
    startDate: Date,
    endDate: Date
  ): string {
    const start = format(startDate, "yyyy-MM-dd");
    const end = format(endDate, "yyyy-MM-dd");
    return `informe_consolidado_ausencias_${start}_${end}.pdf`;
  }

  static async createHolidayForAllUsers(
    date: Date,
    holidayName: string,
    adminId: string,
    adminName: string
  ): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const { data: users, error: usersError } = await supabase
        .from("usuarios")
        .select("id")
        .eq("is_active", true);

      if (usersError) {
        return { success: false, count: 0, error: usersError.message };
      }

      if (!users || users.length === 0) {
        return { success: false, count: 0, error: "No active users found" };
      }

      const absences = users.map((user) => ({
        usuario_id: user.id,
        fechas: [format(date, "yyyy-MM-dd")],
        tipo_ausencia: "dia_libre",
        hora_inicio: "00:00",
        hora_fin: "23:59",
        duracion_minutos: 1440,
        razon: holidayName,
        comentarios: `Festivo creado automáticamente por ${adminName}`,
        estado: "aprobada",
        aprobado_por: adminId,
        fecha_aprobacion: new Date().toISOString(),
        created_by: adminId,
      }));

      const { error: insertError } = await supabase
        .from("ausencias")
        .insert(absences);

      if (insertError) {
        return { success: false, count: 0, error: insertError.message };
      }

      return { success: true, count: users.length };
    } catch (error) {
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async deleteHolidayForAllUsers(
    date: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const dateStr = format(date, "yyyy-MM-dd");

      const { error } = await supabase
        .from("ausencias")
        .delete()
        .contains("fechas", [dateStr])
        .eq("tipo_ausencia", "dia_libre");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getHolidays(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; name: string }>> {
    try {
      const { data, error } = await supabase
        .from("ausencias")
        .select("fechas, razon")
        .eq("tipo_ausencia", "dia_libre")
        .gte("fechas", format(startDate, "yyyy-MM-dd"))
        .lte("fechas", format(endDate, "yyyy-MM-dd"))
        .order("fechas", { ascending: true });

      if (error) {
        throw new Error(`Error fetching holidays: ${error.message}`);
      }

      const uniqueHolidays = new Map<string, string>();
      (data || []).forEach((item) => {
        (item.fechas || []).forEach((f: string) => {
          if (!uniqueHolidays.has(f)) {
            uniqueHolidays.set(f, item.razon);
          }
        });
      });

      return Array.from(uniqueHolidays.entries()).map(([date, name]) => ({
        date,
        name,
      }));
    } catch (error) {
      console.error("Error loading holidays:", error);
      return [];
    }
  }

  static async updateAbsence(
    absenceId: string,
    updates: {
      fechas?: Date[]; // ✅ array of dates, same as createAbsence
      razon?: string;
      horaInicio?: string;
      horaFin?: string;
      tipoAusencia?: string;
      comentarios?: string;
    },
    editor: { id: string; isAdmin: boolean }
  ): Promise<void> {
    const patch: any = {
      updated_at: new Date().toISOString(),
    };

    if (editor.isAdmin) {
      patch.estado = "aprobada";
      patch.aprobado_por = editor.id;
      patch.fecha_aprobacion = new Date().toISOString();
      patch.edited_by = editor.id;
      patch.edited_at = new Date().toISOString();

      if (updates.fechas) {
        patch.edited_fecha = updates.fechas[0].toISOString().split("T")[0]; // 👈 keep first date for traceability
      }
      if (updates.horaInicio) patch.edited_hora_inicio = updates.horaInicio;
      if (updates.horaFin) patch.edited_hora_fin = updates.horaFin;
      if (updates.razon) patch.edited_razon = updates.razon;
      if (updates.comentarios) patch.edited_comentarios = updates.comentarios;
    } else {
      patch.estado = "pendiente";
      patch.aprobado_por = null;
      patch.fecha_aprobacion = null;
    }

    // ✅ store full array of dates
    if (updates.fechas) {
      patch.fechas = updates.fechas.map((d) => d.toISOString().split("T")[0]);
    }
    if (updates.razon) patch.razon = updates.razon;
    if (updates.horaInicio) patch.hora_inicio = updates.horaInicio;
    if (updates.horaFin) patch.hora_fin = updates.horaFin;
    if (updates.tipoAusencia) patch.tipo_ausencia = updates.tipoAusencia;
    if (updates.comentarios) patch.comentarios = updates.comentarios;

    const { error } = await supabase
      .from("ausencias")
      .update(patch)
      .eq("id", absenceId);

    if (error) throw new Error(`Error updating absence: ${error.message}`);
  }

  static async deleteAbsence(absenceId: string): Promise<void> {
    const { error } = await supabase
      .from("ausencias")
      .delete()
      .eq("id", absenceId);

    if (error) {
      throw new Error(`Error deleting absence: ${error.message}`);
    }
  }
}
