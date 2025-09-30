import { Router } from 'express';
import {
  createRecord,
  createMultipleRecords,
  getRecordsByUser,
  getLatestRecord,
  getRecordsByRange,
} from '@controllers/time-record.controller';

const router = Router();

router.post('/', ...createRecord);
router.post('/bulk', ...createMultipleRecords);
router.get('/user/:userId', ...getRecordsByUser);
router.get('/user/:userId/latest', ...getLatestRecord);
router.get('/user/:userId/range', ...getRecordsByRange);

export default router;
