import { Request, Response } from 'express';
import { z } from 'zod';

import { requireAdmin, requireAuth } from '@middlewares/auth.middleware';
import { validateRequest } from '@middlewares/validation.middleware';
import { TimeCorrectionService } from '@services/time-correction.service';

const timeCorrectionService = new TimeCorrectionService();

const applyCorrectionSchema = z.object({
  recordId: z.string().uuid(),
  userId: z.string().uuid(),
  adminId: z.string().uuid(),
  reason: z.string().min(5),
  changes: z
    .object({
      fecha: z.coerce.date().optional(),
      tipoRegistro: z.enum(['entrada', 'salida']).optional(),
    })
    .refine((data) => data.fecha || data.tipoRegistro, {
      message: 'Debe especificar al menos un cambio',
    }),
});

const userRequestSchema = z.object({
  recordId: z.string().uuid(),
  userId: z.string().uuid(),
  reason: z.string().min(5),
  changes: z
    .object({
      fecha: z.coerce.date().optional(),
      tipoRegistro: z.enum(['entrada', 'salida']).optional(),
    })
    .refine((data) => data.fecha || data.tipoRegistro, {
      message: 'Debe especificar al menos un cambio',
    }),
});

export const getCorrectionsForRecords = [
  requireAuth,
  async (req: Request, res: Response) => {
    const recordIdsParam = req.query.recordIds;
    const recordIds = Array.isArray(recordIdsParam)
      ? recordIdsParam
      : String(recordIdsParam ?? '')
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);
    const corrections = await timeCorrectionService.getCorrectionsForRecords(
      recordIds
    );
    res.status(200).json(Object.fromEntries(corrections));
  },
];

export const applyCorrection = [
  requireAuth,
  requireAdmin,
  validateRequest(applyCorrectionSchema),
  async (req: Request, res: Response) => {
    const corrections = await timeCorrectionService.applyCorrection({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    res.status(200).json(corrections);
  },
];

export const submitUserRequest = [
  requireAuth,
  validateRequest(userRequestSchema),
  async (req: Request, res: Response) => {
    const correction = await timeCorrectionService.submitUserRequest({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    res.status(201).json(correction);
  },
];
