import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export class NotificacionesController {
  static async listar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const notificaciones = await prisma.notificacion.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.json(notificaciones);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar notificaciones' });
    }
  }

  static async marcarLeida(req: AuthRequest, res: Response): Promise<void> {
    try {
      await prisma.notificacion.update({
        where: { id: req.params.id },
        data: { leida: true },
      });

      res.json({ message: 'Notificación marcada como leída' });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar notificación' });
    }
  }

  static async marcarTodasLeidas(req: AuthRequest, res: Response): Promise<void> {
    try {
      await prisma.notificacion.updateMany({
        where: { leida: false },
        data: { leida: true },
      });

      res.json({ message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar notificaciones' });
    }
  }

  static async noLeidas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const count = await prisma.notificacion.count({
        where: { leida: false },
      });

      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: 'Error al contar notificaciones' });
    }
  }
}
