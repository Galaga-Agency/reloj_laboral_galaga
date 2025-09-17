export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          nombre: string;
          email: string;
          first_login: boolean;
          is_admin: boolean;
          is_active: boolean;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          email: string;
          first_login?: boolean;
          is_admin?: boolean;
          is_active?: boolean;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          email?: string;
          first_login?: boolean;
          is_admin?: boolean;
          is_active?: boolean;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      official_access_logs: {
        Row: {
          id: number;
          official_id: string;
          accessed_user_id: string;
          access_type: string;
          accessed_data: string;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          official_id: string;
          accessed_user_id: string;
          access_type: string;
          accessed_data: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          official_id?: string;
          accessed_user_id?: string;
          access_type?: string;
          accessed_data?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      registros_tiempo: {
        Row: {
          id: string;
          usuario_id: string;
          fecha_entrada: string;
          fecha_salida: string | null;
          tipo_registro: "entrada" | "salida";
          es_simulado: boolean;
          fue_modificado: boolean;
          fecha_ultima_modificacion: string | null;
          modificado_por_admin: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          fecha_entrada: string;
          fecha_salida?: string | null;
          tipo_registro: "entrada" | "salida";
          es_simulado?: boolean;
          fue_modificado?: boolean;
          fecha_ultima_modificacion?: string | null;
          modificado_por_admin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          fecha_entrada?: string;
          fecha_salida?: string | null;
          tipo_registro?: "entrada" | "salida";
          es_simulado?: boolean;
          fue_modificado?: boolean;
          fecha_ultima_modificacion?: string | null;
          modificado_por_admin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      monthly_reports: {
        Row: {
          id: string;
          usuario_id: string;
          year: number;
          month: number;
          report_data: any;
          pdf_url: string | null;
          generated_at: string;
          viewed_at: string | null;
          accepted_at: string | null;
          contested_at: string | null;
          contest_reason: string | null;
          is_accepted: boolean;
          is_contested: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          year: number;
          month: number;
          report_data: any;
          pdf_url?: string | null;
          generated_at?: string;
          viewed_at?: string | null;
          accepted_at?: string | null;
          contested_at?: string | null;
          contest_reason?: string | null;
          is_accepted?: boolean;
          is_contested?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          year?: number;
          month?: number;
          report_data?: any;
          pdf_url?: string | null;
          generated_at?: string;
          viewed_at?: string | null;
          accepted_at?: string | null;
          contested_at?: string | null;
          contest_reason?: string | null;
          is_accepted?: boolean;
          is_contested?: boolean;
          created_at?: string;
          updated_at?: string;
        };
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
          fecha_correccion: string;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          registro_tiempo_id: string;
          usuario_id: string;
          admin_user_id: string;
          admin_user_name: string;
          campo_modificado: string;
          valor_anterior: string;
          valor_nuevo: string;
          razon: string;
          fecha_correccion: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          registro_tiempo_id?: string;
          usuario_id?: string;
          admin_user_id?: string;
          admin_user_name?: string;
          campo_modificado?: string;
          valor_anterior?: string;
          valor_nuevo?: string;
          razon?: string;
          fecha_correccion?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      user_work_settings: {
        Row: {
          id: string;
          usuario_id: string;
          horas_diarias: number;
          horas_viernes: number;
          hora_entrada_min: string;
          hora_entrada_max: string;
          hora_salida_min: string;
          hora_salida_max: string;
          hora_salida_viernes_min: string;
          hora_salida_viernes_max: string;
          hora_inicio_descanso: string;
          hora_fin_descanso: string;
          duracion_descanso_min: number;
          duracion_descanso_max: number;
          dias_libres: string[];
          auto_entry_enabled: boolean;
          include_lunch_break: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          horas_diarias?: number;
          horas_viernes?: number;
          hora_entrada_min: string;
          hora_entrada_max: string;
          hora_salida_min: string;
          hora_salida_max: string;
          hora_salida_viernes_min?: string;
          hora_salida_viernes_max?: string;
          hora_inicio_descanso?: string;
          hora_fin_descanso?: string;
          duracion_descanso_min?: number;
          duracion_descanso_max?: number;
          dias_libres?: string[];
          auto_entry_enabled?: boolean;
          include_lunch_break?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          horas_diarias?: number;
          horas_viernes?: number;
          hora_entrada_min?: string;
          hora_entrada_max?: string;
          hora_salida_min?: string;
          hora_salida_max?: string;
          hora_salida_viernes_min?: string;
          hora_salida_viernes_max?: string;
          hora_inicio_descanso?: string;
          hora_fin_descanso?: string;
          duracion_descanso_min?: number;
          duracion_descanso_max?: number;
          dias_libres?: string[];
          auto_entry_enabled?: boolean;
          include_lunch_break?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
