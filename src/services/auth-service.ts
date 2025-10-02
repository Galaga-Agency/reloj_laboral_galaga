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

    if (userRecord.is_active === false) {
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
      role: userRecord.role,
      gdprConsentGiven: userRecord.gdpr_consent_given ?? false,
      gdprConsentDate: userRecord.gdpr_consent_date,
      emailNotificationsConsent:
        userRecord.email_notifications_consent ?? false,
      geolocationConsent: userRecord.geolocation_consent ?? false,
      consentVersion: userRecord.consent_version,
      dias_libres: userRecord.dias_libres || [],
      horas_diarias: userRecord.horas_diarias || 8,
      horas_viernes: userRecord.horas_viernes || 7,
      auto_entry_enabled: userRecord.auto_entry_enabled ?? false,
      include_lunch_break: userRecord.include_lunch_break ?? true,
      hora_entrada_min: userRecord.hora_entrada_min,
      hora_entrada_max: userRecord.hora_entrada_max,
      hora_salida_min: userRecord.hora_salida_min,
      hora_salida_max: userRecord.hora_salida_max,
      hora_salida_viernes_min: userRecord.hora_salida_viernes_min,
      hora_salida_viernes_max: userRecord.hora_salida_viernes_max,
      hora_inicio_descanso: userRecord.hora_inicio_descanso,
      hora_fin_descanso: userRecord.hora_fin_descanso,
      duracion_descanso_min: userRecord.duracion_descanso_min || 20,
      duracion_descanso_max: userRecord.duracion_descanso_max || 45,
    };
  }

  static async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      if (
        error.message ===
        "New password should be different from the old password."
      ) {
        throw new Error(
          "La nueva contraseña debe ser diferente de la contraseña actual"
        );
      }
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
    console.log("getCurrentUser() START");
    try {
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

      const { data: userRecord, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("User record not found in usuarios table (PGRST116)");
          return null;
        }
        throw new Error(`Error al obtener datos del usuario: ${error.message}`);
      }

      if (userRecord.is_active === false) {
        console.log("User is inactive, signing them out");
        await supabase.auth.signOut();
        return null;
      }

      return {
        id: userRecord.id,
        nombre: userRecord.nombre,
        email: userRecord.email,
        firstLogin: userRecord.first_login,
        isAdmin: userRecord.is_admin,
        isActive: userRecord.is_active ?? true,
        role: userRecord.role,
        gdprConsentGiven: userRecord.gdpr_consent_given ?? false,
        gdprConsentDate: userRecord.gdpr_consent_date,
        emailNotificationsConsent:
          userRecord.email_notifications_consent ?? false,
        geolocationConsent: userRecord.geolocation_consent ?? false,
        consentVersion: userRecord.consent_version,
        dias_libres: userRecord.dias_libres || [],
        horas_diarias: userRecord.horas_diarias || 8,
        horas_viernes: userRecord.horas_viernes || 7,
        auto_entry_enabled: userRecord.auto_entry_enabled ?? false,
        include_lunch_break: userRecord.include_lunch_break ?? true,
        hora_entrada_min: userRecord.hora_entrada_min,
        hora_entrada_max: userRecord.hora_entrada_max,
        hora_salida_min: userRecord.hora_salida_min,
        hora_salida_max: userRecord.hora_salida_max,
        hora_salida_viernes_min: userRecord.hora_salida_viernes_min,
        hora_salida_viernes_max: userRecord.hora_salida_viernes_max,
        hora_inicio_descanso: userRecord.hora_inicio_descanso,
        hora_fin_descanso: userRecord.hora_fin_descanso,
        duracion_descanso_min: userRecord.duracion_descanso_min,
        duracion_descanso_max: userRecord.duracion_descanso_max,
      };
    } catch (error) {
      console.error("Exception in getCurrentUser():", error);
      return null;
    }
  }
}
