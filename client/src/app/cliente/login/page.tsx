'use client';

import { useState, useEffect, FormEvent } from 'react';
import { IoFitnessOutline } from 'react-icons/io5';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import toast from 'react-hot-toast';

import { API_URL } from '@/lib/config'

export default function ClienteLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cliente_token');
    if (token) {
      fetch(`${API_URL}/auth/cliente/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) {
            window.location.href = '/cliente/panel';
          } else {
            localStorage.removeItem('cliente_token');
            localStorage.removeItem('cliente_data');
            setChecking(false);
          }
        })
        .catch(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Todos los campos son requeridos');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/cliente/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      localStorage.setItem('cliente_token', data.token);
      localStorage.setItem('cliente_data', JSON.stringify(data.socio));

      toast.success(`Bienvenido/a ${data.socio.nombre}`);
      window.location.href = '/cliente/panel';
    } catch (err: any) {
      setError(err.message);
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-950/20 via-dark-950 to-dark-950" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl" />

      {checking ? (
        <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin relative z-10" />
      ) : (
        <div className="w-full max-w-md relative card border-dark-800 bg-dark-900/80 backdrop-blur-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4">
              <IoFitnessOutline className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white text-2xl font-bold">TARUKA GYM</h1>
            <p className="text-dark-400 text-sm mt-1">Acceso Alumnos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className="input-field pl-10"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="input-field pl-10"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
              <p className="text-dark-600 text-xs mt-1.5 ml-1">
                Tu contraseña inicial es <strong className="text-dark-400">Taruka26</strong>
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 animate-fade-in">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <p className="text-center text-dark-600 text-xs mt-6">
            TARUKA GYM &copy; {new Date().getFullYear()}
          </p>
        </div>
      )}
    </div>
  );
}
