import { Absence, AbsenceStatus, AbsenceType } from '@domain/models';
import { AbsenceRepository } from '@repositories/absence.repository';

interface CreateAbsenceDto {
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

export class AbsenceService {
  constructor(private readonly repository = new AbsenceRepository()) {}

  async createAbsence(dto: CreateAbsenceDto): Promise<Absence> {
    return this.repository.create(dto);
  }

  async getAbsencesByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Absence[]> {
    return this.repository.findByUser(userId, startDate, endDate);
  }

  async getAllAbsences(startDate?: Date, endDate?: Date): Promise<Absence[]> {
    return this.repository.findAll(startDate, endDate);
  }

  async updateAbsenceStatus(
    absenceId: string,
    status: AbsenceStatus,
    adminId: string
  ): Promise<void> {
    return this.repository.updateStatus(absenceId, status, adminId);
  }

  async getAbsenceForDate(userId: string, date: Date): Promise<Absence | null> {
    return this.repository.findByDate(userId, date);
  }
}
