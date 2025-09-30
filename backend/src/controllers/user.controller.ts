import { Request, Response } from 'express';
import { z } from 'zod';

import { requireAdmin, requireAuth } from '@middlewares/auth.middleware';
import { validateRequest } from '@middlewares/validation.middleware';
import { UserService } from '@services/user.service';

const userService = new UserService();

const createUserSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().optional(),
  isAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const updateUserSchema = z.object({
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  isAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
  diasLibres: z.array(z.string()).optional(),
  horasDiarias: z.number().optional(),
  horasViernes: z.number().optional(),
  autoEntryEnabled: z.boolean().optional(),
  includeLunchBreak: z.boolean().optional(),
});

const statusSchema = z.object({
  isAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const workSettingsSchema = z.object({
  horasDiarias: z.number().optional(),
  horasViernes: z.number().optional(),
  includeLunchBreak: z.boolean().optional(),
  autoEntryEnabled: z.boolean().optional(),
});

export const listUsers = [
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response) => {
    const users = await userService.listUsers();
    res.status(200).json(users);
  },
];

export const createUser = [
  requireAuth,
  requireAdmin,
  validateRequest(createUserSchema),
  async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  },
];

export const updateUser = [
  requireAuth,
  requireAdmin,
  validateRequest(updateUserSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);
    res.status(200).json(user);
  },
];

export const updateAdminStatus = [
  requireAuth,
  requireAdmin,
  validateRequest(statusSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isAdmin } = req.body;
    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ message: 'isAdmin es requerido' });
    }
    await userService.setAdmin(id, isAdmin);
    res.status(204).send();
  },
];

export const updateActiveStatus = [
  requireAuth,
  requireAdmin,
  validateRequest(statusSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive es requerido' });
    }
    await userService.setActive(id, isActive);
    res.status(204).send();
  },
];

export const updateWorkSettings = [
  requireAuth,
  requireAdmin,
  validateRequest(workSettingsSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await userService.updateWorkSettings(id, req.body);
    res.status(204).send();
  },
];
