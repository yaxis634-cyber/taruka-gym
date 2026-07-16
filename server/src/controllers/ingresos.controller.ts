import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export class IngresosController {
  static async listar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 30;
      const skip = (page - 1) * limit;
      const fechaDesde = req.query.fechaDesde as string;
      const fechaHasta = req.query.fechaHasta as string;
      const socioId = req.query.socioId as string;
      const pudoIngresar = req.query.pudoIngresar as string;

      const where: any = {};

      if (fechaDesde || fechaHasta) {
        where.fechaIngreso = {};
        if (fechaDesde) {
          where.fechaIngreso.gte = new Date(fechaDesde);
        }
        if (fechaHasta) {
          const hasta = new Date(fechaHasta);
          hasta.setHours(23, 59, 59, 999);
          where.fechaIngreso.lte = hasta;
        }
      }

      if (socioId) where.socioId = socioId;
      if (pudoIngresar === 'si') where.estado = 'activo';
      if (pudoIngresar === 'no') where.estado = { not: 'activo' };

      const [ingresos, total] = await Promise.all([
        prisma.ingreso.findMany({
          where,
          skip,
          take: limit,
          orderBy: { fechaIngreso: 'desc' },
          include: {
            socio: {
              select: {
                id: true,
                nombre: true,
                rut: true,
                foto: true,
                codigoUnico: true,
              },
            },
          },
        }),
        prisma.ingreso.count({ where }),
      ]);

      res.json({
        data: ingresos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error al listar ingresos:', error);
      res.status(500).json({ error: 'Error al listar ingresos' });
    }
  }
}
