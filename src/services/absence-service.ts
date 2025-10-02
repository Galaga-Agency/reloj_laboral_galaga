import { supabase } from "@/lib/supabase";
import type { Absence, AbsenceType, AbsenceStatus, Usuario } from "@/types";
import { differenceInMinutes, parse, format } from "date-fns";
import { AbsencePDFGenerator } from "@/utils/absence-pdf-generator";

export class AbsenceService {
  private static async getUserDailyHours(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from("usuarios")
      .select("horas_diarias")
      .eq("id", userId)
      .single();

    if (error || !data) return 8;
    return data.horas_diarias || 8;
  }

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
    let duracionMinutos: number;

    if (data.tipoAusencia === "ausencia_completa") {
      const userDailyHours = await this.getUserDailyHours(data.usuarioId);
      duracionMinutos = userDailyHours * 60;
    } else {
      const startTime = parse(data.horaInicio, "HH:mm", data.fechas[0]);
      const endTime = parse(data.horaFin, "HH:mm", data.fechas[0]);
      duracionMinutos = differenceInMinutes(endTime, startTime);
    }

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
        estado: data.isAdmin ? "aprobada" : "pendiente",
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
    fechas: Date[];
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
        fechas: data.fechas.map((d) => d.toISOString().split("T")[0]),
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

  static async updateAbsence(
    absenceId: string,
    updates: {
      fechas?: Date[];
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
        patch.edited_fecha = updates.fechas[0].toISOString().split("T")[0];
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

  static async createHolidayForAllUsers(
    date: Date,
    holidayName: string,
    adminId: string,
    adminName: string
  ): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const { data: users, error: usersError } = await supabase
        .from("usuarios")
        .select("id, horas_diarias")
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
        duracion_minutos: (user.horas_diarias || 8) * 60,
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

    await AbsencePDFGenerator.generateUserReport(
      usuario,
      absences,
      startDate,
      endDate
    );
  }

  static async generateCompanyAbsenceReport(
    startDate: Date,
    endDate: Date,
    users: Usuario[]
  ): Promise<void> {
    const absences = await this.getAllAbsences(startDate, endDate, true);

    await AbsencePDFGenerator.generateCompanyReport(
      absences,
      users,
      startDate,
      endDate
    );
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
}
