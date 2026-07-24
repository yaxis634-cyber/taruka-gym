'use client';

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react'
import { UPLOADS_URL } from '@/lib/config';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { Socio, Pagination } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineX,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineDownload,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const ESTADOS = ['', 'activo', 'congelado', 'inactivo', 'suspendido'] as const;
const ESTADO_LABELS: Record<string, string> = {
  activo: 'Activo',
  congelado: 'Congelado',
  inactivo: 'Vencido',
  suspendido: 'Suspendido',
};
const RENOVAR_OPCIONES = [30, 60, 90, 180, 365];

function StatusBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    activo: 'badge badge-success',
    congelado: 'badge badge-warning',
    inactivo: 'badge badge-danger',
    suspendido: 'badge badge-danger',
  };
  return <span className={styles[estado] || 'badge'}>{ESTADO_LABELS[estado] || estado}</span>;
}

interface SocioForm {
  nombre: string;
  rut: string;
  fechaNacimiento: string;
  sexo: string;
  email: string;
  telefono: string;
  direccion: string;
  contactoEmergencia: string;
  observaciones: string;
  codigoNFC: string;
  fechaInicio: string;
  fechaTermino: string;
  estado: string;
}

const emptyForm: SocioForm = {
  nombre: '', rut: '', fechaNacimiento: '', sexo: '',
  email: '', telefono: '', direccion: '', contactoEmergencia: '',
  observaciones: '', codigoNFC: '', fechaInicio: '', fechaTermino: '',
  estado: 'activo',
};

