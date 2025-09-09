export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          nombre: string;
          email: string;
          first_login: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          email: string;
          first_login?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          email?: string;
          first_login?: boolean;
          created_at?: string;
          updated_at?: string;
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
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
