import { supabase } from "@/lib/supabase";
import type {
  TeleworkingSchedule,
  DailyTeleworkingView,
  TeleworkingLocation,
} from "@/types/teleworking";
import type { Usuario } from "@/types";
import { format } from "date-fns";

export class TeleworkingService {
  static async getScheduleForDate(date: Date): Promise<DailyTeleworkingView> {
    const dateStr = format(date, "yyyy-MM-dd");

    const [schedulesResult, usersResult] = await Promise.all([
      supabase.from("teleworking_schedules").select("*").eq("fecha", dateStr),
      supabase
        .from("usuarios")
        .select("id, nombre, email")
        .eq("is_active", true)
        .eq("role", "employee")
        .order("nombre", { ascending: true }),
    ]);

    if (schedulesResult.error) throw schedulesResult.error;
    if (usersResult.error) throw usersResult.error;

    const schedules = (schedulesResult.data || []).map(this.mapToSchedule);
    const allUsers = usersResult.data || [];
    const scheduledUserIds = new Set(schedules.map((s) => s.usuarioId));

    const office = schedules
      .filter((s) => s.location === "office")
      .map((schedule) => {
        const usuario = allUsers.find((u) => u.id === schedule.usuarioId);
        return {
          usuario: usuario
            ? {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
              }
            : { id: schedule.usuarioId, nombre: "Unknown", email: "" },
          schedule,
        };
      });

    const remote = schedules
      .filter((s) => s.location === "remote")
      .map((schedule) => {
        const usuario = allUsers.find((u) => u.id === schedule.usuarioId);
        return {
          usuario: usuario
            ? {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
              }
            : { id: schedule.usuarioId, nombre: "Unknown", email: "" },
          schedule,
        };
      });

    const unscheduled = allUsers
      .filter((u) => !scheduledUserIds.has(u.id))
      .map((u) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
      }));

    return { office, remote, unscheduled };
  }

  static async getSchedulesInRange(start: Date, end: Date) {
    const response = await fetch(
      `/api/teleworking?s=${start.toISOString()}&e=${end.toISOString()}`
    );
    if (!response.ok) {
      throw new Error("Error fetching teleworking schedules");
    }
    return response.json();
  }

  static async getSchedulesForMonth(
    year: number,
    month: number
  ): Promise<TeleworkingSchedule[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const { data, error } = await supabase
      .from("teleworking_schedules")
      .select("*")
      .gte("fecha", format(startDate, "yyyy-MM-dd"))
      .lte("fecha", format(endDate, "yyyy-MM-dd"))
      .order("fecha", { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToSchedule);
  }

  static async createOrUpdateSchedule(
    usuarioId: string,
    fecha: Date,
    location: TeleworkingLocation,
    createdBy: Usuario,
    notes?: string
  ): Promise<void> {
    const dateStr = format(fecha, "yyyy-MM-dd");

    const { error } = await supabase.from("teleworking_schedules").upsert(
      {
        usuario_id: usuarioId,
        fecha: dateStr,
        location,
        created_by: createdBy.id,
        created_by_name: createdBy.nombre,
        notes: notes || null,
        estado: createdBy.isAdmin ? "aprobada" : "pendiente",
        aprobado_por: createdBy.isAdmin ? createdBy.id : null,
        fecha_aprobacion: createdBy.isAdmin ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "usuario_id,fecha" }
    );

    if (error) throw error;
  }

  static async approveSchedule(scheduleId: string, admin: Usuario) {
    const { error } = await supabase
      .from("teleworking_schedules")
      .update({
        estado: "aprobada",
        aprobado_por: admin.id,
        fecha_aprobacion: new Date().toISOString(),
      })
      .eq("id", scheduleId);

    if (error) throw error;
  }

  static async rejectSchedule(scheduleId: string) {
    const { error } = await supabase
      .from("teleworking_schedules")
      .delete()
      .eq("id", scheduleId);

    if (error) throw error;
  }

  static async deleteSchedule(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from("teleworking_schedules")
      .delete()
      .eq("id", scheduleId);

    if (error) throw error;
  }

  static async bulkCreateSchedules(
    schedules: Array<{
      usuarioId: string;
      fecha: Date;
      location: TeleworkingLocation;
    }>,
    createdBy: Usuario
  ): Promise<void> {
    const records = schedules.map((s) => ({
      usuario_id: s.usuarioId,
      fecha: format(s.fecha, "yyyy-MM-dd"),
      location: s.location,
      created_by: createdBy.id,
      created_by_name: createdBy.nombre,
      estado: createdBy.isAdmin ? "aprobada" : "pendiente",
      aprobado_por: createdBy.isAdmin ? createdBy.id : null,
      fecha_aprobacion: createdBy.isAdmin ? new Date().toISOString() : null,
    }));

    console.log("[TeleworkingService] bulkCreateSchedules input:", schedules);
    console.log("[TeleworkingService] mapped records to insert:", records);

    const { data, error } = await supabase
      .from("teleworking_schedules")
      .upsert(records, {
        onConflict: "usuario_id,fecha",
      });

    console.log("[TeleworkingService] upsert response data:", data);
    console.log("[TeleworkingService] upsert response error:", error);

    if (error) throw error;
  }

  private static mapToSchedule(data: any): TeleworkingSchedule {
    return {
      id: data.id,
      usuarioId: data.usuario_id,
      fecha: new Date(data.fecha),
      location: data.location as TeleworkingLocation,
      createdBy: data.created_by,
      createdByName: data.created_by_name,
      notes: data.notes,
      estado: data.estado as "pendiente" | "aprobada" | "rechazada",
      aprobadoPor: data.aprobado_por ?? null,
      fechaAprobacion: data.fecha_aprobacion
        ? new Date(data.fecha_aprobacion)
        : null,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
    };
  }
}
