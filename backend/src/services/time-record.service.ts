import { AppError } from '@errors/app-error';
import { TimeRecordRepository } from '@repositories/time-record.repository';
import { TimeRecord } from '@domain/models';
import { StatusCodes } from 'http-status-codes';

interface CreateTimeRecordDto {
  usuarioId: string;
  fecha: Date;
  tipoRegistro: 'entrada' | 'salida';
  esSimulado?: boolean;
}

export class TimeRecordService {
  constructor(private readonly repository = new TimeRecordRepository()) {}

  async createRecord(dto: CreateTimeRecordDto): Promise<TimeRecord> {
    return this.repository.create(dto);
  }

  async createMany(records: CreateTimeRecordDto[]): Promise<TimeRecord[]> {
    return this.repository.createMany(records);
  }

  async getRecordsByUser(userId: string): Promise<TimeRecord[]> {
    return this.repository.findByUser(userId);
  }

  async getLatestRecordByUser(userId: string): Promise<TimeRecord | null> {
    return this.repository.findLatestByUser(userId);
  }

  async getRecordsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeRecord[]> {
    return this.repository.findByDateRange(userId, startDate, endDate);
  }

  async getRecordsForUsers(
    userIds: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<TimeRecord[]> {
    return this.repository.findByUserIds(userIds, startDate, endDate);
  }

  async updateRecord(
    recordId: string,
    changes: Partial<{ fecha: Date; tipoRegistro: 'entrada' | 'salida' }>,
    adminId?: string
  ): Promise<TimeRecord> {
    const record = await this.repository.findById(recordId);
    if (!record) {
      throw new AppError('Registro de tiempo no encontrado', StatusCodes.NOT_FOUND);
    }

    const updated = await this.repository.updateRecord(recordId, {
      fecha: changes.fecha,
      tipo_registro: changes.tipoRegistro,
      fue_modificado: true,
      fecha_ultima_modificacion: new Date(),
      modificado_por_admin: adminId ?? null,
    });

    if (!updated) {
      throw new AppError('No se pudo actualizar el registro', StatusCodes.INTERNAL_SERVER_ERROR);
    }

    return updated;
  }
}
