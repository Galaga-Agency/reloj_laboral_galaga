import { Router } from 'express';
import {
  getCorrectionsForRecords,
  applyCorrection,
  submitUserRequest,
} from '@controllers/time-correction.controller';

const router = Router();

router.get('/', ...getCorrectionsForRecords);
router.post('/apply', ...applyCorrection);
router.post('/request', ...submitUserRequest);

export default router;
