import { supabase } from "@/lib/supabase";
import type { Absence, AbsenceType, AbsenceStatus, Usuario } from "@/types";
import {
  differenceInMinutes,
  parse,
  format,
  startOfMonth,
  endOfMonth,
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
    fecha: Date;
    tipoAusencia: AbsenceType;
    horaInicio: string;
    horaFin: string;
    razon: string;
    comentarios?: string;
    file?: File;
  }): Promise<Absence> {
    const startTime = parse(data.horaInicio, "HH:mm", data.fecha);
    const endTime = parse(data.horaFin, "HH:mm", data.fecha);
    const duracionMinutos = differenceInMinutes(endTime, startTime);

    let adjuntoUrl: string | null = null;
    let adjuntoNombre: string | null = null;

    if (data.file) {
      const fileExt = data.file.name.split(".").pop();
      const fileName = `${data.usuarioId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("absence-documents")
        .upload(fileName, data.file);

      if (uploadError) {
        throw new Error(`Error subiendo archivo: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("absence-documents")
        .getPublicUrl(fileName);

      adjuntoUrl = urlData.publicUrl;
      adjuntoNombre = data.file.name;
    }

    const { data: result, error } = await supabase
      .from("ausencias")
      .insert({
        usuario_id: data.usuarioId,
        fecha: data.fecha.toISOString().split("T")[0],
        tipo_ausencia: data.tipoAusencia,
        hora_inicio: data.horaInicio,
        hora_fin: data.horaFin,
        duracion_minutos: duracionMinutos,
        razon: data.razon,
        comentarios: data.comentarios || null,
        adjunto_url: adjuntoUrl,
        adjunto_nombre: adjuntoNombre,
        estado: "pendiente",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating absence: ${error.message}`);
    }

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
      .order("fecha", { ascending: false });

    if (startDate) {
      query = query.gte("fecha", startDate.toISOString().split("T")[0]);
    }

    if (endDate) {
      query = query.lte("fecha", endDate.toISOString().split("T")[0]);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching absences: ${error.message}`);
    }

    const realAbsences = (data || []).map(this.mapToAbsence);

    if (!includeScheduledDaysOff) {
      return realAbsences;
    }

    const { data: workSettings } = await supabase
      .from("user_work_settings")
      .select("dias_libres")
      .eq("usuario_id", userId)
      .single();

    if (
      !workSettings ||
      !workSettings.dias_libres ||
      workSettings.dias_libres.length === 0
    ) {
      return realAbsences;
    }

    const scheduledDaysOff = workSettings.dias_libres
      .map((dateStr: string) => new Date(dateStr))
      .filter((date: Date) => {
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
        return true;
      })
      .map(
        (date: Date) =>
          ({
            id: `scheduled-${userId}-${date.toISOString().split("T")[0]}`,
            usuarioId: userId,
            fecha: date,
            tipoAusencia: "dia_libre" as const,
            horaInicio: "00:00",
            horaFin: "23:59",
            duracionMinutos: 1439,
            razon: "dia_libre",
            estado: "programada" as const,
            createdAt: date,
            updatedAt: date,
          } as Absence)
      );

    return [...realAbsences, ...scheduledDaysOff].sort(
      (a, b) => b.fecha.getTime() - a.fecha.getTime()
    );
  }

  static async getAllAbsences(
    startDate?: Date,
    endDate?: Date,
    includeScheduledDaysOff: boolean = false
  ): Promise<Absence[]> {
    console.log("🔍 getAllAbsences called with:", {
      startDate,
      endDate,
      includeScheduledDaysOff,
    });

    let query = supabase
      .from("ausencias")
      .select("*")
      .order("fecha", { ascending: false });

    if (startDate) {
      query = query.gte("fecha", startDate.toISOString().split("T")[0]);
    }

    if (endDate) {
      query = query.lte("fecha", endDate.toISOString().split("T")[0]);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching all absences: ${error.message}`);
    }

    const realAbsences = (data || []).map(this.mapToAbsence);
    console.log("✅ Real absences fetched:", realAbsences.length);

    if (!includeScheduledDaysOff) {
      console.log(
        "⚠️ includeScheduledDaysOff is FALSE, returning only real absences"
      );
      return realAbsences;
    }

    console.log("📅 Fetching work settings for scheduled days off...");

    const {
      data: allWorkSettings,
      error: settingsError,
      count,
    } = await supabase
      .from("user_work_settings")
      .select("usuario_id, dias_libres", { count: "exact" });

    console.log("📊 Work settings query details:", {
      data: allWorkSettings,
      error: settingsError,
      count: count,
      actualLength: allWorkSettings?.length,
      userIds: allWorkSettings?.map((s) => ({
        userId: s.usuario_id,
        diasLibresCount: s.dias_libres?.length || 0,
      })),
    });

    if (!allWorkSettings || allWorkSettings.length === 0) {
      console.log("⚠️ No work settings found");
      return realAbsences;
    }

    const allScheduledDaysOff: Absence[] = [];

    allWorkSettings.forEach((settings: any) => {
      console.log(`👤 Processing user ${settings.usuario_id}:`, {
        dias_libres: settings.dias_libres,
        count: settings.dias_libres?.length || 0,
      });

      if (!settings.dias_libres || settings.dias_libres.length === 0) {
        console.log(`  ⏭️ No dias_libres for user ${settings.usuario_id}`);
        return;
      }

      const userScheduledDays = settings.dias_libres
        .map((dateStr: string) => new Date(dateStr))
        .filter((date: Date) => {
          const inRange =
            (!startDate || date >= startDate) && (!endDate || date <= endDate);
          console.log(
            `  📆 Date ${date.toISOString().split("T")[0]} in range?`,
            inRange
          );
          return inRange;
        })
        .map(
          (date: Date) =>
            ({
              id: `scheduled-${settings.usuario_id}-${
                date.toISOString().split("T")[0]
              }`,
              usuarioId: settings.usuario_id,
              fecha: date,
              tipoAusencia: "dia_libre" as const,
              horaInicio: "00:00",
              horaFin: "23:59",
              duracionMinutos: 1439,
              razon: "dia_libre",
              estado: "programada" as const,
              createdAt: date,
              updatedAt: date,
            } as Absence)
        );

      console.log(
        `  ✅ Created ${userScheduledDays.length} scheduled days for user ${settings.usuario_id}`
      );
      allScheduledDaysOff.push(...userScheduledDays);
    });

    console.log(
      "🎯 Total scheduled days off created:",
      allScheduledDaysOff.length
    );
    console.log("📦 Final result:", {
      realAbsences: realAbsences.length,
      scheduledDaysOff: allScheduledDaysOff.length,
      total: realAbsences.length + allScheduledDaysOff.length,
    });

    return [...realAbsences, ...allScheduledDaysOff].sort(
      (a, b) => b.fecha.getTime() - a.fecha.getTime()
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
      .eq("fecha", dateStr)
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
      fecha: new Date(row.fecha),
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

    const sortedDays = scheduledDaysOff.sort(
      (a, b) => a.fecha.getTime() - b.fecha.getTime()
    );

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
        format(day.fecha, "EEEE, dd 'de' MMMM yyyy", { locale: es }),
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

    const sortedAbsences = absences.sort(
      (a, b) => b.fecha.getTime() - a.fecha.getTime()
    );

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
      doc.text(
        AbsenceStatisticsCalculator.getReasonLabel(type.tipo),
        x,
        y + 5.5
      );
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
        fecha: format(date, "yyyy-MM-dd"),
        tipo_ausencia: "festivo",
        hora_inicio: "00:00",
        hora_fin: "23:59",
        duracion_minutos: 1440,
        razon: holidayName,
        comentarios: `Festivo creado automáticamente por ${adminName}`,
        estado: "aprobada",
        aprobado_por: adminId,
        fecha_aprobacion: new Date().toISOString(),
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
        .eq("fecha", dateStr)
        .eq("tipo_ausencia", "festivo");

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
        .select("fecha, razon")
        .eq("tipo_ausencia", "festivo")
        .gte("fecha", format(startDate, "yyyy-MM-dd"))
        .lte("fecha", format(endDate, "yyyy-MM-dd"))
        .order("fecha", { ascending: true });

      if (error) {
        throw new Error(`Error fetching holidays: ${error.message}`);
      }

      const uniqueHolidays = new Map<string, string>();
      (data || []).forEach((item) => {
        if (!uniqueHolidays.has(item.fecha)) {
          uniqueHolidays.set(item.fecha, item.razon);
        }
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
    updates: { fecha?: Date; razon?: string }
  ): Promise<void> {
    const patch: any = {
      updated_at: new Date().toISOString(),
      estado: "pendiente",
      aprobado_por: null,
      fecha_aprobacion: null,
    };

    if (updates.fecha) {
      patch.fecha = updates.fecha.toISOString().split("T")[0];
    }
    if (updates.razon) {
      patch.razon = updates.razon;
    }

    const { error } = await supabase
      .from("ausencias")
      .update(patch)
      .eq("id", absenceId);

    if (error) {
      throw new Error(`Error updating absence: ${error.message}`);
    }
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
