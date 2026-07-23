import { Response } from 'express';
import { Server } from 'socket.io';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import { config } from '../config';
import { emitirAcceso } from '../sockets';

export class AuthController {
  static async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email y contraseña son requeridos' });
        return;
      }

      const result = await AuthService.login(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      const admin = await AuthService.verifyToken(
        req.headers.authorization?.split(' ')[1] || ''
      );
      res.json(admin);
    } catch {
      res.status(401).json({ error: 'No autorizado' });
    }
  }

  static async cambiarPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { actual, nueva } = req.body;
      await AuthService.cambiarPassword(req.adminId!, actual, nueva);
      res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async clienteLogin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email y contraseña son requeridos' });
        return;
      }

      const socio = await prisma.socio.findFirst({
        where: { email, password: { not: null } },
      });

      if (!socio) {
        res.status(401).json({ error: 'Credenciales inválidas' });
        return;
      }

      const valido = await bcrypt.compare(password, socio.password!);
      if (!valido) {
        res.status(401).json({ error: 'Credenciales inválidas' });
        return;
      }

      const token = jwt.sign(
        { id: socio.id, email: socio.email, tipo: 'cliente' },
        config.jwtSecret,
        { expiresIn: '7d' } as jwt.SignOptions
      );

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

      await prisma.ingreso.create({
        data: {
          socioId: socio.id,
          estado: estadoDisplay,
          dispositivo: req.headers['user-agent'],
          ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '',
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
        token,
        socio: {
          id: socio.id,
          codigoUnico: socio.codigoUnico,
          nombre: socio.nombre,
          email: socio.email,
          foto: socio.foto,
          estado: socio.estado,
          fechaInicio: socio.fechaInicio,
          fechaTermino: socio.fechaTermino,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  }

  static async clienteMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string; tipo: string };

      if (decoded.tipo !== 'cliente') {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const socio = await prisma.socio.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          codigoUnico: true,
          nombre: true,
          email: true,
          foto: true,
          estado: true,
          fechaInicio: true,
          fechaTermino: true,
        },
      });

      if (!socio) {
        res.status(404).json({ error: 'Socio no encontrado' });
        return;
      }

      res.json(socio);
    } catch {
      res.status(401).json({ error: 'Token inválido' });
    }
  }
}
