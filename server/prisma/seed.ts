import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.administrador.upsert({
    where: { email: 'admin@tarukagym.cl' },
    update: {},
    create: {
      email: 'admin@tarukagym.cl',
      nombre: 'Administrador',
      password: passwordHash,
      activo: true,
    },
  });

  console.log('Administrador creado:', admin.email);
  console.log('Contraseña: admin123');
  console.log('---');
  console.log('Recuerda cambiar la contraseña en producción');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
