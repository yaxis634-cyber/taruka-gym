'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AccesoEvent } from '@/types';
import { SOCKET_URL } from '@/lib/config';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const joinAdmin = useCallback(() => {
    socketRef.current?.emit('join-admin');
  }, []);

  const joinCheck = useCallback((socioId: string) => {
    socketRef.current?.emit('join-check', socioId);
  }, []);

  const onAcceso = useCallback((callback: (data: AccesoEvent) => void) => {
    socketRef.current?.on('nuevo-acceso', callback);
    return () => {
      socketRef.current?.off('nuevo-acceso', callback);
    };
  }, []);

  const onNotificacion = useCallback((callback: (data: { tipo: string; mensaje: string }) => void) => {
    socketRef.current?.on('nueva-notificacion', callback);
    return () => {
      socketRef.current?.off('nueva-notificacion', callback);
    };
  }, []);

  return { joinAdmin, joinCheck, onAcceso, onNotificacion, socket: socketRef };
}
