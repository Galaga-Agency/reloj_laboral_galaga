import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@errors/app-error';
import { verifyAccessToken } from '@utils/token';
import { UserRepository } from '@repositories/user.repository';

const userRepository = new UserRepository();

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Autenticación requerida', StatusCodes.UNAUTHORIZED);
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const payload = verifyAccessToken(token);
    const user = await userRepository.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new AppError('Usuario no autorizado', StatusCodes.UNAUTHORIZED);
    }

    req.user = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
      isAdmin: user.isAdmin,
    };

    return next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Token inválido', StatusCodes.UNAUTHORIZED));
  }
};

export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user?.isAdmin) {
    return next(new AppError('Acceso no autorizado', StatusCodes.FORBIDDEN));
  }
  return next();
};
