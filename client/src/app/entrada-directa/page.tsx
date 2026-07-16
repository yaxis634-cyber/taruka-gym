'use client';

import { useState, useRef, useEffect } from 'react'
import { UPLOADS_URL } from '@/lib/config';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { format } from 'date-fns';
import { HiOutlineSearch, HiOutlineCheck, HiOutlineX, HiOutlineMinus } from 'react-icons/hi';
import toast from 'react-hot-toast';

interface Resultado {
  socio: {
    id: string;
    nombre: string;
    rut: string;
    foto: string | null;
    estado: string;
    fechaInicio: string;
    fechaTermino: string;
    diasRestantes: number;
    mensaje: string;
    puedeIngresar: boolean;
  };
}

function playSound(type: 'success' | 'error' | 'warning') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'error') {
      osc.type = 'square';
      osc.frequency.value = 200;
      gain.gain.value = 0.3;
      osc.start();
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.frequency.value = 500;
      gain.gain.value = 0.2;
      osc.start();
      osc.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {}
}

export default function EntradaDirectaPage() {
  const { joinAdmin } = useSocket();
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState<Resultado['socio'] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    joinAdmin();
    inputRef.current?.focus();
  }, [joinAdmin]);

  const verificar = async () => {
    const trimmed = codigo.trim();
    if (!trimmed) {
      toast.error('Ingrese un código de socio');
      return;
    }

    setLoading(true);
    setError('');
    setResultado(null);

    try {
      const data = await api.check.verificar(trimmed);
      setResultado(data.socio);
      setAnimKey(k => k + 1);

      if (data.socio.puedeIngresar) {
        playSound('success');
      } else if (data.socio.estado === 'congelado') {
        playSound('warning');
      } else {
        playSound('error');
      }
    } catch (err: any) {
      setError(err.message || 'Código no encontrado');
      playSound('error');
    } finally {
      setLoading(false);
      setCodigo('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      verificar();
    }
  };

  const isActive = resultado?.estado === 'activo';
  const isFrozen = resultado?.estado === 'congelado';

  const bgColor = resultado
    ? isActive
      ? 'from-green-500/10 to-emerald-500/5'
      : isFrozen
      ? 'from-yellow-500/10 to-amber-500/5'
      : 'from-red-500/10 to-rose-500/5'
    : '';

  const borderColor = resultado
    ? isActive
      ? 'border-green-500/30'
      : isFrozen
      ? 'border-yellow-500/30'
      : 'border-red-500/30'
    : 'border-dark-700';

  const accent = isActive ? 'text-green-400' : isFrozen ? 'text-yellow-400' : 'text-red-400';
  const StatusIcon = resultado
    ? resultado.puedeIngresar
      ? HiOutlineCheck
      : isFrozen
      ? HiOutlineMinus
      : HiOutlineX
    : HiOutlineSearch;

  return (
    <DashboardLayout title="Entrada Directa" subtitle="Ingreso manual de código">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="card border-dark-800">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <HiOutlineSearch className="w-5 h-5 text-dark-500" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escanear o escribir código NFC / QR..."
                className="input-field pl-10 text-lg py-3"
                autoComplete="off"
                disabled={loading}
              />
            </div>
            <button
              onClick={verificar}
              disabled={loading || !codigo.trim()}
              className="btn-primary px-6 py-3 flex items-center gap-2 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <HiOutlineSearch className="w-5 h-5" />
                  Verificar
                </>
              )}
            </button>
          </div>
          <p className="text-dark-500 text-xs mt-3">
            Ingrese el código único o código NFC del socio y presione Enter o Verificar
          </p>
        </div>

        {error && (
          <div key={animKey} className="card border-red-500/20 bg-red-500/5 animate-access-flash">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <HiOutlineX className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-semibold text-lg">CÓDIGO NO ENCONTRADO</p>
                <p className="text-dark-400 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {resultado && (
          <div
            key={animKey}
            className={`card bg-gradient-to-br ${bgColor} border-2 ${borderColor} animate-access-flash overflow-hidden`}
          >
            <div className="flex items-start gap-5">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border-2 ${
                  isActive
                    ? 'border-green-500/50 bg-green-500/10'
                    : isFrozen
                    ? 'border-yellow-500/50 bg-yellow-500/10'
                    : 'border-red-500/50 bg-red-500/10'
                }`}
              >
                {resultado.foto ? (
                  <img
                    src={`${UPLOADS_URL}${resultado.foto}`}
                    alt={resultado.nombre}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className={`${accent} text-3xl font-bold`}>
                    {resultado.nombre.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusIcon className={`w-5 h-5 ${accent}`} />
                  <h2 className="text-white text-xl font-bold truncate">{resultado.nombre}</h2>
                </div>
                <p className="text-dark-400 text-sm mb-3">{resultado.rut}</p>

                <div className="flex flex-wrap gap-3 text-sm">
                  <div>
                    <span className="text-dark-500">Inicio</span>
                    <p className="text-white">{format(new Date(resultado.fechaInicio), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <span className="text-dark-500">Término</span>
                    <p className="text-white">{format(new Date(resultado.fechaTermino), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <span className="text-dark-500">Días</span>
                    <p className={accent + ' font-bold'}>{Math.max(0, resultado.diasRestantes)}</p>
                  </div>
                  <div>
                    <span className="text-dark-500">Estado</span>
                    <span
                      className={`badge ${
                        isActive ? 'badge-success' : isFrozen ? 'badge-warning' : 'badge-danger'
                      }`}
                    >
                      {resultado.estado.charAt(0).toUpperCase() + resultado.estado.slice(1)}
                    </span>
                  </div>
                </div>

                <div
                  className={`mt-3 py-2 px-4 rounded-lg text-center text-sm font-semibold ${
                    isActive
                      ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                      : isFrozen
                      ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}
                >
                  {resultado.mensaje}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
