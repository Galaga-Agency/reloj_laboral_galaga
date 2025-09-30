import { BaseRepository } from './base.repository';
import { Absence, AbsenceStatus, AbsenceType } from '@domain/models';
import { AbsenceRow } from './types';

interface CreateAbsenceInput {
  usuarioId: string;
  fecha: Date;
  tipoAusencia: AbsenceType;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  razon: string;
  comentarios?: string;
  estado?: AbsenceStatus;
  adjuntoUrl?: string | null;
  adjuntoNombre?: string | null;
  createdBy: string;
}

export class AbsenceRepository extends BaseRepository {
  private mapToDomain(row: AbsenceRow): Absence {
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      fecha: new Date(row.fecha),
      tipoAusencia: row.tipo_ausencia as AbsenceType,
      horaInicio: row.hora_inicio,
      horaFin: row.hora_fin,
      duracionMinutos: row.duracion_minutos,
      razon: row.razon,
      comentarios: row.comentarios,
      estado: row.estado as AbsenceStatus,
      aprobadoPor: row.aprobado_por ?? undefined,
      fechaAprobacion: row.fecha_aprobacion
        ? new Date(row.fecha_aprobacion)
        : undefined,
      adjuntoUrl: row.adjunto_url ?? undefined,
      adjuntoNombre: row.adjunto_nombre ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      editedBy: row.edited_by ?? undefined,
      editedAt: row.edited_at ? new Date(row.edited_at) : undefined,
      editedFecha: row.edited_fecha ? new Date(row.edited_fecha) : undefined,
      editedHoraInicio: row.edited_hora_inicio ?? undefined,
      editedHoraFin: row.edited_hora_fin ?? undefined,
      editedRazon: row.edited_razon ?? undefined,
      editedComentarios: row.edited_comentarios ?? undefined,
    };
  }

  async create(input: CreateAbsenceInput): Promise<Absence> {
    const sql = `
      INSERT INTO ausencias (
        usuario_id, fecha, tipo_ausencia, hora_inicio, hora_fin, duracion_minutos,
        razon, comentarios, estado, adjunto_url, adjunto_nombre, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const row = await this.queryOne<AbsenceRow>(sql, [
      input.usuarioId,
      input.fecha,
      input.tipoAusencia,
      input.horaInicio,
      input.horaFin,
      input.duracionMinutos,
      input.razon,
      input.comentarios ?? null,
      input.estado ?? 'pendiente',
      input.adjuntoUrl ?? null,
      input.adjuntoNombre ?? null,
      input.createdBy,
    ]);
    if (!row) {
      throw new Error('Failed to create absence');
    }
    return this.mapToDomain(row);
  }

  async findByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Absence[]> {
    const conditions = ['usuario_id = $1'];
    const params: any[] = [userId];
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
      SELECT * FROM ausencias
      WHERE ${conditions.join(' AND ')}
      ORDER BY fecha DESC
    `;
    const rows = await this.query<AbsenceRow>(sql, params);
    return rows.map((row) => this.mapToDomain(row));
  }

  async findAll(startDate?: Date, endDate?: Date): Promise<Absence[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let index = 1;

    if (startDate) {
      conditions.push(`fecha >= $${index++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`fecha <= $${index++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT * FROM ausencias
      ${whereClause}
      ORDER BY fecha DESC
    `;
    const rows = await this.query<AbsenceRow>(sql, params);
    return rows.map((row) => this.mapToDomain(row));
  }

  async updateStatus(
    absenceId: string,
    status: AbsenceStatus,
    adminId: string
  ): Promise<void> {
    await this.execute(
      `UPDATE ausencias SET estado = $1, aprobado_por = $2, fecha_aprobacion = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [status, adminId, absenceId]
    );
  }

  async findByDate(userId: string, date: Date): Promise<Absence | null> {
    const sql = `
      SELECT * FROM ausencias
      WHERE usuario_id = $1 AND fecha = $2
      LIMIT 1
    `;
    const row = await this.queryOne<AbsenceRow>(sql, [userId, date]);
    return row ? this.mapToDomain(row) : null;
  }
}
