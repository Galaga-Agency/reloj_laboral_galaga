import { Request, Response } from 'express';
import { z } from 'zod';

import { AuthService } from '@services/auth.service';
import { validateRequest } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';

const authService = new AuthService();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const updatePasswordSchema = z.object({
  newPassword: z.string().min(8),
});

export const login = [
  validateRequest(loginSchema),
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json(result);
  },
];

export const refresh = [
  validateRequest(refreshSchema),
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.status(200).json(result);
  },
];

export const logout = [
  validateRequest(refreshSchema),
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.status(204).send();
  },
];

export const profile = [
  requireAuth,
  async (req: Request, res: Response) => {
    const user = await authService.getProfile(req.user!.id);
    res.status(200).json(user);
  },
];

export const updatePassword = [
  requireAuth,
  validateRequest(updatePasswordSchema),
  async (req: Request, res: Response) => {
    const { newPassword } = req.body;
    await authService.updatePassword(req.user!.id, newPassword);
    res.status(204).send();
  },
];
