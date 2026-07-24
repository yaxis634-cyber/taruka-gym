import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Taruka26', 10);

  const result = await prisma.socio.updateMany({
    where: { password: null },
    data: { password: passwordHash },
  });

  console.log(`${result.count} socios actualizados con contraseña por defecto (Taruka26)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
