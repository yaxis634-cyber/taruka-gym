'use client';

import { useState, useEffect } from 'react'
import { UPLOADS_URL } from '@/lib/config';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { IoFitnessOutline } from 'react-icons/io5';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CheckData {
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

export default function CheckPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<CheckData['socio'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.check.verificar(id);
        setData(result.socio);
      } catch (err: any) {
        setError(err.message || 'Socio no encontrado');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const isActive = data?.estado === 'activo';
  const isFrozen = data?.estado === 'congelado';

  const themeColor = isActive
    ? 'from-green-500/10 to-emerald-500/5 border-green-500/20'
    : isFrozen
    ? 'from-yellow-500/10 to-amber-500/5 border-yellow-500/20'
    : 'from-red-500/10 to-rose-500/5 border-red-500/20';

  const accentColor = isActive
    ? 'text-green-400'
    : isFrozen
    ? 'text-yellow-400'
    : 'text-red-400';

  const bgAccent = isActive
    ? 'bg-green-500/10'
    : isFrozen
    ? 'bg-yellow-500/10'
    : 'bg-red-500/10';

  const borderAccent = isActive
    ? 'border-green-500/30'
    : isFrozen
    ? 'border-yellow-500/30'
    : 'border-red-500/30';

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 mb-3">
            <IoFitnessOutline className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-white text-lg font-bold tracking-wide">Ingresotaruka</h1>
        </div>

        {loading ? (
          <div className="card border-dark-800 flex items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="card border-red-500/20 bg-red-500/5 text-center py-12">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl font-bold">!</span>
            </div>
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        ) : data ? (
          <div className={`card bg-gradient-to-br ${themeColor} border-2 overflow-hidden`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-28 h-28 rounded-full ${bgAccent} border-2 ${borderAccent} overflow-hidden flex items-center justify-center mb-5`}>
                {data.foto ? (
                  <img
                    src={`${UPLOADS_URL}${data.foto}`}
                    alt={data.nombre}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className={`${accentColor} text-4xl font-bold`}>
                    {data.nombre.charAt(0)}
                  </span>
                )}
              </div>

              <h2 className="text-white text-xl font-bold mb-1">{data.nombre}</h2>
              <p className="text-dark-400 text-sm mb-4">{data.rut}</p>

              <div className={`badge text-sm px-4 py-1.5 mb-4 ${
                isActive ? 'badge-success' :
                isFrozen ? 'badge-warning' : 'badge-danger'
              }`}>
                {data.estado === 'activo' ? 'ACTIVO' : data.estado === 'congelado' ? 'CONGELADO' : 'VENCIDO'}
              </div>

              <div className="w-full space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Fecha inicio</span>
                  <span className="text-white">{format(new Date(data.fechaInicio), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Fecha término</span>
                  <span className="text-white">{format(new Date(data.fechaTermino), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Días restantes</span>
                  <span className={accentColor + ' font-bold'}>
                    {data.diasRestantes > 0 ? data.diasRestantes : 0}
                  </span>
                </div>
              </div>

              <div className={`w-full mt-5 py-3 px-4 rounded-xl ${bgAccent} border ${borderAccent}`}>
                <p className={`${accentColor} font-semibold text-sm`}>{data.mensaje}</p>
              </div>
            </div>
          </div>
        ) : null}

        <p className="text-center text-dark-600 text-xs mt-8">
          Ingresotaruka &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
