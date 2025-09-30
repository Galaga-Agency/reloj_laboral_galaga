import { Router } from 'express';
import {
  createAbsence,
  getAbsencesByUser,
  getAllAbsences,
  updateAbsenceStatus,
  getAbsenceForDate,
} from '@controllers/absence.controller';

const router = Router();

router.post('/', ...createAbsence);
router.get('/user/:userId', ...getAbsencesByUser);
router.get('/', ...getAllAbsences);
router.patch('/:id/status', ...updateAbsenceStatus);
router.get('/user/:userId/date/:date', ...getAbsenceForDate);

export default router;
