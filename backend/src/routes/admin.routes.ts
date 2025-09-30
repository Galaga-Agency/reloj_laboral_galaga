import { Router } from 'express';
import { getUserRecords } from '@controllers/admin.controller';

const router = Router();

router.get('/users/:userId/time-records', ...getUserRecords);

export default router;
