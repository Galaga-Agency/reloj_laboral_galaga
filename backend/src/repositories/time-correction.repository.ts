import { BaseRepository } from './base.repository';
import { TimeCorrection } from '@domain/models';
import { TimeCorrectionRow } from './types';

interface CreateCorrectionInput {
  registroTiempoId: string;
  usuarioId: string;
  adminUserId?: string;
  adminUserName?: string;
  campoModificado: 'fecha' | 'tipo_registro' | 'multiple';
  valorAnterior: string;
  valorNuevo: string;
  razon: string;
  estado?: 'pendiente' | 'aprobado' | 'rechazado';
  revisadoPor?: string;
  revisadoPorNombre?: string;
  fechaRevision?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class TimeCorrectionRepository extends BaseRepository {
  private mapToDomain(row: TimeCorrectionRow): TimeCorrection {
    return {
      id: row.id,
      registroTiempoId: row.registro_tiempo_id,
      usuarioId: row.usuario_id,
      adminUserId: row.admin_user_id ?? undefined,
      adminUserName: row.admin_user_name ?? undefined,
      campoModificado: row.campo_modificado as TimeCorrection['campoModificado'],
      valorAnterior: row.valor_anterior,
      valorNuevo: row.valor_nuevo,
      razon: row.razon,
      fechaCorreccion: new Date(row.fecha_correccion),
      estado: (row.estado as TimeCorrection['estado']) ?? undefined,
      revisadoPor: row.revisado_por ?? undefined,
      revisadoPorNombre: row.revisado_por_nombre ?? undefined,
      fechaRevision: row.fecha_revision ? new Date(row.fecha_revision) : undefined,
      ipAddress: row.ip_address ?? undefined,
      userAgent: row.user_agent ?? undefined,
    };
  }

  async findByRecordIds(recordIds: string[]): Promise<TimeCorrection[]> {
    if (recordIds.length === 0) return [];
    const sql = `
      SELECT * FROM time_corrections
      WHERE registro_tiempo_id = ANY($1)
      ORDER BY fecha_correccion DESC
    `;
    const rows = await this.query<TimeCorrectionRow>(sql, [recordIds]);
    return rows.map((row) => this.mapToDomain(row));
  }

  async countByUserIds(userIds: string[]): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();
    const sql = `
      SELECT usuario_id, COUNT(*) AS total
      FROM time_corrections
      WHERE usuario_id = ANY($1)
      GROUP BY usuario_id
    `;
    const rows = await this.query<{ usuario_id: string; total: string }>(sql, [
      userIds,
    ]);
    return new Map(rows.map((row) => [row.usuario_id, Number(row.total)]));
  }

  async create(input: CreateCorrectionInput): Promise<TimeCorrection> {
    const sql = `
      INSERT INTO time_corrections (
        registro_tiempo_id, usuario_id, admin_user_id, admin_user_name,
        campo_modificado, valor_anterior, valor_nuevo, razon, estado,
        revisado_por, revisado_por_nombre, fecha_revision, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const row = await this.queryOne<TimeCorrectionRow>(sql, [
      input.registroTiempoId,
      input.usuarioId,
      input.adminUserId ?? null,
      input.adminUserName ?? null,
      input.campoModificado,
      input.valorAnterior,
      input.valorNuevo,
      input.razon,
      input.estado ?? 'aprobado',
      input.revisadoPor ?? null,
      input.revisadoPorNombre ?? null,
      input.fechaRevision ?? null,
      input.ipAddress ?? null,
      input.userAgent ?? null,
    ]);
    if (!row) {
      throw new Error('Failed to create time correction');
    }
    return this.mapToDomain(row);
  }

  async updateStatus(
    id: string,
    status: 'pendiente' | 'aprobado' | 'rechazado',
    reviewerId: string,
    reviewerName: string
  ): Promise<void> {
    await this.execute(
      `UPDATE time_corrections SET estado = $1, revisado_por = $2, revisado_por_nombre = $3, fecha_revision = NOW()
       WHERE id = $4`,
      [status, reviewerId, reviewerName, id]
    );
  }
}
