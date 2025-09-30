import { Request, Response } from 'express';
import { z } from 'zod';

import { requireAdmin, requireAuth } from '@middlewares/auth.middleware';
import { validateRequest } from '@middlewares/validation.middleware';
import { MonthlyReportService } from '@services/monthly-report.service';
import { AppError } from '@errors/app-error';
import { StatusCodes } from 'http-status-codes';

const monthlyReportService = new MonthlyReportService();

const generateReportSchema = z.object({
  userId: z.string().uuid(),
  year: z.number().min(2000),
  month: z.number().min(1).max(12),
});

const contestSchema = z.object({
  reason: z.string().min(10),
});

export const generateReport = [
  requireAuth,
  requireAdmin,
  validateRequest(generateReportSchema),
  async (req: Request, res: Response) => {
    const { userId, year, month } = req.body;
    const report = await monthlyReportService.generateMonthlyReport(
      userId,
      year,
      month
    );
    res.status(201).json(report);
  },
];

export const getCurrentStatus = [
  requireAuth,
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!req.user!.isAdmin && req.user!.id !== userId) {
      throw new AppError('No autorizado', StatusCodes.FORBIDDEN);
    }
    const status = await monthlyReportService.getCurrentMonthStatus(userId);
    res.status(200).json(status);
  },
];

export const markViewed = [
  requireAuth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const report = await monthlyReportService.getReportById(id);
    if (!report) {
      throw new AppError('Informe no encontrado', StatusCodes.NOT_FOUND);
    }
    if (!req.user!.isAdmin && req.user!.id !== report.usuarioId) {
      throw new AppError('No autorizado', StatusCodes.FORBIDDEN);
    }
    await monthlyReportService.markViewed(id);
    res.status(204).send();
  },
];

export const acceptReport = [
  requireAuth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const report = await monthlyReportService.getReportById(id);
    if (!report) {
      throw new AppError('Informe no encontrado', StatusCodes.NOT_FOUND);
    }
    if (!req.user!.isAdmin && req.user!.id !== report.usuarioId) {
      throw new AppError('No autorizado', StatusCodes.FORBIDDEN);
    }
    await monthlyReportService.acceptReport(id);
    res.status(204).send();
  },
];

export const contestReport = [
  requireAuth,
  validateRequest(contestSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const report = await monthlyReportService.getReportById(id);
    if (!report) {
      throw new AppError('Informe no encontrado', StatusCodes.NOT_FOUND);
    }
    if (!req.user!.isAdmin && req.user!.id !== report.usuarioId) {
      throw new AppError('No autorizado', StatusCodes.FORBIDDEN);
    }
    await monthlyReportService.contestReport(id, reason);
    res.status(204).send();
  },
];

export const generateMissingReports = [
  requireAuth,
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!req.user!.isAdmin && req.user!.id !== userId) {
      throw new AppError('No autorizado', StatusCodes.FORBIDDEN);
    }
    await monthlyReportService.generateMissingReportsForUser(userId);
    res.status(204).send();
  },
];

export const listReports = [
  requireAuth,
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!req.user!.isAdmin && req.user!.id !== userId) {
      throw new AppError('No autorizado', StatusCodes.FORBIDDEN);
    }
    const reports = await monthlyReportService.listReports(userId);
    res.status(200).json(reports);
  },
];
