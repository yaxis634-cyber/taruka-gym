import { createApp } from './app';
import prisma from './config/prisma';
import { config } from './config';

const { server } = createApp();

async function start() {
  try {
    await prisma.$connect();
    console.log('Base de datos conectada');

    server.listen(config.port, () => {
      console.log(`Servidor Ingresotaruka corriendo en puerto ${config.port}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

start();
