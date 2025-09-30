import { BaseRepository } from './base.repository';
import { AccessLogRow } from './types';

interface CreateAccessLogInput {
  officialId: string;
  accessedUserId?: string | null;
  accessType: string;
  accessedData?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AccessLogRepository extends BaseRepository {
  async create(input: CreateAccessLogInput): Promise<void> {
    await this.execute(
      `INSERT INTO access_logs (
        official_id, accessed_user_id, access_type, accessed_data, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        input.officialId,
        input.accessedUserId ?? null,
        input.accessType,
        input.accessedData ?? null,
        input.ipAddress ?? null,
        input.userAgent ?? null,
      ]
    );
  }

  async listRecent(limit = 50): Promise<AccessLogRow[]> {
    const sql = `
      SELECT * FROM access_logs
      ORDER BY created_at DESC
      LIMIT $1
    `;
    return this.query<AccessLogRow>(sql, [limit]);
  }
}
