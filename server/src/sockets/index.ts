import { Server, Socket } from 'socket.io';

export function setupSocketIO(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('join-admin', () => {
      socket.join('admin-room');
      console.log('Admin unido a sala:', socket.id);
    });

    socket.on('join-check', (socioId: string) => {
      socket.join(`check-${socioId}`);
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });
}

export function emitirAcceso(io: Server, data: {
  socioId: string;
  nombre: string;
  foto: string | null;
  estado: string;
  fechaInicio: string;
  fechaTermino: string;
  puedeIngresar: boolean;
  mensaje: string;
}): void {
  const adminSockets = io.sockets.adapter.rooms.get('admin-room');
  const checkSockets = io.sockets.adapter.rooms.get(`check-${data.socioId}`);
  console.log(`[Socket] emitirAcceso → ${data.nombre} (${data.estado}) | admin-room: ${adminSockets?.size || 0} sockets | check: ${checkSockets?.size || 0} sockets`);
  io.to('admin-room').emit('nuevo-acceso', data);
  io.to(`check-${data.socioId}`).emit('acceso-registrado', data);
}

export function emitirNotificacion(io: Server, notificacion: {
  tipo: string;
  mensaje: string;
}): void {
  io.to('admin-room').emit('nueva-notificacion', notificacion);
}
