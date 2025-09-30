import { StatusCodes } from 'http-status-codes';
import { AppError } from '@errors/app-error';
import { UserRepository } from '@repositories/user.repository';
import { PublicUser, User, WorkSettings } from '@domain/models';
import { hashPassword } from '@utils/password';

interface CreateUserDto {
  nombre: string;
  email: string;
  password: string;
  role?: string;
  isAdmin?: boolean;
  isActive?: boolean;
}

interface UpdateUserDto {
  nombre?: string;
  email?: string;
  role?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  diasLibres?: string[];
  horasDiarias?: number;
  horasViernes?: number;
  autoEntryEnabled?: boolean;
  includeLunchBreak?: boolean;
}

export class UserService {
  constructor(private readonly repository = new UserRepository()) {}

  private toPublic(user: User): PublicUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async createUser(dto: CreateUserDto): Promise<PublicUser> {
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) {
      throw new AppError('El correo ya está registrado', StatusCodes.CONFLICT);
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.repository.create({
      nombre: dto.nombre,
      email: dto.email,
      passwordHash,
      role: dto.role,
      isAdmin: dto.isAdmin,
      isActive: dto.isActive,
    });

    return this.toPublic(user);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const user = await this.repository.update(id, dto);
    if (!user) {
      throw new AppError('Usuario no encontrado', StatusCodes.NOT_FOUND);
    }
    return this.toPublic(user);
  }

  async listUsers(): Promise<PublicUser[]> {
    const users = await this.repository.listAll();
    return users.map((user) => this.toPublic(user));
  }

  async setAdmin(id: string, isAdmin: boolean): Promise<void> {
    await this.repository.updateAdminStatus(id, isAdmin);
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.repository.updateActiveStatus(id, isActive);
  }

  async updateWorkSettings(
    userId: string,
    settings: Partial<WorkSettings>
  ): Promise<void> {
    await this.repository.upsertWorkSettings(userId, settings);
  }
}
