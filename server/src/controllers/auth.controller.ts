import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import { config } from '../config';

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
