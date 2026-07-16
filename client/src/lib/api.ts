import { API_URL } from './config';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body instanceof FormData
        ? options.body
        : options.body
        ? JSON.stringify(options.body)
        : undefined,
    });

    if (response.status === 401) {
      this.setToken(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('No autorizado');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error en la solicitud');
    }

    return data;
  }

  auth = {
    login: (email: string, password: string) =>
      this.request<{ token: string; admin: any }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      }),
    me: () => this.request<any>('/auth/me'),
    cambiarPassword: (actual: string, nueva: string) =>
      this.request<{ message: string }>('/auth/cambiar-password', {
        method: 'PUT',
        body: { actual, nueva },
      }),
  };

  socios = {
    listar: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return this.request<{ data: any[]; pagination: any }>(`/socios${query}`);
    },
    obtener: (id: string) => this.request<any>(`/socios/${id}`),
    crear: (data: FormData) =>
      this.request<any>('/socios', { method: 'POST', body: data }),
    actualizar: (id: string, data: FormData) =>
      this.request<any>(`/socios/${id}`, { method: 'PUT', body: data }),
    eliminar: (id: string) =>
      this.request<{ message: string }>(`/socios/${id}`, { method: 'DELETE' }),
    cambiarEstado: (id: string, estado: string) =>
      this.request<any>(`/socios/${id}/estado`, {
        method: 'PUT',
        body: { estado },
      }),
    buscarPorCodigo: (codigo: string) =>
      this.request<any>(`/socios/buscar/${codigo}`),
  };

  dashboard = {
    stats: () => this.request<any>('/dashboard/stats'),
    ultimosIngresos: () => this.request<any[]>('/dashboard/ultimos-ingresos'),
  };

  ingresos = {
    listar: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return this.request<{ data: any[]; pagination: any }>(`/ingresos${query}`);
    },
  };

  renovaciones = {
    renovar: (data: { socioId: string; dias?: number; fechaManual?: string }) =>
      this.request<any>('/renovaciones', { method: 'POST', body: data }),
    historial: (socioId: string) =>
      this.request<any[]>(`/renovaciones/${socioId}`),
  };

  notificaciones = {
    listar: () => this.request<any[]>('/notificaciones'),
    noLeidas: () => this.request<{ count: number }>('/notificaciones/no-leidas'),
    marcarLeida: (id: string) =>
      this.request<{ message: string }>(`/notificaciones/${id}/leer`, { method: 'PUT' }),
    marcarTodasLeidas: () =>
      this.request<{ message: string }>('/notificaciones/leer-todas', { method: 'PUT' }),
  };

  check = {
    verificar: (codigo: string) => this.request<any>(`/check/${codigo}`),
  };
}

export const api = new ApiClient();