function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-dark-900 border-b border-dark-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-white text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function SmallModal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="border-b border-dark-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-white text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function SociosPage() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSocio, setEditSocio] = useState<Socio | null>(null);
  const [form, setForm] = useState<SocioForm>(emptyForm);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Socio | null>(null);
  const [renovarModal, setRenovarModal] = useState<Socio | null>(null);
  const [renovarDias, setRenovarDias] = useState<number | null>(null);
  const [renovarFecha, setRenovarFecha] = useState('');
  const [renovando, setRenovando] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSocios = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '15',
      };
      if (search) params.search = search;
      if (estadoFilter) params.estado = estadoFilter;

      const { data, pagination: pag } = await api.socios.listar(params);
      setSocios(data);
      setPagination(pag);
    } catch {
      toast.error('Error al cargar socios');
    } finally {
      setLoading(false);
    }
  }, [page, search, estadoFilter]);

  useEffect(() => {
    fetchSocios();
  }, [fetchSocios]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchSocios();
    }, 300);
  };

  const openCreate = () => {
    setEditSocio(null);
    setForm(emptyForm);
    setFotoFile(null);
    setFotoPreview(null);
    setModalOpen(true);
  };

  const openEdit = (socio: Socio) => {
    setEditSocio(socio);
    setForm({
      nombre: socio.nombre,
      rut: socio.rut,
      fechaNacimiento: socio.fechaNacimiento ? format(new Date(socio.fechaNacimiento), 'yyyy-MM-dd') : '',
      sexo: socio.sexo || '',
      email: socio.email || '',
      telefono: socio.telefono || '',
      direccion: socio.direccion || '',
      contactoEmergencia: socio.contactoEmergencia || '',
      observaciones: socio.observaciones || '',
      codigoNFC: socio.codigoNFC || '',
      fechaInicio: socio.fechaInicio ? format(new Date(socio.fechaInicio), 'yyyy-MM-dd') : '',
      fechaTermino: socio.fechaTermino ? format(new Date(socio.fechaTermino), 'yyyy-MM-dd') : '',
      estado: socio.estado,
    });
    setFotoFile(null);
    setFotoPreview(socio.foto ? `${UPLOADS_URL}${socio.foto}` : null);
    setModalOpen(true);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.email) {
      toast.error('Nombre y correo son obligatorios');
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });
    if (fotoFile) {
      formData.append('foto', fotoFile);
    }

    setSaving(true);
    try {
      if (editSocio) {
        await api.socios.actualizar(editSocio.id, formData);
        toast.success('Socio actualizado exitosamente');
      } else {
        await api.socios.crear(formData);
        toast.success('Socio creado exitosamente');
      }
      setModalOpen(false);
      fetchSocios();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar socio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.socios.eliminar(deleteModal.id);
      toast.success('Socio eliminado exitosamente');
      setDeleteModal(null);
      fetchSocios();
    } catch {
      toast.error('Error al eliminar socio');
    }
  };

  const handleRenovar = async () => {
    if (!renovarModal) return;
    if (!renovarDias && !renovarFecha) {
      toast.error('Seleccione una opción de renovación');
      return;
    }
    setRenovando(true);
    try {
      await api.renovaciones.renovar({
        socioId: renovarModal.id,
        dias: renovarDias || undefined,
        fechaManual: renovarFecha || undefined,
      });
      toast.success('Membresía renovada exitosamente');
      setRenovarModal(null);
      setRenovarDias(null);
      setRenovarFecha('');
      fetchSocios();
    } catch (err: any) {
      toast.error(err.message || 'Error al renovar membresía');
    } finally {
      setRenovando(false);
    }
  };

  return (
    <DashboardLayout title="Socios" subtitle="Gestión de miembros">
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUT, teléfono..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={estadoFilter}
            onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="congelado">Congelados</option>
            <option value="inactivo">Vencidos</option>
            <option value="suspendido">Suspendidos</option>
          </select>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <HiOutlinePlus className="w-5 h-5" />
            Nuevo Socio
          </button>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '${UPLOADS_URL}/api'}/socios/exportar`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `socios_ingresotaruka_${new Date().toISOString().split('T')[0]}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Excel exportado exitosamente');
              } catch {
                toast.error('Error al exportar');
              }
            }}
            className="btn-secondary flex items-center gap-2 whitespace-nowrap"
          >
            <HiOutlineDownload className="w-5 h-5" />
            Exportar Excel
          </button>
        </div>

        {loading ? (
          <div className="card border-dark-800">
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <div className="w-10 h-10 bg-dark-800 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-dark-800 rounded w-32" />
                    <div className="h-2 bg-dark-800 rounded w-20" />
                  </div>
                  <div className="h-3 bg-dark-800 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : socios.length === 0 ? (
          <div className="card border-dark-800 text-center py-12">
            <p className="text-dark-500">No se encontraron socios</p>
          </div>
        ) : (
          <>
            <div className="card border-dark-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-dark-800">
                      <th className="pb-3 px-4 text-dark-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap">Socio</th>
                      <th className="pb-3 px-4 text-dark-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap">RUT</th>
                      <th className="pb-3 px-4 text-dark-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Teléfono</th>
                      <th className="pb-3 px-4 text-dark-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap">Estado</th>
                      <th className="pb-3 px-4 text-dark-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Membresía</th>
                      <th className="pb-3 px-4 text-dark-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800">
                    {socios.map((socio) => (
                      <tr key={socio.id} className="hover:bg-dark-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-dark-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {socio.foto ? (
                                <img src={`${UPLOADS_URL}${socio.foto}`} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-dark-400 text-xs font-medium">{socio.nombre.charAt(0)}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium truncate">{socio.nombre}</p>
                              <p className="text-dark-500 text-xs">{socio.email || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-dark-300 text-sm whitespace-nowrap">{socio.rut}</td>
                        <td className="py-3 px-4 text-dark-300 text-sm whitespace-nowrap hidden md:table-cell">{socio.telefono || '-'}</td>
                        <td className="py-3 px-4 whitespace-nowrap"><StatusBadge estado={socio.estado} /></td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <p className="text-dark-300 text-xs whitespace-nowrap">
                            {socio.fechaInicio ? format(new Date(socio.fechaInicio), 'dd/MM/yy') : '-'} - {socio.fechaTermino ? format(new Date(socio.fechaTermino), 'dd/MM/yy') : '-'}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setRenovarModal(socio); setRenovarDias(null); setRenovarFecha(''); }}
                              className="p-1.5 rounded-lg text-dark-400 hover:text-green-400 hover:bg-green-500/10 transition-all"
                              title="Renovar"
                            >
                              <HiOutlineRefresh className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEdit(socio)}
                              className="p-1.5 rounded-lg text-dark-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                              title="Editar"
                            >
                              <HiOutlinePencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteModal(socio)}
                              className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="Eliminar"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-dark-500 text-sm">
                  {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-30"
                  >
                    <HiOutlineChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-30"
                  >
                    <HiOutlineChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editSocio ? 'Editar Socio' : 'Nuevo Socio'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div
                className="w-24 h-24 rounded-full bg-dark-800 border-2 border-dark-700 overflow-hidden flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-dark-500 text-3xl">+</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-dark-300 text-sm mb-1.5">Nombre completo *</label>
              <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="input-field" required />
            </div>

            <div>
              <label className="block text-dark-300 text-sm mb-1.5">RUT</label>
              <input type="text" value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="block text-dark-300 text-sm mb-1.5">Fecha nacimiento</label>
              <input type="date" value={form.fechaNacimiento} onChange={e => setForm({ ...form, fechaNacimiento: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="block text-dark-300 text-sm mb-1.5">Sexo</label>
              <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })} className="input-field">
                <option value="">Seleccionar</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-dark-300 text-sm mb-1.5">Correo *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" required />
            </div>

            <div>
              <label className="block text-dark-300 text-sm mb-1.5">Teléfono</label>
              <input type="text" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="input-field" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-dark-300 text-sm mb-1.5">Dirección</label>
              <input type="text" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="block text-dark-300 text-sm mb-1.5">Contacto emergencia</label>
              <input type="text" value={form.contactoEmergencia} onChange={e => setForm({ ...form, contactoEmergencia: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="block text-dark-300 text-sm mb-1.5">Código NFC</label>
              <input type="text" value={form.codigoNFC} onChange={e => setForm({ ...form, codigoNFC: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="block text-dark-300 text-sm mb-1.5">Fecha inicio</label>
              <input type="date" value={form.fechaInicio} onChange={e => setForm({ ...form, fechaInicio: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="block text-dark-300 text-sm mb-1.5">Fecha término</label>
              <input type="date" value={form.fechaTermino} onChange={e => setForm({ ...form, fechaTermino: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="block text-dark-300 text-sm mb-1.5">Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="input-field">
                <option value="activo">Activo</option>
                <option value="congelado">Congelado</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-dark-300 text-sm mb-1.5">Observaciones</label>
              <textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} className="input-field min-h-[80px] resize-y" rows={3} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-dark-800">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : editSocio ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <SmallModal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Eliminar Socio">
        <p className="text-dark-300 text-sm mb-6">
          &iquest;Está seguro de eliminar a <strong className="text-white">{deleteModal?.nombre}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteModal(null)} className="btn-secondary">Cancelar</button>
          <button onClick={handleDelete} className="btn-danger">Eliminar</button>
        </div>
      </SmallModal>

      {/* Renovar Modal */}
      <SmallModal open={!!renovarModal} onClose={() => { setRenovarModal(null); setRenovarDias(null); setRenovarFecha(''); }} title="Renovar Membresía">
        <div className="space-y-4">
          <div>
            <p className="text-dark-400 text-sm">Socio</p>
            <p className="text-white font-medium">{renovarModal?.nombre}</p>
          </div>
          <div>
            <p className="text-dark-400 text-sm">Fecha actual de término</p>
            <p className="text-white">{renovarModal?.fechaTermino ? format(new Date(renovarModal.fechaTermino), 'dd/MM/yyyy') : 'Sin fecha'}</p>
          </div>

          <div>
            <p className="text-dark-300 text-sm mb-2">Extender membresía</p>
            <div className="grid grid-cols-5 gap-2">
              {RENOVAR_OPCIONES.map(dias => (
                <button
                  key={dias}
                  onClick={() => { setRenovarDias(dias); setRenovarFecha(''); }}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    renovarDias === dias
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  +{dias}d
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-dark-800 pt-4">
            <p className="text-dark-300 text-sm mb-2">O seleccionar fecha manual</p>
            <input
              type="date"
              value={renovarFecha}
              onChange={e => { setRenovarFecha(e.target.value); setRenovarDias(null); }}
              className="input-field"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => { setRenovarModal(null); setRenovarDias(null); setRenovarFecha(''); }} className="btn-secondary">Cancelar</button>
          <button onClick={handleRenovar} disabled={renovando || (!renovarDias && !renovarFecha)} className="btn-primary flex items-center gap-2">
            {renovando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Renovando...
              </>
            ) : 'Renovar'}
          </button>
        </div>
      </SmallModal>
    </DashboardLayout>
  );
}
