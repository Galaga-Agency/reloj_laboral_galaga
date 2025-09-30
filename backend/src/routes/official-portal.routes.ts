import { Router } from 'express';
import { getEmployeesData } from '@controllers/official-portal.controller';

const router = Router();

router.get('/employees', ...getEmployeesData);

export default router;
