import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { config } from '../config';

export class AuthService {
  static async login(email: string, password: string) {
    const admin = await prisma.administrador.findUnique({
      where: { email },
    });

    if (!admin || !admin.activo) {
      throw new Error('Credenciales inválidas');
    }

    const passwordValido = await bcrypt.compare(password, admin.password);
    if (!passwordValido) {
      throw new Error('Credenciales inválidas');
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        nombre: admin.nombre,
      },
    };
  }

  static async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string };
      const admin = await prisma.administrador.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, nombre: true, activo: true },
      });

      if (!admin || !admin.activo) {
        throw new Error('Token inválido');
      }

      return admin;
    } catch {
      throw new Error('Token inválido');
    }
  }

  static async cambiarPassword(adminId: string, actual: string, nueva: string) {
    const admin = await prisma.administrador.findUnique({
      where: { id: adminId },
    });

    if (!admin) throw new Error('Administrador no encontrado');

    const valido = await bcrypt.compare(actual, admin.password);
    if (!valido) throw new Error('Contraseña actual incorrecta');

    const hash = await bcrypt.hash(nueva, 10);
    await prisma.administrador.update({
      where: { id: adminId },
      data: { password: hash },
    });
  }
}
