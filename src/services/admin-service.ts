import { supabase } from "@/lib/supabase";
import type { Usuario, RegistroTiempo } from "@/types";

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
    }));

    console.log("Mapped users:", mappedUsers);
    return mappedUsers;
  }

  static async getUserRecords(userId: string): Promise<RegistroTiempo[]> {
    const { data, error } = await supabase
      .from("registros_tiempo")
      .select("*")
      .eq("usuario_id", userId)
      .order("fecha_entrada", { ascending: false });

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

  static async createUser(userData: {
    nombre: string;
    email: string;
    password: string;
    isAdmin: boolean;
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
