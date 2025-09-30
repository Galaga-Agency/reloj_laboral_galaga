import { QueryResult } from 'pg';
import { query, getClient } from '@database/pool';

export abstract class BaseRepository {
  protected async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await query<T>(sql, params);
    return result.rows;
  }

  protected async queryOne<T = any>(
    sql: string,
    params: any[] = []
  ): Promise<T | null> {
    const result = await query<T>(sql, params);
    return result.rows[0] ?? null;
  }

  protected async execute<T = any>(
    sql: string,
    params: any[] = []
  ): Promise<QueryResult<T>> {
    return query<T>(sql, params);
  }

  protected async withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
