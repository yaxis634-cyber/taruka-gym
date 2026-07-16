import cron from 'node-cron';
import prisma from '../config/prisma';

export function iniciarJobVencimiento(): void {
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Revisando membresías vencidas...');

    try {
      const ahora = new Date();

      const resultado = await prisma.socio.updateMany({
        where: {
          fechaTermino: { lt: ahora },
          estado: { notIn: ['inactivo', 'suspendido'] },
        },
        data: {
          estado: 'inactivo',
        },
      });

      console.log(`[CRON] ${resultado.count} socios marcados como inactivos`);

      const tresDias = new Date();
      tresDias.setDate(tresDias.getDate() + 3);
      const hoyFin = new Date();
      hoyFin.setHours(23, 59, 59, 999);

      const porVencer = await prisma.socio.count({
        where: {
          fechaTermino: {
            gte: ahora,
            lte: tresDias,
          },
          estado: { not: 'inactivo' },
        },
      });

      const venceHoy = await prisma.socio.count({
        where: {
          fechaTermino: {
            gte: new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()),
            lte: hoyFin,
          },
          estado: { not: 'inactivo' },
        },
      });

      if (venceHoy > 0) {
        await prisma.notificacion.create({
          data: {
            tipo: 'vencimiento',
            mensaje: `${venceHoy} membresía(s) vencen hoy`,
          },
        });
      }

      if (porVencer > 0) {
        await prisma.notificacion.create({
          data: {
            tipo: 'aviso',
            mensaje: `${porVencer} membresía(s) por vencer en los próximos 3 días`,
          },
        });
      }
    } catch (error) {
      console.error('[CRON] Error al revisar membresías:', error);
    }
  });

  console.log('[CRON] Job de vencimiento programado (cada día a las 00:00)');
}
