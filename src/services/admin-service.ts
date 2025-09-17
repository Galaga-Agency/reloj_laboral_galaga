import { supabase } from "@/lib/supabase";
import type { Usuario, RegistroTiempo } from "@/types";
import {
  subDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";

export type TimeRange =
  | "yesterday"
  | "past2days"
  | "thisweek"
  | "past7days"
  | "thismonth"
  | "pastmonth"
  | "all";

export class AdminService {
  static async getAllUsers(): Promise<Usuario[]> {
    console.log("AdminService.getAllUsers() called");

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .order("nombre", { ascending: true });

    console.log("getAllUsers query result:", {
      data,
      error,
      count: data?.length,
    });

    if (error) {
      console.error("Error in getAllUsers:", error);
      throw new Error(`Error fetching users: ${error.message}`);
    }

    if (!data) {
      console.log("No data returned from getAllUsers");
      return [];
    }

    const mappedUsers = data.map((user: any) => ({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      firstLogin: user.first_login,
      isAdmin: user.is_admin,
      isActive: user.is_active ?? true, 
      role: user.role
    }));

    console.log("Mapped users:", mappedUsers);
    return mappedUsers;
  }

  static async getUserRecords(
    userId: string,
    timeRange: TimeRange = "past2days"
  ): Promise<RegistroTiempo[]> {
    const { startDate, endDate } = this.getDateRangeFromTimeRange(timeRange);

    let query = supabase
      .from("registros_tiempo")
      .select("*")
      .eq("usuario_id", userId)
      .order("fecha_entrada", { ascending: false });

    if (timeRange !== "all") {
      query = query
        .gte("fecha_entrada", startDate.toISOString())
        .lte("fecha_entrada", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching user records: ${error.message}`);
    }

    if (!data) return [];

    return data.map((record: any) => ({
      id: record.id,
      usuarioId: record.usuario_id,
      fechaEntrada: new Date(record.fecha_entrada),
      fechaSalida: record.fecha_salida
        ? new Date(record.fecha_salida)
        : undefined,
      tipoRegistro: record.tipo_registro,
      esSimulado: record.es_simulado,
    }));
  }

  private static getDateRangeFromTimeRange(timeRange: TimeRange): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    const today = startOfDay(now);

    switch (timeRange) {
      case "yesterday":
        const yesterday = subDays(today, 1);
        return {
          startDate: startOfDay(yesterday),
          endDate: endOfDay(yesterday),
        };

      case "past2days":
        return {
          startDate: startOfDay(subDays(today, 2)),
          endDate: endOfDay(now),
        };

      case "thisweek":
        return {
          startDate: startOfWeek(today, { weekStartsOn: 1 }),
          endDate: endOfWeek(now, { weekStartsOn: 1 }),
        };

      case "past7days":
        return {
          startDate: startOfDay(subDays(today, 7)),
          endDate: endOfDay(now),
        };

      case "thismonth":
        return {
          startDate: startOfMonth(today),
          endDate: endOfMonth(now),
        };

      case "pastmonth":
        const lastMonth = subMonths(today, 1);
        return {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth),
        };

      case "all":
      default:
        return {
          startDate: new Date(0),
          endDate: new Date(),
        };
    }
  }

  static getTimeRangeLabel(timeRange: TimeRange): string {
    switch (timeRange) {
      case "yesterday":
        return "Ayer";
      case "past2days":
        return "Últimos 2 días";
      case "thisweek":
        return "Esta semana";
      case "past7days":
        return "Últimos 7 días";
      case "thismonth":
        return "Este mes";
      case "pastmonth":
        return "Mes pasado";
      case "all":
        return "Todo el historial";
      default:
        return "Últimos 2 días";
    }
  }

  static async updateUserAdminStatus(
    userId: string,
    isAdmin: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from("usuarios")
      .update({
        is_admin: isAdmin,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", userId);

    if (error) {
      throw new Error(`Error updating user admin status: ${error.message}`);
    }
  }

  static async updateUserActiveStatus(
    userId: string,
    isActive: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from("usuarios")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", userId);

    if (error) {
      throw new Error(`Error updating user active status: ${error.message}`);
    }
  }

  static async createUser(userData: {
    nombre: string;
    email: string;
    password: string;
    isAdmin: boolean;
    role: string;
  }): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No active session");
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-crud-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "create",
            ...userData,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `HTTP ${response.status}: Failed to create user`
        );
      }

      console.log("User created successfully:", result);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create user");
    }
  }

  static async updateUser(
    userId: string,
    userData: {
      nombre: string;
      email: string;
      password?: string;
      isAdmin: boolean;
      role: string;
    }
  ): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No active session");
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-crud-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update",
            userId,
            ...userData,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `HTTP ${response.status}: Failed to update user`
        );
      }

      console.log("User updated successfully:", result);
    } catch (error) {
      console.error("Error updating user:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to update user");
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No active session");
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-crud-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "delete",
            userId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `HTTP ${response.status}: Failed to delete user`
        );
      }

      console.log("User deleted successfully:", result);
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to delete user");
    }
  }
}
