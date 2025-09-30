import { TimeRecord } from './time-record';
import { PublicUser } from './user';

export interface TimeStatistics {
  tiempoTotal: string;
  diasTrabajados: number;
  promedioDiario: string;
  horasTotales: number;
  horasExtra: number;
}

export interface ReportData {
  usuario: Pick<PublicUser, 'id' | 'nombre' | 'email' | 'firstLogin'>;
  registros: TimeRecord[];
  periodo: string;
  fechaInicio: Date;
  fechaFin: Date;
  estadisticas: TimeStatistics;
}

export interface MonthlyReport {
  id: string;
  usuarioId: string;
  year: number;
  month: number;
  reportData: ReportData;
  pdfUrl?: string | null;
  generatedAt: Date;
  viewedAt?: Date | null;
  acceptedAt?: Date | null;
  contestedAt?: Date | null;
  contestReason?: string | null;
  isAccepted: boolean;
  isContested: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyReportStatus {
  hasCurrentMonthReport: boolean;
  report?: MonthlyReport;
  needsReview: boolean;
}
