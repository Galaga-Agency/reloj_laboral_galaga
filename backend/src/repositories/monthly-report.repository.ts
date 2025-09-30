import { BaseRepository } from './base.repository';
import { MonthlyReport, ReportData, MonthlyReportStatus } from '@domain/models';
import { MonthlyReportRow } from './types';

interface CreateMonthlyReportInput {
  usuarioId: string;
  year: number;
  month: number;
  reportData: ReportData;
  pdfUrl?: string | null;
}

export class MonthlyReportRepository extends BaseRepository {
  private mapToDomain(row: MonthlyReportRow): MonthlyReport {
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      year: row.year,
      month: row.month,
      reportData: row.report_data as ReportData,
      pdfUrl: row.pdf_url ?? undefined,
      generatedAt: new Date(row.generated_at),
      viewedAt: row.viewed_at ? new Date(row.viewed_at) : undefined,
      acceptedAt: row.accepted_at ? new Date(row.accepted_at) : undefined,
      contestedAt: row.contested_at ? new Date(row.contested_at) : undefined,
      contestReason: row.contest_reason ?? undefined,
      isAccepted: row.is_accepted,
      isContested: row.is_contested,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async create(input: CreateMonthlyReportInput): Promise<MonthlyReport> {
    const sql = `
      INSERT INTO monthly_reports (
        usuario_id, year, month, report_data, pdf_url
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (usuario_id, year, month) DO UPDATE SET
        report_data = EXCLUDED.report_data,
        pdf_url = EXCLUDED.pdf_url,
        updated_at = NOW()
      RETURNING *
    `;
    const row = await this.queryOne<MonthlyReportRow>(sql, [
      input.usuarioId,
      input.year,
      input.month,
      input.reportData,
      input.pdfUrl ?? null,
    ]);
    if (!row) {
      throw new Error('Failed to create monthly report');
    }
    return this.mapToDomain(row);
  }

  async findByUserAndPeriod(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlyReport | null> {
    const sql = `
      SELECT * FROM monthly_reports
      WHERE usuario_id = $1 AND year = $2 AND month = $3
      LIMIT 1
    `;
    const row = await this.queryOne<MonthlyReportRow>(sql, [
      userId,
      year,
      month,
    ]);
    return row ? this.mapToDomain(row) : null;
  }

  async markViewed(reportId: string): Promise<void> {
    await this.execute(
      'UPDATE monthly_reports SET viewed_at = NOW(), updated_at = NOW() WHERE id = $1',
      [reportId]
    );
  }

  async findById(reportId: string): Promise<MonthlyReport | null> {
    const row = await this.queryOne<MonthlyReportRow>(
      'SELECT * FROM monthly_reports WHERE id = $1',
      [reportId]
    );
    return row ? this.mapToDomain(row) : null;
  }

  async markAccepted(reportId: string): Promise<void> {
    await this.execute(
      `UPDATE monthly_reports
       SET accepted_at = NOW(), is_accepted = TRUE, updated_at = NOW()
       WHERE id = $1`,
      [reportId]
    );
  }

  async markContested(reportId: string, reason: string): Promise<void> {
    await this.execute(
      `UPDATE monthly_reports
       SET contested_at = NOW(), contest_reason = $1, is_contested = TRUE, updated_at = NOW()
       WHERE id = $2`,
      [reason, reportId]
    );
  }

  async findLatestForUser(userId: string): Promise<MonthlyReport | null> {
    const sql = `
      SELECT * FROM monthly_reports
      WHERE usuario_id = $1
      ORDER BY generated_at DESC
      LIMIT 1
    `;
    const row = await this.queryOne<MonthlyReportRow>(sql, [userId]);
    return row ? this.mapToDomain(row) : null;
  }

  async listByUser(userId: string): Promise<MonthlyReport[]> {
    const sql = `
      SELECT * FROM monthly_reports
      WHERE usuario_id = $1
      ORDER BY year DESC, month DESC
    `;
    const rows = await this.query<MonthlyReportRow>(sql, [userId]);
    return rows.map((row) => this.mapToDomain(row));
  }

  async listByUserIds(userIds: string[]): Promise<MonthlyReportRow[]> {
    if (userIds.length === 0) return [];
    const sql = `
      SELECT * FROM monthly_reports
      WHERE usuario_id = ANY($1)
    `;
    return this.query<MonthlyReportRow>(sql, [userIds]);
  }
}
