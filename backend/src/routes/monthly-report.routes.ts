import { Router } from 'express';
import {
  generateReport,
  getCurrentStatus,
  markViewed,
  acceptReport,
  contestReport,
  generateMissingReports,
  listReports,
} from '@controllers/monthly-report.controller';

const router = Router();

router.post('/generate', ...generateReport);
router.get('/user/:userId/status', ...getCurrentStatus);
router.post('/:id/viewed', ...markViewed);
router.post('/:id/accept', ...acceptReport);
router.post('/:id/contest', ...contestReport);
router.post('/user/:userId/generate-missing', ...generateMissingReports);
router.get('/user/:userId', ...listReports);

export default router;
