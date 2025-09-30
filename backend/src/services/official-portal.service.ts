import { EmployeeData } from '@domain/models';
import { AccessLogRepository } from '@repositories/access-log.repository';
import { MonthlyReportRepository } from '@repositories/monthly-report.repository';
import { TimeCorrectionRepository } from '@repositories/time-correction.repository';
import { TimeRecordRepository } from '@repositories/time-record.repository';
import { UserRepository } from '@repositories/user.repository';
import { calculateTimeStats } from '@utils/time-records';

interface DateRange {
  from?: Date;
  to?: Date;
}

interface GetEmployeeOptions {
  dateRange?: string;
  officialId?: string;
  ipAddress?: string;
  userAgent?: string;
  logAccess?: boolean;
}

const DEFAULT_DATE_RANGE = 'thismonth';

export class OfficialPortalService {
  constructor(
    private readonly userRepository = new UserRepository(),
    private readonly timeRecordRepository = new TimeRecordRepository(),
    private readonly timeCorrectionRepository = new TimeCorrectionRepository(),
    private readonly monthlyReportRepository = new MonthlyReportRepository(),
    private readonly accessLogRepository = new AccessLogRepository()
  ) {}

  async getEmployeesData(options: GetEmployeeOptions = {}): Promise<EmployeeData[]> {
    const dateRange = options.dateRange ?? DEFAULT_DATE_RANGE;
    const employees = (await this.userRepository.listAll()).filter(
      (user) => user.role === 'employee'
    );

    if (employees.length === 0) {
      return [];
    }

    const employeeIds = employees.map((employee) => employee.id);
    const { from, to } = this.getDateRange(dateRange);

    const [
      allRecords,
      filteredRecords,
      correctionCounts,
      monthlyReports,
    ] = await Promise.all([
      this.timeRecordRepository.findByUserIds(employeeIds),
      this.timeRecordRepository.findByUserIds(employeeIds, from, to),
      this.timeCorrectionRepository.countByUserIds(employeeIds),
      this.monthlyReportRepository.listByUserIds(employeeIds),
    ]);

    if (options.logAccess && options.officialId) {
      await this.accessLogRepository.create({
        officialId: options.officialId,
        accessType: 'official_portal_overview',
        accessedData: {
          total_employees: employees.length,
          date_range: { from, to },
        },
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      });
    }

    const reportsByUser = new Map<string, typeof monthlyReports>();
    monthlyReports.forEach((report) => {
      const list = reportsByUser.get(report.usuario_id) ?? [];
      list.push(report);
      reportsByUser.set(report.usuario_id, list);
    });

    const allRecordsByUser = new Map<string, typeof allRecords>();
    allRecords.forEach((record) => {
      const list = allRecordsByUser.get(record.usuarioId) ?? [];
      list.push(record);
      allRecordsByUser.set(record.usuarioId, list);
    });

    const filteredRecordsByUser = new Map<string, typeof filteredRecords>();
    filteredRecords.forEach((record) => {
      const list = filteredRecordsByUser.get(record.usuarioId) ?? [];
      list.push(record);
      filteredRecordsByUser.set(record.usuarioId, list);
    });

    return employees.map((employee) => {
      const userAllRecords = allRecordsByUser.get(employee.id) ?? [];
      const userFilteredRecords = filteredRecordsByUser.get(employee.id) ?? [];
      const statsAll = calculateTimeStats(
        userAllRecords,
        employee.workSettings?.horasDiarias ?? employee.horasDiarias
      );
      const statsFiltered = calculateTimeStats(
        userFilteredRecords,
        employee.workSettings?.horasDiarias ?? employee.horasDiarias
      );
      const userReports = reportsByUser.get(employee.id) ?? [];
      const lastRecord = userAllRecords
        .slice()
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0];

      return {
        id: employee.id,
        nombre: employee.nombre,
        email: employee.email,
        totalHours: Number(statsAll.totalHours.toFixed(2)),
        totalDays: statsAll.totalDays,
        avgHoursPerDay: Number(statsAll.avgHoursPerDay.toFixed(2)),
        lastEntry: lastRecord?.fecha,
        isActive: employee.isActive,
        overtimeHours: Number(statsAll.overtimeHours.toFixed(2)),
        totalCorrections: correctionCounts.get(employee.id) ?? 0,
        contestedReports: userReports.filter((r) => r.is_contested).length,
        pendingReports: userReports.filter(
          (r) => !r.is_accepted && !r.is_contested
        ).length,
        workSettings: employee.workSettings
          ? {
              horasDiarias: employee.workSettings.horasDiarias,
              horasViernes: employee.workSettings.horasViernes,
              includeLunchBreak: employee.workSettings.includeLunchBreak,
            }
          : null,
        selectedPeriod: {
          totalHours: Number(statsFiltered.totalHours.toFixed(2)),
          totalDays: statsFiltered.totalDays,
          avgHoursPerDay: Number(statsFiltered.avgHoursPerDay.toFixed(2)),
          overtimeHours: Number(statsFiltered.overtimeHours.toFixed(2)),
        },
      } satisfies EmployeeData;
    });
  }

  private getDateRange(range: string): DateRange {
    const now = new Date();
    switch (range) {
      case 'thisweek': {
        const from = new Date(now);
        const day = from.getDay();
        const diff = from.getDate() - day + (day === 0 ? -6 : 1);
        from.setDate(diff);
        from.setHours(0, 0, 0, 0);
        const to = new Date(from);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        return { from, to };
      }
      case 'lastmonth': {
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { from, to };
      }
      case 'thismonth':
      default: {
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { from, to };
      }
    }
  }
}
