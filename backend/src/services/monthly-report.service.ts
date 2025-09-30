import { startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { StatusCodes } from 'http-status-codes';

import { MonthlyReportRepository } from '@repositories/monthly-report.repository';
import { UserRepository } from '@repositories/user.repository';
import { TimeRecordService } from '@services/time-record.service';
import {
  MonthlyReport,
  MonthlyReportStatus,
  PublicUser,
  ReportData,
  TimeRecord,
  TimeStatistics,
  User,
} from '@domain/models';
import { AppError } from '@errors/app-error';
import {
  calculateWorkedMilliseconds,
  calculateTimeStats,
  formatDuration,
} from '@utils/time-records';

export class MonthlyReportService {
  constructor(
    private readonly repository = new MonthlyReportRepository(),
    private readonly userRepository = new UserRepository(),
    private readonly timeRecordService = new TimeRecordService()
  ) {}

  private buildStatistics(
    records: TimeRecord[],
    expectedDailyHours: number
  ): TimeStatistics {
    const totalMs = calculateWorkedMilliseconds(records);
    const totalHours = totalMs / (1000 * 60 * 60);
    const stats = calculateTimeStats(records, expectedDailyHours);

    return {
      tiempoTotal: formatDuration(totalMs),
      diasTrabajados: stats.totalDays,
      promedioDiario: formatDuration(
        stats.totalDays > 0 ? (totalMs / stats.totalDays) : 0
      ),
      horasTotales: Number(totalHours.toFixed(2)),
      horasExtra: Number(stats.overtimeHours.toFixed(2)),
    };
  }

  private buildReportData(
    user: PublicUser,
    records: TimeRecord[],
    year: number,
    month: number
  ): ReportData {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));
    const expectedHours = user.workSettings?.horasDiarias ?? user.horasDiarias;
    const statistics = this.buildStatistics(records, expectedHours);

    return {
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        firstLogin: user.firstLogin,
      },
      registros: records,
      periodo: format(startDate, 'MMMM yyyy', { locale: es }),
      fechaInicio: startDate,
      fechaFin: endDate,
      estadisticas: statistics,
    };
  }

  async generateMonthlyReport(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlyReport> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', StatusCodes.NOT_FOUND);
    }

    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));
    const records = await this.timeRecordService.getRecordsByDateRange(
      userId,
      startDate,
      endDate
    );
    const reportData = this.buildReportData(this.toPublic(user), records, year, month);
    return this.repository.create({
      usuarioId: userId,
      year,
      month,
      reportData,
    });
  }

  async getCurrentMonthStatus(userId: string): Promise<MonthlyReportStatus> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let targetYear = currentYear;
    let targetMonth = currentMonth;

    if (now.getDate() <= 5) {
      targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      if (currentMonth === 1) {
        targetYear = currentYear - 1;
      }
    }

    const report = await this.repository.findByUserAndPeriod(
      userId,
      targetYear,
      targetMonth
    );

    if (!report) {
      return {
        hasCurrentMonthReport: false,
        needsReview: false,
      };
    }

    return {
      hasCurrentMonthReport: true,
      report,
      needsReview: !report.isAccepted && !report.isContested,
    };
  }

  async markViewed(reportId: string): Promise<void> {
    await this.repository.markViewed(reportId);
  }

  async acceptReport(reportId: string): Promise<void> {
    await this.repository.markAccepted(reportId);
  }

  async contestReport(reportId: string, reason: string): Promise<void> {
    await this.repository.markContested(reportId, reason);
  }

  async generateMissingReportsForUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', StatusCodes.NOT_FOUND);
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (now.getDate() <= 5) {
      const targetYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const existing = await this.repository.findByUserAndPeriod(
        userId,
        targetYear,
        targetMonth
      );
      if (!existing) {
        await this.generateMonthlyReport(userId, targetYear, targetMonth);
      }
    }
  }

  async listReports(userId: string): Promise<MonthlyReport[]> {
    return this.repository.listByUser(userId);
  }

  async getReportById(reportId: string): Promise<MonthlyReport | null> {
    return this.repository.findById(reportId);
  }

  private toPublic(user: User): PublicUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
