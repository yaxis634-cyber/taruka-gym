import { createApp } from './app';
import prisma from './config/prisma';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const CLIENT_URL = process.env.CLIENT_URL || `http://localhost:${PORT}`;

const { server } = createApp(CLIENT_URL);

async function start() {
  try {
    await prisma.$connect();
    console.log('Base de datos conectada');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`TARUKA GYM producción en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar:', error);
    process.exit(1);
  }
}

start();
