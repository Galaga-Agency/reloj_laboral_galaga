import { Request, Response } from 'express';

import { requireAuth } from '@middlewares/auth.middleware';
import { OfficialPortalService } from '@services/official-portal.service';
import { AppError } from '@errors/app-error';
import { StatusCodes } from 'http-status-codes';

const officialPortalService = new OfficialPortalService();

export const getEmployeesData = [
  requireAuth,
  async (req: Request, res: Response) => {
    if (!req.user!.isAdmin && req.user!.role !== 'official') {
      throw new AppError('No autorizado', StatusCodes.FORBIDDEN);
    }
    const { dateRange } = req.query;
    const data = await officialPortalService.getEmployeesData({
      dateRange: dateRange ? String(dateRange) : undefined,
      officialId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
      logAccess: true,
    });
    res.status(200).json(data);
  },
];
