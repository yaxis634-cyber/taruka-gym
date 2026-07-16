'use client';

import { useState, useEffect } from 'react'
import { UPLOADS_URL } from '@/lib/config';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { DashboardStats, Ingreso } from '@/types';
import {
  HiOutlineUserGroup,
  HiOutlinePause,
  HiOutlineExclamationCircle,
  HiOutlineLogin,
  HiOutlineRefresh,
  HiOutlineUserAdd,
} from 'react-icons/hi';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const statCards = [
  { key: 'sociosActivos', label: 'Socios Activos', icon: HiOutlineUserGroup, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { key: 'sociosCongelados', label: 'Congelados', icon: HiOutlinePause, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { key: 'sociosVencidos', label: 'Vencidos', icon: HiOutlineExclamationCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { key: 'ingresosDelDia', label: 'Ingresos Hoy', icon: HiOutlineLogin, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { key: 'renovacionesDelMes', label: 'Renov. del Mes', icon: HiOutlineRefresh, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { key: 'sociosNuevos', label: 'Socios Nuevos', icon: HiOutlineUserAdd, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
];

function SkeletonCard() {
  return (
    <div className="card border-dark-800 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-3 bg-dark-800 rounded w-24" />
          <div className="h-8 bg-dark-800 rounded w-16" />
        </div>
        <div className="w-10 h-10 bg-dark-800 rounded-lg" />
      </div>
    </div>
  );
}

function StatusBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    activo: 'badge badge-success',
    congelado: 'badge badge-warning',
    inactivo: 'badge badge-danger',
    suspendido: 'badge badge-danger',
  };

  const labels: Record<string, string> = {
    activo: 'Permitido',
    congelado: 'Congelado',
    inactivo: 'Rechazado',
    suspendido: 'Suspendido',
  };

  return <span className={styles[estado] || 'badge badge-danger'}>{labels[estado] || estado}</span>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, ingresosData] = await Promise.all([
          api.dashboard.stats(),
          api.dashboard.ultimosIngresos(),
        ]);
        setStats(statsData);
        setIngresos(ingresosData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout title="Dashboard" subtitle="Resumen general del gimnasio">
      <div className="space-y-6 animate-fade-in">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : statCards.map((card) => {
                const Icon = card.icon;
                const value = stats ? (stats as any)[card.key] : 0;
                return (
                  <div key={card.key} className="card border-dark-800 hover:border-dark-700 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-dark-400 text-sm">{card.label}</p>
                        <p className="text-white text-3xl font-bold mt-1">{value}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg ${card.bg} ${card.border} border flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        <div className="card border-dark-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Últimos Ingresos</h3>
            <span className="text-dark-500 text-sm">Últimos {ingresos.length}</span>
          </div>

          {ingresos.length === 0 && !loading ? (
            <p className="text-dark-500 text-sm text-center py-8">No hay ingresos registrados hoy</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-dark-800">
                    <th className="pb-3 text-dark-400 text-xs font-medium uppercase tracking-wider">Socio</th>
                    <th className="pb-3 text-dark-400 text-xs font-medium uppercase tracking-wider">Fecha</th>
                    <th className="pb-3 text-dark-400 text-xs font-medium uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {ingresos.map((ingreso) => (
                    <tr key={ingreso.id} className="animate-fade-in">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center text-dark-400 text-xs font-medium uppercase">
                            {ingreso.socio?.foto ? (
                              <img src={`${UPLOADS_URL}${ingreso.socio.foto}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              ingreso.socio?.nombre?.charAt(0) || '?'
                            )}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{ingreso.socio?.nombre}</p>
                            <p className="text-dark-500 text-xs">{ingreso.socio?.rut}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <p className="text-dark-300 text-sm">
                          {format(new Date(ingreso.fechaIngreso), 'dd/MM/yyyy HH:mm')}
                        </p>
                        <p className="text-dark-500 text-xs">
                          {formatDistanceToNow(new Date(ingreso.fechaIngreso), { addSuffix: true, locale: es })}
                        </p>
                      </td>
                      <td className="py-3">
                        <StatusBadge estado={ingreso.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
