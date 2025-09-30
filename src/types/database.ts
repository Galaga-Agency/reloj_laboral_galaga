import { AbsenceType, AbsenceStatus } from "./absence";

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          nombre: string;
          email: string;
          created_at: string | null;
          updated_at: string | null;
          first_login: boolean | null;
          password_hash: string | null;
          is_admin: boolean | null;
          is_active: boolean | null;
          role: string | null;
          gdpr_consent_given: boolean | null;
          gdpr_consent_date: string | null;
          email_notifications_consent: boolean | null;
          geolocation_consent: boolean | null;
          consent_version: string | null;
          horas_diarias: number | null;
          horas_viernes: number | null;
          hora_entrada_min: string | null;
          hora_entrada_max: string | null;
          hora_salida_min: string | null;
          hora_salida_max: string | null;
          hora_salida_viernes_min: string | null;
          hora_salida_viernes_max: string | null;
          hora_inicio_descanso: string | null;
          hora_fin_descanso: string | null;
          duracion_descanso_min: number | null;
          duracion_descanso_max: number | null;
          auto_entry_enabled: boolean | null;
          include_lunch_break: boolean | null;
        };
        Insert: Omit<Database["public"]["Tables"]["usuarios"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["usuarios"]["Row"]>;
      };

      ausencias: {
        Row: {
          id: string;
          usuario_id: string;
          fecha: string;
          tipo_ausencia: AbsenceType;
          hora_inicio: string;
          hora_fin: string;
          duracion_minutos: number;
          razon: string;
          comentarios: string | null;
          estado: AbsenceStatus;
          aprobado_por: string | null;
          fecha_aprobacion: string | null;
          created_at: string | null;
          updated_at: string | null;
          adjunto_url: string | null;
          adjunto_nombre: string | null;
          created_by: string | null;
          edited_by: string | null;
          edited_at: string | null;
          edited_fecha: string | null;
          edited_hora_inicio: string | null;
          edited_hora_fin: string | null;
          edited_razon: string | null;
          edited_comentarios: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["ausencias"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ausencias"]["Row"]>;
      };

      monthly_reports: {
        Row: {
          id: string;
          usuario_id: string;
          year: number;
          month: number;
          report_data: any;
          pdf_url: string | null;
          generated_at: string | null;
          viewed_at: string | null;
          accepted_at: string | null;
          contested_at: string | null;
          contest_reason: string | null;
          is_accepted: boolean | null;
          is_contested: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["monthly_reports"]["Row"],
          "id"
        > & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["monthly_reports"]["Row"]>;
      };

      official_access_logs: {
        Row: {
          id: number;
          official_id: string | null;
          accessed_user_id: string | null;
          access_type: string | null;
          accessed_data: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["official_access_logs"]["Row"],
          "id"
        > & {
          id?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["official_access_logs"]["Row"]
        >;
      };

      registros_tiempo: {
        Row: {
          id: string;
          usuario_id: string | null;
          tipo_registro: string;
          es_simulado: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          fue_modificado: boolean | null;
          fecha_ultima_modificacion: string | null;
          modificado_por_admin: string | null;
          fecha: string;
          editado_por_usuario: string | null;
          editado_por_usuario_nombre: string | null;
          validado_por_admin: string | null;
          validado_por_admin_nombre: string | null;
          fecha_validacion: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["registros_tiempo"]["Row"],
          "id"
        > & {
          id?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["registros_tiempo"]["Row"]
        >;
      };

      time_corrections: {
        Row: {
          id: string;
          registro_tiempo_id: string;
          usuario_id: string;
          admin_user_id: string;
          admin_user_name: string;
          campo_modificado: string;
          valor_anterior: string;
          valor_nuevo: string;
          razon: string;
          fecha_correccion: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string | null;
          estado: string | null;
          revisado_por: string | null;
          revisado_por_nombre: string | null;
          fecha_revision: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["time_corrections"]["Row"],
          "id"
        > & {
          id?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["time_corrections"]["Row"]
        >;
      };
    };
  };
}
