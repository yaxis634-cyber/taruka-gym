'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AccesoEvent } from '@/types';
import { SOCKET_URL } from '@/lib/config';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log('[useSocket] Conectando a', SOCKET_URL);
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('[useSocket] Conectado:', socketRef.current?.id);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('[useSocket] Desconectado:', reason);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('[useSocket] Error conexión:', err.message);
    });

    return () => {
      if (socketRef.current) {
        console.log('[useSocket] Cleanup - desconectando');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const joinAdmin = useCallback(() => {
    console.log('[useSocket] joinAdmin emitido');
    socketRef.current?.emit('join-admin');
  }, []);

  const joinCheck = useCallback((socioId: string) => {
    socketRef.current?.emit('join-check', socioId);
  }, []);

  const onAcceso = useCallback((callback: (data: AccesoEvent) => void) => {
    console.log('[useSocket] Registrando listener nuevo-acceso');
    socketRef.current?.on('nuevo-acceso', callback);
    return () => {
      console.log('[useSocket] Removiendo listener nuevo-acceso');
      socketRef.current?.off('nuevo-acceso', callback);
    };
  }, []);

  const onNotificacion = useCallback((callback: (data: { tipo: string; mensaje: string }) => void) => {
    console.log('[useSocket] Registrando listener nueva-notificacion');
    socketRef.current?.on('nueva-notificacion', callback);
    return () => {
      console.log('[useSocket] Removiendo listener nueva-notificacion');
      socketRef.current?.off('nueva-notificacion', callback);
    };
  }, []);

  return { joinAdmin, joinCheck, onAcceso, onNotificacion, socket: socketRef };
}
