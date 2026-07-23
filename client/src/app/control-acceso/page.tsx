'use client';

import { useState, useEffect, useCallback, useRef } from 'react'
import { UPLOADS_URL } from '@/lib/config';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { AccesoEvent, Ingreso } from '@/types';
import { format } from 'date-fns';
import {
  HiOutlineShieldCheck,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineMinus,
  HiOutlineLogin,
} from 'react-icons/hi';

interface NotificacionAcceso {
  id: string;
  socioId: string;
  nombre: string;
  foto: string | null;
  estado: string;
  fechaInicio: string;
  fechaTermino: string;
  puedeIngresar: boolean;
  mensaje: string;
  hora: Date;
}

function playSound(type: 'success' | 'error' | 'warning') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      osc.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'error') {
      osc.type = 'square';
      osc.frequency.value = 180;
      gain.gain.value = 0.25;
      osc.start();
      osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.4);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      osc.stop(ctx.currentTime + 0.6);
    } else {
      osc.type = 'triangle';
      osc.frequency.value = 440;
      gain.gain.value = 0.2;
      osc.start();
      osc.frequency.linearRampToValueAtTime(350, ctx.currentTime + 0.15);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {}
}

function NotificacionCard({
  notif,
  onDismiss,
}: {
  notif: NotificacionAcceso;
  onDismiss: (id: string) => void;
}) {
  const isActivo = notif.estado === 'activo';
  const isCongelado = notif.estado === 'congelado';

  const bg = isActivo
    ? 'from-green-500/15 to-emerald-600/10 border-green-500/40'
    : isCongelado
    ? 'from-yellow-500/15 to-amber-600/10 border-yellow-500/40'
    : 'from-red-500/15 to-rose-600/10 border-red-500/40';

  const accent = isActivo ? 'text-green-400' : isCongelado ? 'text-yellow-400' : 'text-red-400';
  const badgeStyle = isActivo ? 'badge-success' : isCongelado ? 'badge-warning' : 'badge-danger';

  const estadoLabel =
    notif.estado === 'activo'
      ? 'ACTIVO'
      : notif.estado === 'congelado'
      ? 'CONGELADO'
      : 'VENCIDO';

  const StatusIcon = isActivo
    ? HiOutlineCheck
    : isCongelado
    ? HiOutlineMinus
    : HiOutlineX;

  return (
    <div
      className={`card bg-gradient-to-br ${bg} border-2 animate-access-flash relative overflow-hidden`}
    >
      <button
        onClick={() => onDismiss(notif.id)}
        className="absolute top-3 right-3 p-1 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/50 transition-colors z-10"
      >
        <HiOutlineX className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border-2 ${
            isActivo
              ? 'border-green-500/50 bg-green-500/10'
              : isCongelado
              ? 'border-yellow-500/50 bg-yellow-500/10'
              : 'border-red-500/50 bg-red-500/10'
          }`}
        >
          {notif.foto ? (
            <img
              src={`${UPLOADS_URL}${notif.foto}`}
              alt={notif.nombre}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className={`${accent} text-2xl font-bold`}>
              {notif.nombre.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-dark-400 text-[10px] uppercase tracking-widest font-semibold mb-1">
            PERSONA IDENTIFICADA
          </p>
          <h3 className="text-white text-lg font-bold truncate">{notif.nombre}</h3>

          <div className="flex items-center gap-2 mt-2">
            <StatusIcon className={`w-4 h-4 ${accent}`} />
            <span className={`badge ${badgeStyle}`}>{estadoLabel}</span>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs">
            <div>
              <span className="text-dark-500">Hora</span>
              <p className="text-white font-mono">{format(notif.hora, 'HH:mm:ss')}</p>
            </div>
            <div>
              <span className="text-dark-500">Ingreso</span>
              {isActivo ? (
                <p className="text-green-400 font-semibold">PERMITIDO</p>
              ) : (
                <p className="text-red-400 font-semibold">NO AUTORIZAR</p>
              )}
            </div>
          </div>

          <p className={`text-sm mt-2 font-medium ${accent}`}>{notif.mensaje}</p>
        </div>
      </div>
    </div>
  );
}

export default function ControlAccesoPage() {
  const { joinAdmin, onAcceso } = useSocket();
  const [notificaciones, setNotificaciones] = useState<NotificacionAcceso[]>([]);
  const [historial, setHistorial] = useState<Ingreso[]>([]);
  const idCounter = useRef(0);
  const lastCheckRef = useRef<string | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  const addNotificacion = useCallback((notif: Omit<NotificacionAcceso, 'id' | 'hora'>, hora: Date) => {
    const key = `${notif.socioId}-${hora.toISOString()}`;
    if (notifiedRef.current.has(key)) return;
    notifiedRef.current.add(key);
    if (notifiedRef.current.size > 50) notifiedRef.current.clear();

    const id = `notif-${++idCounter.current}-${Date.now()}`;
    const nueva: NotificacionAcceso = { id, ...notif, hora };
    setNotificaciones((prev) => [nueva, ...prev].slice(0, 20));
    setTimeout(() => {
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    }, 15000);
  }, []);

  const fetchHistorial = useCallback(async () => {
    try {
      const data = await api.dashboard.ultimosIngresos();
      setHistorial(data);

      if (data.length > 0 && data[0].fechaIngreso !== lastCheckRef.current) {
        lastCheckRef.current = data[0].fechaIngreso;
        const nuevo = data[0];
        addNotificacion({
          socioId: nuevo.socioId,
          nombre: nuevo.socio?.nombre || 'Desconocido',
          foto: nuevo.socio?.foto || null,
          estado: nuevo.estado,
          fechaInicio: '',
          fechaTermino: '',
          puedeIngresar: nuevo.estado === 'activo',
          mensaje: nuevo.estado === 'activo' ? 'Acceso Permitido' : 'Acceso Denegado',
        }, new Date(nuevo.fechaIngreso));
      }
    } catch {}
  }, [addNotificacion]);

  useEffect(() => {
    joinAdmin();
    fetchHistorial();
    const interval = setInterval(fetchHistorial, 3000);
    return () => clearInterval(interval);
  }, [joinAdmin, fetchHistorial]);

  useEffect(() => {
    const unsubscribe = onAcceso((data: AccesoEvent) => {
      if (data.puedeIngresar) {
        playSound('success');
      } else if (data.estado === 'congelado') {
        playSound('warning');
      } else {
        playSound('error');
      }

      addNotificacion({
        socioId: data.socioId,
        nombre: data.nombre,
        foto: data.foto,
        estado: data.estado,
        fechaInicio: data.fechaInicio,
        fechaTermino: data.fechaTermino,
        puedeIngresar: data.puedeIngresar,
        mensaje: data.mensaje,
      }, new Date());

      fetchHistorial();
    });

    return () => {
      unsubscribe();
    };
  }, [onAcceso, fetchHistorial, addNotificacion]);

  const dismissNotif = (id: string) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <DashboardLayout title="Control de Acceso" subtitle="Monitoreo de ingresos en tiempo real">
      <div className="space-y-6 animate-fade-in">
        <div className="card border-dark-800 min-h-[120px]">
          {notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center mb-4 animate-pulse-slow">
                <HiOutlineShieldCheck className="w-8 h-8 text-dark-600" />
              </div>
              <p className="text-dark-500 text-lg font-medium">Esperando escaneo...</p>
              <p className="text-dark-600 text-sm mt-1">
                El sistema detectará automáticamente cuando un cliente escanee su NFC o QR
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notificaciones.map((notif) => (
                <NotificacionCard key={notif.id} notif={notif} onDismiss={dismissNotif} />
              ))}
            </div>
          )}
        </div>

        <div className="card border-dark-800">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineLogin className="w-5 h-5 text-dark-400" />
            <h3 className="text-white font-semibold">Historial de Ingresos</h3>
            <span className="text-dark-500 text-sm ml-auto">
              Últimos {historial.length}
            </span>
          </div>

          {historial.length === 0 ? (
            <p className="text-dark-500 text-sm text-center py-8">
              Aún no hay ingresos registrados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-dark-800">
                    <th className="pb-3 pr-4 text-dark-400 text-xs font-medium uppercase tracking-wider">
                      Socio
                    </th>
                    <th className="pb-3 px-4 text-dark-400 text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
                      Fecha/Hora
                    </th>
                    <th className="pb-3 px-4 text-dark-400 text-xs font-medium uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="pb-3 pl-4 text-dark-400 text-xs font-medium uppercase tracking-wider">
                      Resultado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {historial.map((ingreso) => {
                    const isPermitido = ingreso.estado === 'activo';
                    const StatusIcon = isPermitido ? HiOutlineCheck : HiOutlineX;
                    return (
                      <tr
                        key={ingreso.id}
                        className="hover:bg-dark-800/50 transition-colors animate-fade-in"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {ingreso.socio?.foto ? (
                                <img
                                  src={`${UPLOADS_URL}${ingreso.socio.foto}`}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-dark-400 text-xs font-medium">
                                  {ingreso.socio?.nombre?.charAt(0) || '?'}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium truncate max-w-[200px]">
                                {ingreso.socio?.nombre || 'Desconocido'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-dark-300 text-sm font-mono hidden sm:table-cell whitespace-nowrap">
                          {format(new Date(ingreso.fechaIngreso), 'dd/MM/yyyy HH:mm:ss')}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`badge ${
                              ingreso.estado === 'activo'
                                ? 'badge-success'
                                : ingreso.estado === 'congelado'
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {ingreso.estado === 'activo'
                              ? 'ACTIVO'
                              : ingreso.estado === 'congelado'
                              ? 'CONGELADO'
                              : 'VENCIDO'}
                          </span>
                        </td>
                        <td className="py-3 pl-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              isPermitido ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {isPermitido ? 'PERMITIDO' : 'DENEGADO'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
