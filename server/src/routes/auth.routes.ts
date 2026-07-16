import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

export const authRoutes = Router();

authRoutes.post('/login', AuthController.login);
authRoutes.post('/cliente/login', AuthController.clienteLogin);
authRoutes.get('/cliente/me', AuthController.clienteMe);
authRoutes.get('/me', AuthController.me);
authRoutes.put('/cambiar-password', authMiddleware, AuthController.cambiarPassword);
