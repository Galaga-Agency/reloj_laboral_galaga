import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@errors/app-error';

type RequestProperty = 'body' | 'query' | 'params';

export const validateRequest = (
  schema: ZodSchema,
  property: RequestProperty = 'body'
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[property]);
    if (!result.success) {
      const details = result.error.flatten();
      return next(new AppError('Datos inválidos', StatusCodes.BAD_REQUEST, details));
    }
    (req as any)[property] = result.data;
    return next();
  };
};
