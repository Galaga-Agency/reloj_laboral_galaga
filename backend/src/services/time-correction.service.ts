import { StatusCodes } from 'http-status-codes';
import { AppError } from '@errors/app-error';
import { TimeCorrectionRepository } from '@repositories/time-correction.repository';
import { TimeRecordRepository } from '@repositories/time-record.repository';
import { UserRepository } from '@repositories/user.repository';
import { TimeCorrection } from '@domain/models';

interface CorrectionChangeSet {
  fecha?: Date;
  tipoRegistro?: 'entrada' | 'salida';
}

interface ApplyCorrectionDto {
  recordId: string;
  userId: string;
  adminId: string;
  reason: string;
  changes: CorrectionChangeSet;
  ipAddress?: string;
  userAgent?: string;
}

interface UserCorrectionRequestDto {
  recordId: string;
  userId: string;
  reason: string;
  changes: CorrectionChangeSet;
  ipAddress?: string;
  userAgent?: string;
}

export class TimeCorrectionService {
  constructor(
    private readonly correctionRepository = new TimeCorrectionRepository(),
    private readonly timeRecordRepository = new TimeRecordRepository(),
    private readonly userRepository = new UserRepository()
  ) {}

  async getCorrectionsForRecords(
    recordIds: string[]
  ): Promise<Map<string, TimeCorrection[]>> {
    const corrections = await this.correctionRepository.findByRecordIds(recordIds);
    const map = new Map<string, TimeCorrection[]>();
    corrections.forEach((correction) => {
      if (!map.has(correction.registroTiempoId)) {
        map.set(correction.registroTiempoId, []);
      }
      map.get(correction.registroTiempoId)!.push(correction);
    });
    return map;
  }

  async applyCorrection(dto: ApplyCorrectionDto): Promise<TimeCorrection[]> {
    const record = await this.timeRecordRepository.findById(dto.recordId);
    if (!record) {
      throw new AppError('Registro no encontrado', StatusCodes.NOT_FOUND);
    }

    const admin = await this.userRepository.findById(dto.adminId);
    if (!admin || !admin.isAdmin) {
      throw new AppError(
        'El usuario administrador no tiene permisos',
        StatusCodes.FORBIDDEN
      );
    }

    if (!dto.changes.fecha && !dto.changes.tipoRegistro) {
      throw new AppError('No se especificaron cambios', StatusCodes.BAD_REQUEST);
    }

    const updates: any = {};
    const corrections: TimeCorrection[] = [];

    if (dto.changes.fecha) {
      updates.fecha = dto.changes.fecha;
    }
    if (dto.changes.tipoRegistro) {
      updates.tipoRegistro = dto.changes.tipoRegistro;
    }

    const updatedRecord = await this.timeRecordRepository.updateRecord(dto.recordId, {
      fecha: updates.fecha,
      tipo_registro: updates.tipoRegistro,
      fue_modificado: true,
      fecha_ultima_modificacion: new Date(),
      modificado_por_admin: dto.adminId,
    });

    if (!updatedRecord) {
      throw new AppError(
        'No se pudo aplicar la corrección',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    if (dto.changes.fecha) {
      const correction = await this.correctionRepository.create({
        registroTiempoId: dto.recordId,
        usuarioId: dto.userId,
        adminUserId: dto.adminId,
        adminUserName: admin.nombre,
        campoModificado: 'fecha',
        valorAnterior: record.fecha.toISOString(),
        valorNuevo: dto.changes.fecha.toISOString(),
        razon: dto.reason,
        estado: 'aprobado',
        revisadoPor: dto.adminId,
        revisadoPorNombre: admin.nombre,
        fechaRevision: new Date(),
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      });
      corrections.push(correction);
    }

    if (dto.changes.tipoRegistro) {
      const correction = await this.correctionRepository.create({
        registroTiempoId: dto.recordId,
        usuarioId: dto.userId,
        adminUserId: dto.adminId,
        adminUserName: admin.nombre,
        campoModificado: 'tipo_registro',
        valorAnterior: record.tipoRegistro,
        valorNuevo: dto.changes.tipoRegistro,
        razon: dto.reason,
        estado: 'aprobado',
        revisadoPor: dto.adminId,
        revisadoPorNombre: admin.nombre,
        fechaRevision: new Date(),
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      });
      corrections.push(correction);
    }

    return corrections;
  }

  async submitUserRequest(dto: UserCorrectionRequestDto): Promise<TimeCorrection> {
    const record = await this.timeRecordRepository.findById(dto.recordId);
    if (!record) {
      throw new AppError('Registro no encontrado', StatusCodes.NOT_FOUND);
    }

    return this.correctionRepository.create({
      registroTiempoId: dto.recordId,
      usuarioId: dto.userId,
      adminUserId: null,
      adminUserName: null,
      campoModificado:
        dto.changes.fecha && dto.changes.tipoRegistro ? 'multiple' : dto.changes.fecha
        ? 'fecha'
        : 'tipo_registro',
      valorAnterior: dto.changes.fecha
        ? record.fecha.toISOString()
        : record.tipoRegistro,
      valorNuevo: dto.changes.fecha
        ? dto.changes.fecha.toISOString()
        : (dto.changes.tipoRegistro as string),
      razon: dto.reason,
      estado: 'pendiente',
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    });
  }
}
