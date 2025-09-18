import { supabase } from "@/lib/supabase";
import type {
  EmployeeData,
  DetailedEmployeeView,
  ComplianceAlert,
  AccessLogData,
} from "@/types/official-portal";

export class OfficialPortalService {
  static async getAllEmployeesData(
    dateRange: string = "thismonth"
  ): Promise<EmployeeData[]> {
    try {
      const { data: usuarios, error: usuariosError } = await supabase
        .from("usuarios")
        .select("id, nombre, email, is_active")
        .eq("role", "employee");

      if (usuariosError) {
        throw new Error(`Error fetching employees: ${usuariosError.message}`);
      }

      if (!usuarios || usuarios.length === 0) {
        return [];
      }

      const employeeIds = usuarios.map((u) => u.id);

      // Get date range based on selection
      const { dateFrom, dateTo } = this.getDateRangeFilter(dateRange);

      // Get all time records (for total stats)
      const { data: rawAllTimeRecords } = await supabase
        .from("registros_tiempo")
        .select("usuario_id, fecha, tipo_registro, es_simulado, fue_modificado")
        .in("usuario_id", employeeIds);

      // Get filtered time records for selected period
      let filteredQuery = supabase
        .from("registros_tiempo")
        .select("usuario_id, fecha, tipo_registro, es_simulado, fue_modificado")
        .in("usuario_id", employeeIds);

      if (dateFrom) filteredQuery = filteredQuery.gte("fecha", dateFrom);
      if (dateTo) filteredQuery = filteredQuery.lte("fecha", dateTo);

      const { data: rawFilteredTimeRecords } = await filteredQuery;

      // Map to proper interface format
      const allTimeRecords =
        rawAllTimeRecords?.map((record) => ({
          usuario_id: record.usuario_id,
          fecha: record.fecha,
          tipoRegistro: record.tipo_registro as "entrada" | "salida",
          esSimulado: record.es_simulado,
          fueModificado: record.fue_modificado,
        })) || [];

      const filteredTimeRecords =
        rawFilteredTimeRecords?.map((record) => ({
          usuario_id: record.usuario_id,
          fecha: record.fecha,
          tipoRegistro: record.tipo_registro as "entrada" | "salida",
          esSimulado: record.es_simulado,
          fueModificado: record.fue_modificado,
        })) || [];

      // Get work settings (removing auto_entry_enabled)
      const { data: workSettings } = await supabase
        .from("user_work_settings")
        .select("usuario_id, horas_diarias, horas_viernes, include_lunch_break")
        .in("usuario_id", employeeIds);

      // Get corrections count
      const { data: corrections } = await supabase
        .from("time_corrections")
        .select("usuario_id")
        .in("usuario_id", employeeIds);

      // Get monthly reports
      const { data: monthlyReports } = await supabase
        .from("monthly_reports")
        .select("usuario_id, is_contested, is_accepted")
        .in("usuario_id", employeeIds);

      // Calculate stats for each employee
      const employeesWithStats: EmployeeData[] = usuarios.map((emp) => {
        const empAllRecords = allTimeRecords.filter(
          (r) => r.usuario_id === emp.id
        );
        const empFilteredRecords = filteredTimeRecords.filter(
          (r) => r.usuario_id === emp.id
        );
        const empSettings = workSettings?.find((s) => s.usuario_id === emp.id);
        const empCorrections = (corrections || []).filter(
          (c) => c.usuario_id === emp.id
        );
        const empReports = (monthlyReports || []).filter(
          (r) => r.usuario_id === emp.id
        );

        // Calculate total stats (all time)
        const { totalHours, totalDays, avgHoursPerDay, overtimeHours } =
          this.calculateTimeStats(
            empAllRecords,
            empSettings?.horas_diarias || 8
          );

        // Calculate filtered period stats
        const {
          totalHours: filteredTotalHours,
          totalDays: filteredTotalDays,
          avgHoursPerDay: filteredAvgHoursPerDay,
          overtimeHours: filteredOvertimeHours,
        } = this.calculateTimeStats(
          empFilteredRecords,
          empSettings?.horas_diarias || 8
        );

        const lastRecord = empAllRecords.sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )[0];

        return {
          id: emp.id,
          nombre: emp.nombre,
          email: emp.email,
          totalHours: Math.round(totalHours * 100) / 100,
          totalDays,
          avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
          lastEntry: lastRecord?.fecha,
          isActive: emp.is_active,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          totalCorrections: empCorrections.length,
          contestedReports: empReports.filter((r) => r.is_contested).length,
          pendingReports: empReports.filter(
            (r) => !r.is_accepted && !r.is_contested
          ).length,
          workSettings: empSettings
            ? {
                horasDiarias: empSettings.horas_diarias,
                horasViernes: empSettings.horas_viernes,
                includeLunchBreak: empSettings.include_lunch_break,
              }
            : null,
          selectedPeriod: {
            totalHours: Math.round(filteredTotalHours * 100) / 100,
            totalDays: filteredTotalDays,
            avgHoursPerDay: Math.round(filteredAvgHoursPerDay * 100) / 100,
            overtimeHours: Math.round(filteredOvertimeHours * 100) / 100,
          },
        };
      });

      return employeesWithStats;
    } catch (error) {
      console.error("Error in getAllEmployeesData:", error);
      throw error;
    }
  }

  private static getDateRangeFilter(dateRange: string): {
    dateFrom: string | null;
    dateTo: string | null;
  } {
    const now = new Date();

    switch (dateRange) {
      case "thisweek": {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        endOfWeek.setHours(23, 59, 59, 999);

        return {
          dateFrom: startOfWeek.toISOString(),
          dateTo: endOfWeek.toISOString(),
        };
      }

      case "thismonth": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        return {
          dateFrom: startOfMonth.toISOString(),
          dateTo: endOfMonth.toISOString(),
        };
      }

      case "lastmonth": {
        const startOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        endOfLastMonth.setHours(23, 59, 59, 999);

        return {
          dateFrom: startOfLastMonth.toISOString(),
          dateTo: endOfLastMonth.toISOString(),
        };
      }

      case "past7days": {
        const past7Days = new Date(now);
        past7Days.setDate(now.getDate() - 7);
        past7Days.setHours(0, 0, 0, 0);

        return {
          dateFrom: past7Days.toISOString(),
          dateTo: now.toISOString(),
        };
      }

      case "past30days": {
        const past30Days = new Date(now);
        past30Days.setDate(now.getDate() - 30);
        past30Days.setHours(0, 0, 0, 0);

        return {
          dateFrom: past30Days.toISOString(),
          dateTo: now.toISOString(),
        };
      }

      case "all":
      default:
        return { dateFrom: null, dateTo: null };
    }
  }

  private static calculateTimeStats(records: any[], standardHours: number) {
    // Group records by LOCAL date (avoid UTC-shift bugs)
    const recordsByDate = records.reduce((acc, record) => {
      const d = new Date(record.fecha);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateKey = `${y}-${m}-${day}`; // yyyy-MM-dd (local)

      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push({
        ...record,
        _dt: d, // cache Date object for sorting/diff
      });
      return acc;
    }, {} as Record<string, Array<any>>);

    let totalSeconds = 0;
    let overtimeSeconds = 0;
    let workedDays = 0;

    for (const dayKey of Object.keys(recordsByDate)) {
      const dayRecords = recordsByDate[dayKey]
        .slice()
        .sort((a: any, b: any) => a._dt.getTime() - b._dt.getTime());

      // Pair sequential entrada → salida
      let daySeconds = 0;
      let rawWorkedSecondsForOvertime = 0; // before paid break
      let currentEntrada: Date | null = null;

      for (const r of dayRecords) {
        if (r.tipoRegistro === "entrada") {
          // if there was an open entrada, drop it (unpaired) and start new
          currentEntrada = r._dt;
        } else if (r.tipoRegistro === "salida" && currentEntrada) {
          const diff = r._dt.getTime() - currentEntrada.getTime();
          const secs = Math.max(0, diff / 1000);
          daySeconds += secs;
          rawWorkedSecondsForOvertime += secs;
          currentEntrada = null;
        } else {
          // salida without entrada → ignore
        }
      }

      // NOTE: open entrada (no salida) at day end is ignored for totals.
      // If you want to count until midnight or now, add logic here.

      // Add +15m paid break if worked >= 6h (add once)
      if (daySeconds / 3600 >= 6) {
        daySeconds += 15 * 60;
      }

      if (daySeconds > 0) {
        workedDays += 1;
        totalSeconds += daySeconds;

        // Overtime: compare **raw worked time (before paid break)** to standardHours
        const rawHours = rawWorkedSecondsForOvertime / 3600;
        if (rawHours > standardHours) {
          overtimeSeconds += (rawHours - standardHours) * 3600;
        }
      }
    }

    const totalHours = totalSeconds / 3600;
    const totalOvertimeHours = overtimeSeconds / 3600;
    const avgHoursPerDay = workedDays > 0 ? totalHours / workedDays : 0;

    return {
      totalHours,
      totalDays: workedDays, // IMPORTANT: worked days only
      avgHoursPerDay,
      overtimeHours: totalOvertimeHours,
    };
  }

  static async getDetailedEmployeeView(
    employeeId: string,
    rangeKey: string = "all"
  ): Promise<DetailedEmployeeView> {
    // Use the same range used elsewhere
    const employees = await this.getAllEmployeesData(rangeKey);
    const employee = employees.find((e) => e.id === employeeId);

    if (!employee) {
      throw new Error("Employee not found");
    }

    const { dateFrom, dateTo } = this.getDateRangeFilter(rangeKey);

    // registros within the selected period
    let timeQuery = supabase
      .from("registros_tiempo")
      .select("fecha, tipo_registro, es_simulado, fue_modificado")
      .eq("usuario_id", employeeId)
      .order("fecha", { ascending: false });

    if (dateFrom) timeQuery = timeQuery.gte("fecha", dateFrom);
    if (dateTo) timeQuery = timeQuery.lte("fecha", dateTo);

    const { data: rawTimeRecords } = await timeQuery;

    const { data: corrections } = await supabase
      .from("time_corrections")
      .select(
        "campo_modificado, valor_anterior, valor_nuevo, razon, fecha_correccion, admin_user_name"
      )
      .eq("usuario_id", employeeId)
      .order("fecha_correccion", { ascending: false });

    const { data: monthlyReports } = await supabase
      .from("monthly_reports")
      .select(
        "year, month, is_accepted, is_contested, contest_reason, generated_at"
      )
      .eq("usuario_id", employeeId)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    return {
      ...employee, // includes selectedPeriod calculated consistently with rangeKey
      timeRecords:
        rawTimeRecords?.map((record) => ({
          fecha: record.fecha,
          tipoRegistro: record.tipo_registro as "entrada" | "salida",
          esSimulado: record.es_simulado,
          fueModificado: record.fue_modificado,
        })) || [],
      corrections:
        corrections?.map((c) => ({
          campoModificado: c.campo_modificado,
          valorAnterior: c.valor_anterior,
          valorNuevo: c.valor_nuevo,
          razon: c.razon,
          fechaCorreccion: c.fecha_correccion,
          adminUserName: c.admin_user_name,
        })) || [],
      monthlyReports:
        monthlyReports?.map((r) => ({
          year: r.year,
          month: r.month,
          isAccepted: r.is_accepted,
          isContested: r.is_contested,
          contestReason: r.contest_reason,
          generatedAt: r.generated_at,
        })) || [],
    };
  }

  static async generateComplianceAlerts(
    employees: EmployeeData[]
  ): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = [];

    employees.forEach((employee) => {
      if (employee.overtimeHours > 80) {
        alerts.push({
          type: "error",
          priority: "high",
          employeeId: employee.id,
          employeeName: employee.nombre,
          message: `Horas extra excesivas: ${employee.overtimeHours}h`,
          date: new Date().toISOString(),
          details: { overtimeHours: employee.overtimeHours },
        });
      }

      if (employee.contestedReports > 0) {
        alerts.push({
          type: "warning",
          priority: "medium",
          employeeId: employee.id,
          employeeName: employee.nombre,
          message: `${employee.contestedReports} informes contestados`,
          date: new Date().toISOString(),
          details: { contestedCount: employee.contestedReports },
        });
      }

      if (employee.totalCorrections > 10) {
        alerts.push({
          type: "warning",
          priority: "medium",
          employeeId: employee.id,
          employeeName: employee.nombre,
          message: `${employee.totalCorrections} correcciones de tiempo`,
          date: new Date().toISOString(),
          details: { correctionsCount: employee.totalCorrections },
        });
      }
    });

    return alerts;
  }

  static async logAccess(
    officialId: string,
    accessType: string,
    data: AccessLogData,
    accessedUserId: string | null = null // default to null instead of "all"
  ): Promise<void> {
    try {
      await supabase.from("official_access_logs").insert({
        official_id: officialId,
        accessed_user_id: accessedUserId, // keep null when global
        access_type: accessType,
        accessed_data: JSON.stringify(data),
        ip_address: null,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error("Error logging access:", error);
    }
  }

  static generateCSV(employees: EmployeeData[]): string {
    const headers =
      "Nombre,Email,Horas Totales,Días Trabajados,Promedio H/Día,Horas Extra,Última Entrada,Estado,Correcciones,Informes Contestados,Informes Pendientes";
    const rows = employees.map(
      (emp) =>
        `${emp.nombre},${emp.email},${emp.totalHours},${emp.totalDays},${
          emp.avgHoursPerDay
        },${emp.overtimeHours},${emp.lastEntry || "Nunca"},${
          emp.isActive ? "Activo" : "Inactivo"
        },${emp.totalCorrections},${emp.contestedReports},${emp.pendingReports}`
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
