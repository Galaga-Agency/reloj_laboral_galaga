import { TimeRecord } from './time-record';

export interface EmployeeData {
  id: string;
  nombre: string;
  email: string;
  totalHours: number;
  totalDays: number;
  avgHoursPerDay: number;
  lastEntry?: Date;
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
  timeRecords: TimeRecord[];
  corrections: TimeRecord[];
}

export interface ComplianceAlert {
  type: 'warning' | 'error' | 'info';
  priority: 'high' | 'medium' | 'low';
  employeeId: string;
  employeeName: string;
  message: string;
  date: Date;
  details?: any;
}
