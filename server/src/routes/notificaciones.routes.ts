import { Router } from 'express';
import { NotificacionesController } from '../controllers/notificaciones.controller';
import { authMiddleware } from '../middleware/auth';

export const notificacionesRoutes = Router();

notificacionesRoutes.use(authMiddleware);
notificacionesRoutes.get('/', NotificacionesController.listar);
notificacionesRoutes.get('/no-leidas', NotificacionesController.noLeidas);
notificacionesRoutes.put('/leer-todas', NotificacionesController.marcarTodasLeidas);
notificacionesRoutes.put('/:id/leer', NotificacionesController.marcarLeida);
