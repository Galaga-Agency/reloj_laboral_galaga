import { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { User, WorkSettings } from '@domain/models';
import { UserRow, WorkSettingsRow } from './types';

interface CreateUserInput {
  nombre: string;
  email: string;
  passwordHash: string;
  role?: string;
  isAdmin?: boolean;
  isActive?: boolean;
}

interface UpdateUserInput {
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

export class UserRepository extends BaseRepository {
  private mapWorkSettings(row?: WorkSettingsRow | null): WorkSettings | null {
    if (!row) return null;
    return {
      horasDiarias: Number(row.horas_diarias),
      horasViernes: Number(row.horas_viernes),
      includeLunchBreak: row.include_lunch_break,
      autoEntryEnabled: row.auto_entry_enabled,
    };
  }

  private mapToDomain(user: UserRow, work?: WorkSettingsRow | null): User {
    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      passwordHash: user.password_hash,
      firstLogin: user.first_login,
      isAdmin: user.is_admin,
      isActive: user.is_active,
      role: user.role,
      diasLibres: (user.dias_libres as string[] | null) ?? [],
      horasDiarias: Number(user.horas_diarias ?? 8),
      horasViernes: Number(user.horas_viernes ?? 6),
      autoEntryEnabled: user.auto_entry_enabled ?? false,
      includeLunchBreak: user.include_lunch_break ?? false,
      gdprConsentGiven: user.gdpr_consent_given ?? false,
      gdprConsentDate: user.gdpr_consent_date,
      emailNotificationsConsent: user.email_notifications_consent ?? false,
      geolocationConsent: user.geolocation_consent ?? false,
      consentVersion: user.consent_version,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
      workSettings: this.mapWorkSettings(work ?? null),
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const sql = 'SELECT * FROM usuarios WHERE email = $1 LIMIT 1';
    const row = await this.queryOne<UserRow>(sql, [email]);
    if (!row) return null;
    const work = await this.queryOne<WorkSettingsRow>(
      'SELECT * FROM user_work_settings WHERE usuario_id = $1',
      [row.id]
    );
    return this.mapToDomain(row, work);
  }

  async findById(id: string): Promise<User | null> {
    const sql = 'SELECT * FROM usuarios WHERE id = $1 LIMIT 1';
    const row = await this.queryOne<UserRow>(sql, [id]);
    if (!row) return null;
    const work = await this.queryOne<WorkSettingsRow>(
      'SELECT * FROM user_work_settings WHERE usuario_id = $1',
      [id]
    );
    return this.mapToDomain(row, work);
  }

  async listAll(): Promise<User[]> {
    const sql = 'SELECT * FROM usuarios ORDER BY nombre ASC';
    const rows = await this.query<UserRow>(sql);
    if (rows.length === 0) return [];
    const workSettings = await this.query<WorkSettingsRow>(
      'SELECT * FROM user_work_settings WHERE usuario_id = ANY($1)',
      [rows.map((row) => row.id)]
    );
    const workMap = new Map(
      workSettings.map((work) => [work.usuario_id, work])
    );
    return rows.map((row) => this.mapToDomain(row, workMap.get(row.id)));
  }

  async create(input: CreateUserInput): Promise<User> {
    const sql = `
      INSERT INTO usuarios (
        nombre, email, password_hash, role, is_admin, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      input.nombre,
      input.email,
      input.passwordHash,
      input.role ?? 'employee',
      input.isAdmin ?? false,
      input.isActive ?? true,
    ];
    const row = await this.queryOne<UserRow>(sql, params);
    if (!row) {
      throw new Error('Failed to create user');
    }
    return this.mapToDomain(row);
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (input.nombre !== undefined) {
      fields.push(`nombre = $${index++}`);
      values.push(input.nombre);
    }
    if (input.email !== undefined) {
      fields.push(`email = $${index++}`);
      values.push(input.email);
    }
    if (input.role !== undefined) {
      fields.push(`role = $${index++}`);
      values.push(input.role);
    }
    if (input.isAdmin !== undefined) {
      fields.push(`is_admin = $${index++}`);
      values.push(input.isAdmin);
    }
    if (input.isActive !== undefined) {
      fields.push(`is_active = $${index++}`);
      values.push(input.isActive);
    }
    if (input.diasLibres !== undefined) {
      fields.push(`dias_libres = $${index++}`);
      values.push(JSON.stringify(input.diasLibres));
    }
    if (input.horasDiarias !== undefined) {
      fields.push(`horas_diarias = $${index++}`);
      values.push(input.horasDiarias);
    }
    if (input.horasViernes !== undefined) {
      fields.push(`horas_viernes = $${index++}`);
      values.push(input.horasViernes);
    }
    if (input.autoEntryEnabled !== undefined) {
      fields.push(`auto_entry_enabled = $${index++}`);
      values.push(input.autoEntryEnabled);
    }
    if (input.includeLunchBreak !== undefined) {
      fields.push(`include_lunch_break = $${index++}`);
      values.push(input.includeLunchBreak);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = NOW()');
    const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;
    values.push(id);

    const row = await this.queryOne<UserRow>(sql, values);
    if (!row) return null;

    if (
      input.horasDiarias !== undefined ||
      input.horasViernes !== undefined ||
      input.includeLunchBreak !== undefined ||
      input.autoEntryEnabled !== undefined
    ) {
      await this.upsertWorkSettings(id, {
        horasDiarias: input.horasDiarias,
        horasViernes: input.horasViernes,
        includeLunchBreak: input.includeLunchBreak,
        autoEntryEnabled: input.autoEntryEnabled,
      });
    }

    const work = await this.queryOne<WorkSettingsRow>(
      'SELECT * FROM user_work_settings WHERE usuario_id = $1',
      [id]
    );

    return this.mapToDomain(row, work);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.execute(
      'UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, id]
    );
  }

  async updateFirstLogin(id: string, firstLogin: boolean): Promise<void> {
    await this.execute(
      'UPDATE usuarios SET first_login = $1, updated_at = NOW() WHERE id = $2',
      [firstLogin, id]
    );
  }

  async updateAdminStatus(id: string, isAdmin: boolean): Promise<void> {
    await this.execute(
      'UPDATE usuarios SET is_admin = $1, updated_at = NOW() WHERE id = $2',
      [isAdmin, id]
    );
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<void> {
    await this.execute(
      'UPDATE usuarios SET is_active = $1, updated_at = NOW() WHERE id = $2',
      [isActive, id]
    );
  }

  async upsertWorkSettings(
    userId: string,
    settings: Partial<WorkSettings>
  ): Promise<void> {
    const existing = await this.queryOne<WorkSettingsRow>(
      'SELECT * FROM user_work_settings WHERE usuario_id = $1',
      [userId]
    );

    if (existing) {
      const updates: string[] = [];
      const values: any[] = [];
      let index = 1;

      if (settings.horasDiarias !== undefined) {
        updates.push(`horas_diarias = $${index++}`);
        values.push(settings.horasDiarias);
      }
      if (settings.horasViernes !== undefined) {
        updates.push(`horas_viernes = $${index++}`);
        values.push(settings.horasViernes);
      }
      if (settings.includeLunchBreak !== undefined) {
        updates.push(`include_lunch_break = $${index++}`);
        values.push(settings.includeLunchBreak);
      }
      if (settings.autoEntryEnabled !== undefined) {
        updates.push(`auto_entry_enabled = $${index++}`);
        values.push(settings.autoEntryEnabled);
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(userId);
        await this.execute(
          `UPDATE user_work_settings SET ${updates.join(', ')} WHERE usuario_id = $${index}`,
          values
        );
      }
    } else {
      await this.execute(
        `INSERT INTO user_work_settings (
          usuario_id, horas_diarias, horas_viernes, include_lunch_break, auto_entry_enabled
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          settings.horasDiarias ?? 8,
          settings.horasViernes ?? 6,
          settings.includeLunchBreak ?? false,
          settings.autoEntryEnabled ?? false,
        ]
      );
    }
  }

  async deleteRefreshTokens(client: PoolClient, userId: string): Promise<void> {
    await client.query('DELETE FROM refresh_tokens WHERE usuario_id = $1', [
      userId,
    ]);
  }
}
