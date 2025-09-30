import { Request, Response } from 'express';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';

import { requireAdmin, requireAuth } from '@middlewares/auth.middleware';
import { TimeRecordService } from '@services/time-record.service';

const timeRecordService = new TimeRecordService();

type TimeRange =
  | 'yesterday'
  | 'past2days'
  | 'thisweek'
  | 'past7days'
  | 'thismonth'
  | 'pastmonth'
  | 'all';

const getRange = (timeRange: TimeRange) => {
  const now = new Date();
  const today = startOfDay(now);

  switch (timeRange) {
    case 'yesterday': {
      const day = subDays(today, 1);
      return { from: startOfDay(day), to: endOfDay(day) };
    }
    case 'past2days':
      return { from: startOfDay(subDays(today, 2)), to: endOfDay(now) };
    case 'thisweek':
      return {
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case 'past7days':
      return { from: startOfDay(subDays(today, 7)), to: endOfDay(now) };
    case 'thismonth':
      return { from: startOfMonth(today), to: endOfMonth(now) };
    case 'pastmonth': {
      const lastMonth = subMonths(today, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    case 'all':
    default:
      return { from: new Date(0), to: endOfDay(now) };
  }
};

export const getUserRecords = [
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const timeRange = (req.query.timeRange as TimeRange) ?? 'past2days';
    const { from, to } = getRange(timeRange);
    const records = await timeRecordService.getRecordsByDateRange(userId, from, to);
    res.status(200).json(records);
  },
];
