'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ForgotPasswordClient() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar el correo');
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
              Recuperar Contraseña
            </h1>
            <p className="text-sm text-th-secondary">
              Te enviaremos un código de 6 dígitos a tu correo.
            </p>
          </div>

          {/* Card */}
          <div className="bg-theme-card border border-th-border rounded-2xl p-8 shadow-lg">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="text-4xl">📬</div>
                <p className="text-sm text-th-primary font-medium">
                  Si el correo está registrado, recibirás un código en breve.
                </p>
                <p className="text-xs text-th-secondary">
                  Revisa tu bandeja de entrada y spam.
                </p>
                <Link
                  href="/reset-password"
                  className="inline-block mt-2 bg-[#F8C37C] text-black font-bold uppercase tracking-widest rounded-xl py-3 px-6 text-sm hover:bg-[#f0b55a] transition-colors"
                >
                  Ingresar código
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#F8C37C] text-black font-bold uppercase tracking-widest rounded-xl py-3 text-sm hover:bg-[#f0b55a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar código'}
                </button>

                <p className="text-center text-xs text-th-secondary">
                  <Link href="/login" className="text-[#F8C37C] hover:underline">
                    Volver al inicio de sesión
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
