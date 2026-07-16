'use client';

import { useState, useEffect, useCallback } from 'react'
import { UPLOADS_URL } from '@/lib/config';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { Ingreso, Pagination } from '@/types';
import { format } from 'date-fns';
import {
  HiOutlineCheck,
  HiOutlineX,
} from 'react-icons/hi';

export default function HistorialPage() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [resultado, setResultado] = useState('');
  const [page, setPage] = useState(1);

  const fetchIngresos = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: page.toString(), limit: '25' };
      if (fechaDesde) params.fechaDesde = fechaDesde;
      if (fechaHasta) params.fechaHasta = fechaHasta;
      if (resultado) params.pudoIngresar = resultado;

      const { data, pagination: pag } = await api.ingresos.listar(params);
      setIngresos(data);
      setPagination(pag);
    } catch {}
    finally { setLoading(false); }
  }, [page, fechaDesde, fechaHasta, resultado]);

  useEffect(() => { fetchIngresos(); }, [fetchIngresos]);

  const aplicarFiltros = () => {
    setPage(1);
    fetchIngresos();
  };

  const limpiarFiltros = () => {
    setFechaDesde('');
    setFechaHasta('');
    setResultado('');
    setPage(1);
  };

  return (
    <DashboardLayout title="Historial" subtitle="Registro de ingresos">
      <div className="space-y-4 animate-fade-in">
        <div className="card border-dark-800">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-dark-400 text-xs mb-1">Desde</label>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="input-field w-auto" />
            </div>
            <div>
              <label className="block text-dark-400 text-xs mb-1">Hasta</label>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="input-field w-auto" />
            </div>
            <div>
              <label className="block text-dark-400 text-xs mb-1">Resultado</label>
              <select value={resultado} onChange={e => setResultado(e.target.value)} className="input-field w-auto">
                <option value="">Todos</option>
                <option value="si">Permitidos</option>
                <option value="no">Denegados</option>
              </select>
            </div>
            <button onClick={aplicarFiltros} className="btn-primary text-sm py-2">Filtrar</button>
            <button onClick={limpiarFiltros} className="btn-secondary text-sm py-2">Limpiar</button>
          </div>
        </div>

        {loading ? (
          <div className="card border-dark-800">
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <div className="w-8 h-8 bg-dark-800 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-dark-800 rounded w-32" />
                    <div className="h-2 bg-dark-800 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : ingresos.length === 0 ? (
          <div className="card border-dark-800 text-center py-12">
            <p className="text-dark-500">No se encontraron registros de ingreso</p>
          </div>
        ) : (
          <>
            <div className="card border-dark-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-dark-800">
                      <th className="pb-3 px-4 text-dark-400 text-xs font-medium uppercase tracking-wider">Socio</th>
                      <th className="pb-3 px-4 text-dark-400 text-xs font-medium uppercase tracking-wider hidden sm:table-cell">RUT</th>
                      <th className="pb-3 px-4 text-dark-400 text-xs font-medium uppercase tracking-wider">Fecha/Hora</th>
                      <th className="pb-3 px-4 text-dark-400 text-xs font-medium uppercase tracking-wider">Resultado</th>
                      <th className="pb-3 px-4 text-dark-400 text-xs font-medium uppercase tracking-wider hidden lg:table-cell">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800">
                    {ingresos.map((ingreso) => {
                      const isPermitido = ingreso.estado === 'activo';
                      const StatusIcon = isPermitido ? HiOutlineCheck : HiOutlineX;
                      return (
                        <tr key={ingreso.id} className="hover:bg-dark-800/50 transition-colors animate-fade-in">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {ingreso.socio?.foto ? (
                                  <img src={`${UPLOADS_URL}${ingreso.socio.foto}`} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-dark-400 text-xs font-medium">{ingreso.socio?.nombre?.charAt(0) || '?'}</span>
                                )}
                              </div>
                              <span className="text-white text-sm">{ingreso.socio?.nombre || 'Desconocido'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-dark-300 text-sm hidden sm:table-cell">{ingreso.socio?.rut || '-'}</td>
                          <td className="py-3 px-4">
                            <p className="text-dark-200 text-sm">{format(new Date(ingreso.fechaIngreso), 'dd/MM/yyyy')}</p>
                            <p className="text-dark-500 text-xs">{format(new Date(ingreso.fechaIngreso), 'HH:mm:ss')}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                              isPermitido ? 'text-green-400' : 'text-red-400'
                            }`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {isPermitido ? 'Permitido' : 'Denegado'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-dark-500 text-xs font-mono hidden lg:table-cell">
                            {ingreso.ip || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-dark-500 text-sm">
                  {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-30">Anterior</button>
                  <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-30">Siguiente</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
