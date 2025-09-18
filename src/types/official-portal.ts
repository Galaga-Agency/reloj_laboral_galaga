export interface EmployeeData {
  id: string;
  nombre: string;
  email: string;
  totalHours: number;
  totalDays: number;
  avgHoursPerDay: number;
  lastEntry?: string;
  isActive: boolean;
  overtimeHours: number;
  totalCorrections: number;
  contestedReports: number;
  pendingReports: number;
  workSettings: {
    horasDiarias: number;
    horasViernes: number;
    includeLunchBreak: boolean;
  } | null;
  selectedPeriod: {
    totalHours: number;
    totalDays: number;
    avgHoursPerDay: number;
    overtimeHours: number;
  };
}

export interface DetailedEmployeeView extends EmployeeData {
  timeRecords: Array<{
    fecha: string;
    tipoRegistro: "entrada" | "salida";
    esSimulado: boolean;
    fueModificado: boolean;
  }>;
  corrections: Array<{
    campoModificado: string;
    valorAnterior: string;
    valorNuevo: string;
    razon: string;
    fechaCorreccion: string;
    adminUserName: string;
  }>;
  monthlyReports: Array<{
    year: number;
    month: number;
    isAccepted: boolean;
    isContested: boolean;
    contestReason?: string;
    generatedAt: string;
  }>;
}

export interface ComplianceAlert {
  type: "warning" | "error" | "info";
  priority: "high" | "medium" | "low";
  employeeId: string;
  employeeName: string;
  message: string;
  date: string;
  details: any;
}

export interface AccessLogData {
  action: string;
  count?: number;
  format?: string;
  employees_count?: number;
  exported_at?: string;
  date_range?: {
    from: string;
    to: string;
  };
  search_term?: string;
}

export interface AccessLogEntry {
  id: number;
  official_name: string;
  accessed_user_name: string;
  access_type: string;
  accessed_data: any;
  created_at: string;
  ip_address?: string;
}
