import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export class DashboardController {
  static async stats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const ahora = new Date();
      const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      const hoyFin = new Date(hoyInicio.getTime() + 24 * 60 * 60 * 1000);
      const mesInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

      const [
        activos,
        congelados,
        inactivos,
        suspendidos,
        ingresosHoy,
        renovacionesMes,
        sociosNuevosMes,
      ] = await Promise.all([
        prisma.socio.count({ where: { estado: 'activo' } }),
        prisma.socio.count({ where: { estado: 'congelado' } }),
        prisma.socio.count({ where: { estado: 'inactivo' } }),
        prisma.socio.count({ where: { estado: 'suspendido' } }),
        prisma.ingreso.count({
          where: {
            fechaIngreso: { gte: hoyInicio, lt: hoyFin },
          },
        }),
        prisma.renovacion.count({
          where: {
            createdAt: { gte: mesInicio },
          },
        }),
        prisma.socio.count({
          where: {
            createdAt: { gte: mesInicio },
          },
        }),
      ]);

      res.json({
        sociosActivos: activos,
        sociosCongelados: congelados,
        sociosVencidos: inactivos,
        sociosSuspendidos: suspendidos,
        ingresosDelDia: ingresosHoy,
        renovacionesDelMes: renovacionesMes,
        sociosNuevos: sociosNuevosMes,
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }

  static async ultimosIngresos(req: AuthRequest, res: Response): Promise<void> {
    try {
      const ingresos = await prisma.ingreso.findMany({
        take: 10,
        orderBy: { fechaIngreso: 'desc' },
        include: {
          socio: {
            select: {
              id: true,
              nombre: true,
              rut: true,
              foto: true,
              estado: true,
            },
          },
        },
      });

      res.json(ingresos);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener últimos ingresos' });
    }
  }
}
