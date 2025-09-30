import { Router } from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  updateAdminStatus,
  updateActiveStatus,
  updateWorkSettings,
} from '@controllers/user.controller';

const router = Router();

router.get('/', ...listUsers);
router.post('/', ...createUser);
router.patch('/:id', ...updateUser);
router.patch('/:id/admin', ...updateAdminStatus);
router.patch('/:id/active', ...updateActiveStatus);
router.patch('/:id/work-settings', ...updateWorkSettings);

export default router;
