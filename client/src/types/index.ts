export interface Admin {
  id: string;
  email: string;
  nombre: string;
  activo: boolean;
}

export interface Socio {
  id: string;
  codigoUnico: string;
  nombre: string;
  rut: string;
  fechaNacimiento: string | null;
  sexo: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  contactoEmergencia: string | null;
  observaciones: string | null;
  codigoNFC: string | null;
  foto: string | null;
  fechaInicio: string;
  fechaTermino: string;
  estado: 'activo' | 'congelado' | 'inactivo' | 'suspendido';
  createdAt: string;
  updatedAt: string;
  _count?: {
    ingresos: number;
    renovaciones: number;
  };
  renovaciones?: Renovacion[];
  ingresos?: Ingreso[];
}

export interface Renovacion {
  id: string;
  socioId: string;
  dias: number;
  fechaAntes: string;
  fechaNueva: string;
  createdAt: string;
}

export interface Ingreso {
  id: string;
  socioId: string;
  fechaIngreso: string;
  estado: string;
  dispositivo: string | null;
  ip: string | null;
  socio?: {
    id: string;
    nombre: string;
    rut: string;
    foto: string | null;
    codigoUnico: string;
  };
}

export interface Notificacion {
  id: string;
  tipo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
}

export interface DashboardStats {
  sociosActivos: number;
  sociosCongelados: number;
  sociosVencidos: number;
  sociosSuspendidos: number;
  ingresosDelDia: number;
  renovacionesDelMes: number;
  sociosNuevos: number;
}

export interface AccesoEvent {
  socioId: string;
  nombre: string;
  foto: string | null;
  estado: string;
  fechaInicio: string;
  fechaTermino: string;
  puedeIngresar: boolean;
  mensaje: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
