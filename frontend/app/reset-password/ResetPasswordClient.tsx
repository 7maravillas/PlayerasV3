'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ResetPasswordClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail]         = useState(searchParams.get('email') ?? '');
  const [code, setCode]           = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, password }),
      });
      router.push('/login?reset=1');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-th-primary">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl tracking-widest uppercase text-[#F8C37C] mb-2">
              Nueva Contraseña
            </h1>
            <p className="text-sm text-th-secondary">
              Ingresa el código que recibiste y elige una nueva contraseña.
            </p>
          </div>

          {/* Card */}
          <form
            onSubmit={handleSubmit}
            className="bg-theme-card border border-th-border rounded-2xl p-8 space-y-5 shadow-lg"
          >
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-widest text-th-secondary">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-theme-bg border border-th-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F8C37C] transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-widest text-th-secondary">
                Código de verificación
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full bg-theme-bg border border-th-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F8C37C] transition-colors tracking-[0.5em] text-center font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-widest text-th-secondary">
                Nueva contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-theme-bg border border-th-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F8C37C] transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-widest text-th-secondary">
                Confirmar contraseña
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-theme-bg border border-th-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F8C37C] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F8C37C] text-black font-bold uppercase tracking-widest rounded-xl py-3 text-sm hover:bg-[#f0b55a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>

            <p className="text-center text-xs text-th-secondary">
              ¿No tienes el código?{' '}
              <Link href="/forgot-password" className="text-[#F8C37C] hover:underline">
                Solicitar nuevo código
              </Link>
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
