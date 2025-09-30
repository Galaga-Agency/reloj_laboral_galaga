import { Router } from 'express';
import {
  login,
  refresh,
  logout,
  profile,
  updatePassword,
} from '@controllers/auth.controller';

const router = Router();

router.post('/login', ...login);
router.post('/refresh', ...refresh);
router.post('/logout', ...logout);
router.get('/profile', ...profile);
router.patch('/password', ...updatePassword);

export default router;
