import { Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

export class SociosController {
  static async crear(req: AuthRequest, res: Response): Promise<void> {
    try {
      const codigoUnico = uuidv4().replace(/-/g, '').substring(0, 12);
      let foto: string | null = null;
      if (req.file) {
        foto = `/uploads/${req.file.filename}`;
      }

      const passwordHash = await bcrypt.hash('Taruka26', 10);

      const bodyData: any = {};
      for (const [key, value] of Object.entries(req.body)) {
        if (value === '') {
          bodyData[key] = null;
        } else if (key === 'fechaNacimiento' || key === 'fechaInicio' || key === 'fechaTermino') {
          bodyData[key] = new Date(value as string);
        } else {
          bodyData[key] = value;
        }
      }

      const socio = await prisma.socio.create({
        data: {
          ...bodyData,
          codigoUnico,
          foto,
          password: passwordHash,
        },
      });

      res.status(201).json(socio);
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(400).json({ error: 'RUT, código NFC o email ya existe' });
        return;
      }
      res.status(500).json({ error: 'Error al crear socio' });
    }
  }

  static async listar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const search = req.query.search as string || '';
      const estado = req.query.estado as string || '';

      const where: any = {};

      if (search) {
        where.OR = [
          { nombre: { contains: search, mode: 'insensitive' } },
          { rut: { contains: search, mode: 'insensitive' } },
          { telefono: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { codigoNFC: { contains: search, mode: 'insensitive' } },
          { codigoUnico: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (estado) {
        where.estado = estado;
      }

      const [socios, total] = await Promise.all([
        prisma.socio.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { ingresos: true, renovaciones: true },
            },
          },
        }),
        prisma.socio.count({ where }),
      ]);

      res.json({
        data: socios,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error al listar socios:', error);
      res.status(500).json({ error: 'Error al listar socios' });
    }
  }

  static async obtener(req: AuthRequest, res: Response): Promise<void> {
    try {
      const socio = await prisma.socio.findUnique({
        where: { id: req.params.id },
        include: {
          renovaciones: { orderBy: { createdAt: 'desc' }, take: 10 },
          ingresos: { orderBy: { fechaIngreso: 'desc' }, take: 20 },
        },
      });

      if (!socio) {
        res.status(404).json({ error: 'Socio no encontrado' });
        return;
      }

      res.json(socio);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener socio' });
    }
  }

  static async actualizar(req: AuthRequest, res: Response): Promise<void> {
    try {
      let foto: string | undefined;
      if (req.file) {
        foto = `/uploads/${req.file.filename}`;
      }

      const data: any = {};
      for (const [key, value] of Object.entries(req.body)) {
        if (value === '') {
          data[key] = null;
        } else if (key === 'fechaNacimiento' || key === 'fechaInicio' || key === 'fechaTermino') {
          data[key] = new Date(value as string);
        } else {
          data[key] = value;
        }
      }
      if (foto) data.foto = foto;

      const socio = await prisma.socio.update({
        where: { id: req.params.id },
        data,
      });

      res.json(socio);
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(400).json({ error: 'RUT, código NFC o email ya existe' });
        return;
      }
      res.status(500).json({ error: 'Error al actualizar socio' });
    }
  }

  static async eliminar(req: AuthRequest, res: Response): Promise<void> {
    try {
      await prisma.socio.delete({
        where: { id: req.params.id },
      });

      res.json({ message: 'Socio eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar socio' });
    }
  }

  static async cambiarEstado(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { estado } = req.body;
      const estadosValidos = ['activo', 'congelado', 'inactivo', 'suspendido'];

      if (!estadosValidos.includes(estado)) {
        res.status(400).json({ error: 'Estado inválido' });
        return;
      }

      const socio = await prisma.socio.update({
        where: { id: req.params.id },
        data: { estado },
      });

      res.json(socio);
    } catch (error) {
      res.status(500).json({ error: 'Error al cambiar estado' });
    }
  }

  static async buscarPorCodigo(req: AuthRequest, res: Response): Promise<void> {
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

      res.json(socio);
    } catch (error) {
      res.status(500).json({ error: 'Error al buscar socio' });
    }
  }

  static async exportar(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const socios = await prisma.socio.findMany({
        orderBy: { numeroSocio: 'asc' },
      });

      const data = socios.map((s) => ({
        'N° Socio': s.numeroSocio || '',
        'Nombre': s.nombre,
        'Estado': s.estado.charAt(0).toUpperCase() + s.estado.slice(1),
        'Email': s.email || '',
        'RUT/DNI': s.rut || '',
        'Fecha Nacimiento': s.fechaNacimiento
          ? s.fechaNacimiento.toISOString().split('T')[0]
          : '',
        'Dirección': s.direccion || '',
        'Teléfono': s.telefono || '',
        'Teléfono Emergencia': s.contactoEmergencia || '',
        'Sexo': s.sexo || '',
        'Observación': s.observaciones || '',
        'Código NFC': s.codigoNFC || '',
        'Código QR': s.codigoUnico,
        'Fecha Inicio': s.fechaInicio ? s.fechaInicio.toISOString().split('T')[0] : '',
        'Fecha Término': s.fechaTermino ? s.fechaTermino.toISOString().split('T')[0] : '',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Socios');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=socios_ingresotaruka_${new Date().toISOString().split('T')[0]}.xlsx`
      );
      res.send(buffer);
    } catch (error) {
      console.error('Error al exportar:', error);
      res.status(500).json({ error: 'Error al exportar socios' });
    }
  }
}
