'use client';

import { useState, useEffect } from 'react'
import { UPLOADS_URL } from '@/lib/config';
import { IoFitnessOutline } from 'react-icons/io5';
import { HiOutlineLogout, HiOutlineCalendar, HiOutlineClock, HiOutlineCheck, HiOutlineX, HiOutlineMinus, HiOutlineQrcode, HiOutlineLink } from 'react-icons/hi';
import { format, differenceInDays } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '${UPLOADS_URL}/api';
const FRONT_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

interface ClienteData {
  id: string;
  codigoUnico: string;
  nombre: string;
  email: string;
  foto: string | null;
  estado: string;
  fechaInicio: string;
  fechaTermino: string;
}

export default function ClientePanelPage() {
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const cargarDatos = async () => {
    const stored = localStorage.getItem('cliente_data');
    const token = localStorage.getItem('cliente_token');

    if (!stored || !token) {
      window.location.href = '/cliente/login';
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const res = await fetch(`${API_URL}/auth/cliente/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCliente(data);
        localStorage.setItem('cliente_data', JSON.stringify(data));
      } else {
        setCliente(parsed);
      }
    } catch {
      setCliente(JSON.parse(stored));
    }
    setLoading(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleLogout = () => {
    localStorage.removeItem('cliente_token');
    localStorage.removeItem('cliente_data');
    window.location.href = '/cliente/login';
  };

  const miUrl = cliente ? `${FRONT_URL}/check/${cliente.codigoUnico}` : '';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(miUrl)}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cliente) return null;

  const ahora = new Date();
  const diasRestantes = differenceInDays(new Date(cliente.fechaTermino), ahora);
  const isActivo = cliente.estado === 'activo' && diasRestantes > 0;
  const isCongelado = cliente.estado === 'congelado';

  const themeColor = isActivo
    ? 'from-green-500/10 border-green-500/20'
    : isCongelado
    ? 'from-yellow-500/10 border-yellow-500/20'
    : 'from-red-500/10 border-red-500/20';

  const accent = isActivo ? 'text-green-400' : isCongelado ? 'text-yellow-400' : 'text-red-400';
  const StatusIcon = isActivo ? HiOutlineCheck : isCongelado ? HiOutlineMinus : HiOutlineX;

  return (
    <div className="min-h-screen bg-dark-950 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <IoFitnessOutline className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-white text-lg font-bold">TARUKA GYM</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <HiOutlineLogout className="w-5 h-5" />
          </button>
        </div>

        <div className={`card bg-gradient-to-br ${themeColor} border-2 mb-4`}>
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden mb-4 border-2 ${
                isActivo
                  ? 'border-green-500/50 bg-green-500/10'
                  : isCongelado
                  ? 'border-yellow-500/50 bg-yellow-500/10'
                  : 'border-red-500/50 bg-red-500/10'
              }`}
            >
              {cliente.foto ? (
                <img
                  src={`${UPLOADS_URL}${cliente.foto}`}
                  alt={cliente.nombre}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className={`${accent} text-3xl font-bold`}>
                  {cliente.nombre.charAt(0)}
                </span>
              )}
            </div>

            <h2 className="text-white text-xl font-bold mb-1">{cliente.nombre}</h2>
            <p className="text-dark-400 text-sm mb-3">{cliente.email}</p>

            <div className="flex items-center gap-2 mb-4">
              <StatusIcon className={`w-5 h-5 ${accent}`} />
              <span
                className={`badge ${
                  isActivo ? 'badge-success' : isCongelado ? 'badge-warning' : 'badge-danger'
                } text-sm px-3 py-1`}
              >
                {isActivo ? 'ACTIVO' : isCongelado ? 'CONGELADO' : 'VENCIDO'}
              </span>
            </div>

            <div
              className={`w-full rounded-xl p-4 mb-4 ${
                isActivo
                  ? 'bg-green-500/10 border border-green-500/20'
                  : isCongelado
                  ? 'bg-yellow-500/10 border border-yellow-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}
            >
              <p className={`text-lg font-bold ${accent}`}>
                {isActivo
                  ? 'MEMBRESÍA VIGENTE'
                  : isCongelado
                  ? 'MEMBRESÍA CONGELADA'
                  : 'MEMBRESÍA VENCIDA'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-dark-700">
              <span className="text-dark-400 text-sm flex items-center gap-2">
                <HiOutlineCalendar className="w-4 h-4" />
                Fecha inicio
              </span>
              <span className="text-white text-sm">
                {format(new Date(cliente.fechaInicio), 'dd/MM/yyyy')}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-dark-700">
              <span className="text-dark-400 text-sm flex items-center gap-2">
                <HiOutlineCalendar className="w-4 h-4" />
                Fecha término
              </span>
              <span className="text-white text-sm">
                {format(new Date(cliente.fechaTermino), 'dd/MM/yyyy')}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-dark-400 text-sm flex items-center gap-2">
                <HiOutlineClock className="w-4 h-4" />
                Días restantes
              </span>
              <span className={`text-lg font-bold ${accent}`}>
                {diasRestantes > 0 ? diasRestantes : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="card border-dark-800 bg-dark-900/80 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineQrcode className="w-5 h-5 text-primary-400" />
            <h3 className="text-white font-semibold text-sm">Tu código QR de acceso</h3>
          </div>
          <p className="text-dark-500 text-xs mb-3">
            Guarda esta imagen o enlace. Al escanear este QR en la entrada del gimnasio, verás tu estado al instante sin necesidad de iniciar sesión.
          </p>
          <div className="flex justify-center mb-3">
            <img
              src={qrUrl}
              alt="QR de acceso"
              className="w-48 h-48 bg-white p-2 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2 bg-dark-800 rounded-lg p-2.5">
            <HiOutlineLink className="w-4 h-4 text-dark-500 flex-shrink-0" />
            <input
              type="text"
              readOnly
              value={miUrl}
              className="bg-transparent text-dark-300 text-xs flex-1 outline-none font-mono truncate"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(miUrl);
                alert('Enlace copiado');
              }}
              className="text-primary-400 text-xs hover:text-primary-300 whitespace-nowrap"
            >
              Copiar
            </button>
          </div>
        </div>

        <p className="text-center text-dark-600 text-xs">
          TARUKA GYM &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
