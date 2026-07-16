import { Router } from 'express';
import { IngresosController } from '../controllers/ingresos.controller';
import { authMiddleware } from '../middleware/auth';

export const ingresosRoutes = Router();

ingresosRoutes.use(authMiddleware);
ingresosRoutes.get('/', IngresosController.listar);
