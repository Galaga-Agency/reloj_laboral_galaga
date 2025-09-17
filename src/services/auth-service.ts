import { supabase } from "@/lib/supabase";
import type { Usuario } from "@/types";

export class AuthService {
  static async signIn(email: string, password: string): Promise<Usuario> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Credenciales incorrectas: ${error.message}`);
    }

    if (!data.user) {
      throw new Error("No se pudo obtener información del usuario");
    }

    const { data: userRecord, error: fetchError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (fetchError) {
      throw new Error(
        `Error al obtener datos del usuario: ${fetchError.message}`
      );
    }

    // Check if user is active
    if (userRecord.is_active === false) {
      // Sign out the user immediately since they shouldn't be logged in
      await supabase.auth.signOut();
      throw new Error(
        "Tu cuenta está desactivada. Contacta con el administrador."
      );
    }

    return {
      id: userRecord.id,
      nombre: userRecord.nombre,
      email: userRecord.email,
      firstLogin: userRecord.first_login,
      isAdmin: userRecord.is_admin,
      isActive: userRecord.is_active ?? true,
      role: userRecord.role
    };
  }

  static async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(`Error al actualizar contraseña: ${error.message}`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("usuarios")
        .update({ first_login: false } as any)
        .eq("id", user.id);
    }
  }

  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(`Error al cerrar sesión: ${error.message}`);
    }
  }

  static async getCurrentUser(): Promise<Usuario | null> {
    console.log("AuthService.getCurrentUser() called");

    try {
      const getUserPromise = async () => {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        console.log("supabase.auth.getUser() result:", {
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
          error: userError,
        });

        if (userError) {
          console.error(
            "Error getting user from supabase.auth.getUser():",
            userError
          );
          return null;
        }

        if (!user) {
          console.log("No user returned from supabase.auth.getUser()");
          return null;
        }

        console.log(
          "Fetching user record from usuarios table for ID:",
          user.id
        );

        const { data: userRecord, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", user.id)
          .single();

        console.log("usuarios table query result:", {
          hasRecord: !!userRecord,
          record: userRecord,
          error: error,
        });

        if (error) {
          if (error.code === "PGRST116") {
            console.log("User record not found in usuarios table (PGRST116)");
            return null;
          }
          console.error("Error fetching user record:", error);
          throw new Error(
            `Error al obtener datos del usuario: ${error.message}`
          );
        }

        // Check if user is active - if not, sign them out
        if (userRecord.is_active === false) {
          console.log("User is inactive, signing them out");
          await supabase.auth.signOut();
          return null;
        }

        const result = {
          id: userRecord.id,
          nombre: userRecord.nombre,
          email: userRecord.email,
          firstLogin: userRecord.first_login,
          isAdmin: userRecord.is_admin,
          isActive: userRecord.is_active ?? true,
          role: userRecord.role
        };

        console.log("Returning user:", result);
        return result;
      };

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("getCurrentUser timeout")), 8000)
      );

      return await Promise.race([getUserPromise(), timeoutPromise]);
    } catch (error) {
      console.error("Exception in getCurrentUser():", error);
      if (error instanceof Error && error.message.includes("timeout")) {
        return null;
      }
      throw error;
    }
  }
}
