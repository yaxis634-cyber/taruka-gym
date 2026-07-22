import { Request, Response } from 'express';
import { Server } from 'socket.io';
import prisma from '../config/prisma';
import { emitirAcceso } from '../sockets';

export class CheckController {
  static async verSocio(req: Request, res: Response): Promise<void> {
    try {
      const { codigo } = req.params;

      const socio = await prisma.socio.findFirst({
        where: {
          OR: [
            { codigoUnico: codigo },
            { codigoNFC: codigo },
          ],
        },
      });

      if (!socio) {
        res.status(404).json({ error: 'Socio no encontrado' });
        return;
      }

      const ahora = new Date();
      const diasRestantes = socio.fechaTermino
        ? Math.ceil((socio.fechaTermino.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
        : -1;

      let estadoDisplay: string;
      let mensaje: string;
      let puedeIngresar: boolean;

      if (socio.estado === 'activo' && diasRestantes > 0) {
        estadoDisplay = 'activo';
        mensaje = 'Membresía Vigente';
        puedeIngresar = true;
      } else if (socio.estado === 'congelado') {
        estadoDisplay = 'congelado';
        mensaje = 'Membresía Congelada';
        puedeIngresar = false;
      } else if (socio.estado === 'suspendido') {
        estadoDisplay = 'suspendido';
        mensaje = 'Membresía Suspendida';
        puedeIngresar = false;
      } else {
        estadoDisplay = 'vencido';
        mensaje = 'Membresía Vencida';
        puedeIngresar = false;
      }

      const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.socket.remoteAddress ||
        '';

      await prisma.ingreso.create({
        data: {
          socioId: socio.id,
          estado: estadoDisplay,
          dispositivo: req.headers['user-agent'],
          ip,
        },
      });

      const io = req.app.get('io') as Server;

      emitirAcceso(io, {
        socioId: socio.id,
        nombre: socio.nombre,
        foto: socio.foto,
        estado: estadoDisplay,
        fechaInicio: socio.fechaInicio?.toISOString() || '',
        fechaTermino: socio.fechaTermino?.toISOString() || '',
        puedeIngresar,
        mensaje,
      });

      res.json({
        socio: {
          id: socio.id,
          nombre: socio.nombre,
          rut: socio.rut,
          foto: socio.foto,
          estado: estadoDisplay,
          fechaInicio: socio.fechaInicio,
          fechaTermino: socio.fechaTermino,
          diasRestantes,
          mensaje,
          puedeIngresar,
        },
      });
    } catch (error) {
      console.error('Error en check:', error);
      res.status(500).json({ error: 'Error al verificar socio' });
    }
  }
}
