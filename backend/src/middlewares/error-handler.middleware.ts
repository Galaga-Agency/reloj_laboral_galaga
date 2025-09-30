import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@errors/app-error';
import logger from '@utils/logger';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  if (err instanceof AppError) {
    logger.warn({ err }, 'Operational error');
    return res.status(err.statusCode).json({
      message: err.message,
      details: err.details,
    });
  }

  logger.error({ err }, 'Unexpected error');
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: 'Ha ocurrido un error inesperado',
  });
};
