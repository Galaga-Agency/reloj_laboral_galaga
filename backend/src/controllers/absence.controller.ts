import { Request, Response } from 'express';
import { z } from 'zod';
import { differenceInMinutes, parse } from 'date-fns';

import { requireAdmin, requireAuth } from '@middlewares/auth.middleware';
import { validateRequest } from '@middlewares/validation.middleware';
import { upload } from '@middlewares/upload.middleware';
import { AbsenceService } from '@services/absence.service';
import { AppError } from '@errors/app-error';
import { StatusCodes } from 'http-status-codes';

const absenceService = new AbsenceService();

const createAbsenceSchema = z.object({
  usuarioId: z.string().uuid(),
  fecha: z.coerce.date(),
  tipoAusencia: z.enum([
    'tardanza',
    'salida_temprana',
    'ausencia_parcial',
    'ausencia_completa',
    'permiso_medico',
    'permiso_personal',
    'dia_libre',
  ]),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/),
  razon: z.string().min(3),
  comentarios: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(['pendiente', 'aprobada', 'rechazada', 'programada']),
});

export const createAbsence = [
  requireAuth,
  upload.single('file'),
  validateRequest(createAbsenceSchema),
  async (req: Request, res: Response) => {
    const { usuarioId, fecha, tipoAusencia, horaInicio, horaFin, razon, comentarios } =
      req.body;

    if (!req.user!.isAdmin && req.user!.id !== usuarioId) {
      throw new AppError('No autorizado para crear esta ausencia', StatusCodes.FORBIDDEN);
    }

    const start = parse(horaInicio, 'HH:mm', new Date(fecha));
    const end = parse(horaFin, 'HH:mm', new Date(fecha));
    const duracionMinutos = differenceInMinutes(end, start);

    const file = req.file;
    const absence = await absenceService.createAbsence({
      usuarioId,
      fecha,
      tipoAusencia,
      horaInicio,
      horaFin,
      duracionMinutos,
      razon,
      comentarios,
      createdBy: req.user!.id,
      adjuntoUrl: file ? `/uploads/${file.filename}` : undefined,
      adjuntoNombre: file?.originalname,
    });

    res.status(201).json(absence);
  },
];

export const getAbsencesByUser = [
  requireAuth,
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!req.user!.isAdmin && req.user!.id !== userId) {
      throw new AppError('No autorizado para ver estas ausencias', StatusCodes.FORBIDDEN);
    }
    const { start, end } = req.query;
    const startDate = start ? new Date(String(start)) : undefined;
    const endDate = end ? new Date(String(end)) : undefined;
    const absences = await absenceService.getAbsencesByUser(
      userId,
      startDate,
      endDate
    );
    res.status(200).json(absences);
  },
];

export const getAllAbsences = [
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { start, end } = req.query;
    const startDate = start ? new Date(String(start)) : undefined;
    const endDate = end ? new Date(String(end)) : undefined;
    const absences = await absenceService.getAllAbsences(startDate, endDate);
    res.status(200).json(absences);
  },
];

export const updateAbsenceStatus = [
  requireAuth,
  requireAdmin,
  validateRequest(statusSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    await absenceService.updateAbsenceStatus(id, status, req.user!.id);
    res.status(204).send();
  },
];

export const getAbsenceForDate = [
  requireAuth,
  async (req: Request, res: Response) => {
    const { userId, date } = req.params;
    if (!req.user!.isAdmin && req.user!.id !== userId) {
      throw new AppError('No autorizado para ver esta ausencia', StatusCodes.FORBIDDEN);
    }
    const absence = await absenceService.getAbsenceForDate(userId, new Date(date));
    res.status(200).json(absence);
  },
];
