import { Router } from 'express';

import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import timeRecordRoutes from './time-record.routes';
import absenceRoutes from './absence.routes';
import timeCorrectionRoutes from './time-correction.routes';
import monthlyReportRoutes from './monthly-report.routes';
import officialPortalRoutes from './official-portal.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/time-records', timeRecordRoutes);
router.use('/absences', absenceRoutes);
router.use('/time-corrections', timeCorrectionRoutes);
router.use('/monthly-reports', monthlyReportRoutes);
router.use('/official-portal', officialPortalRoutes);
router.use('/admin', adminRoutes);

export default router;
