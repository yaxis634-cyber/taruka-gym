import { Router } from 'express';
import { RenovacionesController } from '../controllers/renovaciones.controller';
import { authMiddleware } from '../middleware/auth';

export const renovacionesRoutes = Router();

renovacionesRoutes.use(authMiddleware);
renovacionesRoutes.post('/', RenovacionesController.renovar);
renovacionesRoutes.get('/:socioId', RenovacionesController.historial);
