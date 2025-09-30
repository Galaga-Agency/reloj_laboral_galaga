import { Request, Response } from 'express';
import { z } from 'zod';

import { requireAuth } from '@middlewares/auth.middleware';
import { validateRequest } from '@middlewares/validation.middleware';
import { TimeRecordService } from '@services/time-record.service';
import { AppError } from '@errors/app-error';
import { StatusCodes } from 'http-status-codes';

const timeRecordService = new TimeRecordService();

const createRecordSchema = z.object({
  usuarioId: z.string().uuid(),
  fecha: z.coerce.date(),
  tipoRegistro: z.enum(['entrada', 'salida']),
  esSimulado: z.boolean().optional(),
});

const createManySchema = z.object({
  registros: z
    .array(
      z.object({
        usuarioId: z.string().uuid(),
        fecha: z.coerce.date(),
        tipoRegistro: z.enum(['entrada', 'salida']),
        esSimulado: z.boolean().optional(),
      })
    )
    .min(1),
});

export const createRecord = [
  requireAuth,
  validateRequest(createRecordSchema),
  async (req: Request, res: Response) => {
    const record = await timeRecordService.createRecord(req.body);
    res.status(201).json(record);
  },
];

export const createMultipleRecords = [
  requireAuth,
  validateRequest(createManySchema),
  async (req: Request, res: Response) => {
    const records = await timeRecordService.createMany(req.body.registros);
    res.status(201).json(records);
  },
];

export const getRecordsByUser = [
  requireAuth,
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!req.user!.isAdmin && req.user!.id !== userId) {
      throw new AppError('No autorizado para ver estos registros', StatusCodes.FORBIDDEN);
    }
    const records = await timeRecordService.getRecordsByUser(userId);
    res.status(200).json(records);
  },
];

export const getLatestRecord = [
  requireAuth,
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!req.user!.isAdmin && req.user!.id !== userId) {
      throw new AppError('No autorizado para ver estos registros', StatusCodes.FORBIDDEN);
    }
    const record = await timeRecordService.getLatestRecordByUser(userId);
    res.status(200).json(record);
  },
];

export const getRecordsByRange = [
  requireAuth,
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!req.user!.isAdmin && req.user!.id !== userId) {
      throw new AppError('No autorizado para ver estos registros', StatusCodes.FORBIDDEN);
    }
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: 'Fechas start y end son requeridas' });
    }
    const startDate = new Date(String(start));
    const endDate = new Date(String(end));
    const records = await timeRecordService.getRecordsByDateRange(
      userId,
      startDate,
      endDate
    );
    res.status(200).json(records);
  },
];
