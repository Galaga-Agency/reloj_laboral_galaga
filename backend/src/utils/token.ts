import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import env from '@config/env';
import { PublicUser } from '@domain/models';

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  nombre: string;
  role: string;
  isAdmin: boolean;
}

export const signAccessToken = (user: PublicUser): string => {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    nombre: user.nombre,
    role: user.role,
    isAdmin: user.isAdmin,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
};

export interface RefreshToken {
  token: string;
  expiresAt: Date;
}

export const generateRefreshToken = (): RefreshToken => {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date();
  const duration = parseDuration(env.REFRESH_TOKEN_EXPIRES_IN);
  expiresAt.setMilliseconds(expiresAt.getMilliseconds() + duration);
  return { token, expiresAt };
};

const parseDuration = (value: string): number => {
  const match = value.match(/^(\d+)([smhdw])$/);
  if (!match) {
    throw new Error('Invalid duration format for refresh token');
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };
  return amount * multipliers[unit];
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
