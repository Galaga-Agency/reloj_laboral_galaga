import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export const notFoundHandler = (
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  return res.status(StatusCodes.NOT_FOUND).json({
    message: 'Recurso no encontrado',
  });
};
