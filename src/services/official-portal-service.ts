import { supabase } from "@/lib/supabase";
import type { Usuario } from "@/types";

export interface EmployeeData {
  id: string;
  nombre: string;
  email: string;
  totalHours: number;
  totalDays: number;
  avgHoursPerDay: number;
  lastEntry?: string;
  isActive: boolean;
}

export interface AccessLogData {
  action: string;
  count?: number;
  format?: string;
  employees_count?: number;
  exported_at?: string;
}

export class OfficialPortalService {
  static async getAllEmployeesData(): Promise<EmployeeData[]> {
    try {
      // Get all employees (non-officials)
      const { data: usuarios, error: usuariosError } = await supabase
        .from("usuarios")
        .select("id, nombre, email, is_active")
        .eq("role", "employee");

      if (usuariosError) {
        console.error("Error fetching usuarios:", usuariosError);
        throw new Error(`Error fetching employees: ${usuariosError.message}`);
      }

      if (!usuarios || usuarios.length === 0) {
        console.log("No employees found");
        return [];
      }

      console.log("Fetched usuarios:", usuarios);

      // Get time records for all employees
      const employeeIds = usuarios.map((u) => u.id);
      const { data: timeRecords, error: timeError } = await supabase
        .from("registros_tiempo")
        .select("usuario_id, fecha_entrada, fecha_salida")
        .in("usuario_id", employeeIds)
        .not("fecha_salida", "is", null);

      if (timeError) {
        console.error("Error fetching time records:", timeError);
        // Don't throw here, continue with empty records
        console.log("Continuing with empty time records due to error");
      }

      console.log("Fetched time records:", timeRecords || []);

      // Calculate stats for each employee
      const employeesWithStats: EmployeeData[] = usuarios.map((emp) => {
        const empRecords = (timeRecords || []).filter(
          (r) => r.usuario_id === emp.id
        );

        const totalHours = empRecords.reduce((total, record) => {
          const entrada = new Date(record.fecha_entrada);
          const salida = new Date(record.fecha_salida!);
          const hours =
            (salida.getTime() - entrada.getTime()) / (1000 * 60 * 60);
          return total + hours;
        }, 0);

        const totalDays = empRecords.length;
        const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;

        const lastRecord = empRecords.sort(
          (a, b) =>
            new Date(b.fecha_entrada).getTime() -
            new Date(a.fecha_entrada).getTime()
        )[0];

        return {
          id: emp.id,
          nombre: emp.nombre,
          email: emp.email,
          totalHours: Math.round(totalHours * 100) / 100,
          totalDays,
          avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
          lastEntry: lastRecord?.fecha_entrada,
          isActive: emp.is_active,
        };
      });

      return employeesWithStats;
    } catch (error) {
      console.error("Error in getAllEmployeesData:", error);
      throw error;
    }
  }

  static async logAccess(
    officialId: string,
    accessType: string,
    data: AccessLogData,
    accessedUserId: string = "all"
  ): Promise<void> {
    try {
      await supabase.from("official_access_logs").insert({
        official_id: officialId,
        accessed_user_id: accessedUserId,
        access_type: accessType,
        accessed_data: JSON.stringify(data),
        ip_address: null,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error("Error logging access:", error);
      // Don't throw - logging should not break the main flow
    }
  }

  static generateCSV(employees: EmployeeData[]): string {
    const headers =
      "Nombre,Email,Horas Totales,Días Trabajados,Promedio H/Día,Última Entrada,Estado";
    const rows = employees.map(
      (emp) =>
        `${emp.nombre},${emp.email},${emp.totalHours},${emp.totalDays},${
          emp.avgHoursPerDay
        },${emp.lastEntry || "Nunca"},${emp.isActive ? "Activo" : "Inactivo"}`
    );

    return [headers, ...rows].join("\n");
  }

  static downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
