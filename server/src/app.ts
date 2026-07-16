import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { Server } from 'socket.io';
import { config } from './config';
import { authRoutes } from './routes/auth.routes';
import { sociosRoutes } from './routes/socios.routes';
import { ingresosRoutes } from './routes/ingresos.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { renovacionesRoutes } from './routes/renovaciones.routes';
import { checkRoutes } from './routes/check.routes';
import { notificacionesRoutes } from './routes/notificaciones.routes';
import { setupSocketIO } from './sockets';
import { iniciarJobVencimiento } from './jobs/vencimiento';
import { errorHandler } from './middleware/errorHandler';

export function createApp(clientUrl?: string) {
  const app = express();
  const server = http.createServer(app);

  const origin = clientUrl || config.clientUrl;

  const io = new Server(server, {
    cors: {
      origin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  app.set('io', io);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, '..', config.uploadsDir)));

  app.use('/api/auth', authRoutes);
  app.use('/api/socios', sociosRoutes);
  app.use('/api/ingresos', ingresosRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/renovaciones', renovacionesRoutes);
  app.use('/api/check', checkRoutes);
  app.use('/api/notificaciones', notificacionesRoutes);

  app.use(errorHandler);

  setupSocketIO(io);
  iniciarJobVencimiento();

  return { app, server, io };
}
