import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export class RenovacionesController {
  static async renovar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { socioId, dias, fechaManual } = req.body;

      const socio = await prisma.socio.findUnique({
        where: { id: socioId },
      });

      if (!socio) {
        res.status(404).json({ error: 'Socio no encontrado' });
        return;
      }

      const fechaTerminoActual = socio.fechaTermino || new Date();

      let fechaActual = new Date();
      if (fechaTerminoActual > fechaActual) {
        fechaActual = fechaTerminoActual;
      }

      let nuevaFecha: Date;
      if (dias && !fechaManual) {
        nuevaFecha = new Date(fechaActual);
        nuevaFecha.setDate(nuevaFecha.getDate() + dias);
      } else if (fechaManual) {
        nuevaFecha = new Date(fechaManual);
      } else {
        res.status(400).json({ error: 'Debe especificar días o fecha manual' });
        return;
      }

      const diasReales = Math.ceil(
        (nuevaFecha.getTime() - fechaTerminoActual.getTime()) / (1000 * 60 * 60 * 24)
      );

      const [renovacion] = await prisma.$transaction([
        prisma.renovacion.create({
          data: {
            socioId,
            dias: diasReales > 0 ? diasReales : dias || 0,
            fechaAntes: fechaTerminoActual,
            fechaNueva: nuevaFecha,
          },
        }),
        prisma.socio.update({
          where: { id: socioId },
          data: {
            fechaTermino: nuevaFecha,
            estado: 'activo',
          },
        }),
      ]);

      res.status(201).json(renovacion);
    } catch (error) {
      console.error('Error al renovar:', error);
      res.status(500).json({ error: 'Error al renovar membresía' });
    }
  }

  static async historial(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { socioId } = req.params;
      const renovaciones = await prisma.renovacion.findMany({
        where: { socioId },
        orderBy: { createdAt: 'desc' },
      });

      res.json(renovaciones);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener historial' });
    }
  }
}
