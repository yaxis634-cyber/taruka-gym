import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth';

export const dashboardRoutes = Router();

dashboardRoutes.use(authMiddleware);
dashboardRoutes.get('/stats', DashboardController.stats);
dashboardRoutes.get('/ultimos-ingresos', DashboardController.ultimosIngresos);
