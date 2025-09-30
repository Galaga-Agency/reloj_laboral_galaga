import { StatusCodes } from 'http-status-codes';
import { AppError } from '@errors/app-error';
import { UserRepository } from '@repositories/user.repository';
import { RefreshTokenRepository } from '@repositories/refresh-token.repository';
import { comparePassword, hashPassword } from '@utils/password';
import {
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from '@utils/token';
import { PublicUser, User } from '@domain/models';

interface LoginResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export class AuthService {
  constructor(
    private readonly userRepository = new UserRepository(),
    private readonly refreshTokenRepository = new RefreshTokenRepository()
  ) {}

  private toPublicUser(user: User): PublicUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Credenciales inválidas', StatusCodes.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new AppError(
        'Tu cuenta está desactivada. Contacta con el administrador.',
        StatusCodes.FORBIDDEN
      );
    }

    const validPassword = await comparePassword(password, user.passwordHash);
    if (!validPassword) {
      throw new AppError('Credenciales inválidas', StatusCodes.UNAUTHORIZED);
    }

    const publicUser = this.toPublicUser(user);
    const accessToken = signAccessToken(publicUser);
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken.token);

    await this.refreshTokenRepository.storeToken(
      user.id,
      tokenHash,
      refreshToken.expiresAt
    );

    return {
      user: publicUser,
      accessToken,
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.expiresAt,
    };
  }

  async refresh(refreshToken: string): Promise<LoginResult> {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.refreshTokenRepository.findByHash(tokenHash);

    if (!stored) {
      throw new AppError('Token de actualización inválido', StatusCodes.UNAUTHORIZED);
    }

    const user = await this.userRepository.findById(stored.usuario_id);
    if (!user || !user.isActive) {
      await this.refreshTokenRepository.deleteToken(stored.id);
      throw new AppError('Usuario no disponible', StatusCodes.UNAUTHORIZED);
    }

    await this.refreshTokenRepository.deleteToken(stored.id);

    const publicUser = this.toPublicUser(user);
    const accessToken = signAccessToken(publicUser);
    const newRefresh = generateRefreshToken();
    await this.refreshTokenRepository.storeToken(
      user.id,
      hashToken(newRefresh.token),
      newRefresh.expiresAt
    );

    return {
      user: publicUser,
      accessToken,
      refreshToken: newRefresh.token,
      refreshTokenExpiresAt: newRefresh.expiresAt,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    const tokenHash = hashToken(refreshToken);
    await this.refreshTokenRepository.deleteTokenByHash(tokenHash);
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', StatusCodes.NOT_FOUND);
    }
    return this.toPublicUser(user);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashed = await hashPassword(newPassword);
    await this.userRepository.updatePassword(userId, hashed);
    await this.userRepository.updateFirstLogin(userId, false);
  }
}
