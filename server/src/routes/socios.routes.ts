import { Router } from 'express';
import { SociosController } from '../controllers/socios.controller';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagen no permitido'));
    }
  },
});

export const sociosRoutes = Router();

sociosRoutes.use(authMiddleware);

sociosRoutes.get('/exportar', SociosController.exportar);
sociosRoutes.get('/', SociosController.listar);
sociosRoutes.get('/buscar/:codigo', SociosController.buscarPorCodigo);
sociosRoutes.get('/:id', SociosController.obtener);
sociosRoutes.post('/', upload.single('foto'), SociosController.crear);
sociosRoutes.put('/:id', upload.single('foto'), SociosController.actualizar);
sociosRoutes.put('/:id/estado', SociosController.cambiarEstado);
sociosRoutes.delete('/:id', SociosController.eliminar);
