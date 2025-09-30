import { BaseRepository } from './base.repository';
import { TimeRecord } from '@domain/models';
import { TimeRecordRow } from './types';

interface CreateTimeRecordInput {
  usuarioId: string;
  fecha: Date;
  tipoRegistro: 'entrada' | 'salida';
  esSimulado?: boolean;
}

export class TimeRecordRepository extends BaseRepository {
  private mapToDomain(row: TimeRecordRow): TimeRecord {
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      fecha: new Date(row.fecha),
      tipoRegistro: row.tipo_registro,
      esSimulado: row.es_simulado,
      fueModificado: row.fue_modificado,
      fechaUltimaModificacion: row.fecha_ultima_modificacion
        ? new Date(row.fecha_ultima_modificacion)
        : undefined,
      modificadoPorAdmin: row.modificado_por_admin ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async create(input: CreateTimeRecordInput): Promise<TimeRecord> {
    const sql = `
      INSERT INTO registros_tiempo (
        usuario_id, fecha, tipo_registro, es_simulado
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const row = await this.queryOne<TimeRecordRow>(sql, [
      input.usuarioId,
      input.fecha,
      input.tipoRegistro,
      input.esSimulado ?? false,
    ]);
    if (!row) {
      throw new Error('Failed to create time record');
    }
    return this.mapToDomain(row);
  }

  async createMany(inputs: CreateTimeRecordInput[]): Promise<TimeRecord[]> {
    if (inputs.length === 0) return [];
    const values: any[] = [];
    const placeholders: string[] = [];
    inputs.forEach((input, index) => {
      const offset = index * 4;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${
        offset + 4
      })`);
      values.push(
        input.usuarioId,
        input.fecha,
        input.tipoRegistro,
        input.esSimulado ?? false
      );
    });

    const sql = `
      INSERT INTO registros_tiempo (usuario_id, fecha, tipo_registro, es_simulado)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;
    const rows = await this.query<TimeRecordRow>(sql, values);
    return rows.map((row) => this.mapToDomain(row));
  }

  async findById(id: string): Promise<TimeRecord | null> {
    const row = await this.queryOne<TimeRecordRow>(
      'SELECT * FROM registros_tiempo WHERE id = $1',
      [id]
    );
    return row ? this.mapToDomain(row) : null;
  }

  async updateRecord(
    id: string,
    changes: Partial<Omit<TimeRecordRow, 'id' | 'usuario_id'>>
  ): Promise<TimeRecord | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (changes.fecha !== undefined) {
      fields.push(`fecha = $${index++}`);
      values.push(changes.fecha);
    }
    if (changes.tipo_registro !== undefined) {
      fields.push(`tipo_registro = $${index++}`);
      values.push(changes.tipo_registro);
    }
    if (changes.es_simulado !== undefined) {
      fields.push(`es_simulado = $${index++}`);
      values.push(changes.es_simulado);
    }
    if (changes.fue_modificado !== undefined) {
      fields.push(`fue_modificado = $${index++}`);
      values.push(changes.fue_modificado);
    }
    if (changes.fecha_ultima_modificacion !== undefined) {
      fields.push(`fecha_ultima_modificacion = $${index++}`);
      values.push(changes.fecha_ultima_modificacion);
    }
    if (changes.modificado_por_admin !== undefined) {
      fields.push(`modificado_por_admin = $${index++}`);
      values.push(changes.modificado_por_admin);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const row = await this.queryOne<TimeRecordRow>(
      `UPDATE registros_tiempo SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );
    return row ? this.mapToDomain(row) : null;
  }

  async findByUser(userId: string): Promise<TimeRecord[]> {
    const sql = `
      SELECT * FROM registros_tiempo
      WHERE usuario_id = $1
      ORDER BY fecha DESC
    `;
    const rows = await this.query<TimeRecordRow>(sql, [userId]);
    return rows.map((row) => this.mapToDomain(row));
  }

  async findLatestByUser(userId: string): Promise<TimeRecord | null> {
    const sql = `
      SELECT * FROM registros_tiempo
      WHERE usuario_id = $1
      ORDER BY fecha DESC
      LIMIT 1
    `;
    const row = await this.queryOne<TimeRecordRow>(sql, [userId]);
    return row ? this.mapToDomain(row) : null;
  }

  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeRecord[]> {
    const sql = `
      SELECT * FROM registros_tiempo
      WHERE usuario_id = $1
        AND fecha >= $2
        AND fecha <= $3
      ORDER BY fecha DESC
    `;
    const rows = await this.query<TimeRecordRow>(sql, [
      userId,
      startDate,
      endDate,
    ]);
    return rows.map((row) => this.mapToDomain(row));
  }

  async findByUserIds(
    userIds: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<TimeRecord[]> {
    if (userIds.length === 0) return [];
    const conditions: string[] = ['usuario_id = ANY($1)'];
    const params: any[] = [userIds];
    let index = 2;

    if (startDate) {
      conditions.push(`fecha >= $${index++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`fecha <= $${index++}`);
      params.push(endDate);
    }

    const sql = `
      SELECT * FROM registros_tiempo
      WHERE ${conditions.join(' AND ')}
      ORDER BY fecha DESC
    `;
    const rows = await this.query<TimeRecordRow>(sql, params);
    return rows.map((row) => this.mapToDomain(row));
  }
}
