'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiFetch } from '@/lib/api';

export default function AccountSettingsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  // Pre-fill with current data from API
  useEffect(() => {
    if (!token) return;
    apiFetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => {
        setName(data.name ?? '');
        setPhone(data.phone ?? '');
      })
      .catch(() => {});
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      await apiFetch('/api/v1/auth/me', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() || undefined, phone: phone.trim() || null }),
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg">
        <div className="w-8 h-8 border-2 border-[#F8C37C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-th-primary">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-xl">
        {/* Volver */}
        <Link
          href="/account"
          className="flex items-center gap-2 text-sm text-th-secondary hover:text-th-primary transition-colors mb-8"
        >
          <span>←</span>
          <span>Mi cuenta</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-4xl tracking-widest uppercase text-[#F8C37C] mb-2">
            Editar Perfil
          </h1>
          <p className="text-sm text-th-secondary">Actualiza tu nombre y teléfono de contacto.</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-theme-card border border-th-border rounded-2xl p-8 space-y-5 shadow-lg"
        >
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3">
              Perfil actualizado correctamente.
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Correo (read-only) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-widest text-th-secondary">
              Correo electrónico
            </label>
            <p className="w-full bg-theme-bg/50 border border-th-border/50 rounded-xl px-4 py-3 text-sm text-th-secondary cursor-not-allowed">
              {user.email}
            </p>
          </div>

          {/* Nombre */}
          <div className="space-y-1">
            <label
              htmlFor="settings-name"
              className="block text-xs font-bold uppercase tracking-widest text-th-secondary"
            >
              Nombre
            </label>
            <input
              id="settings-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full bg-theme-bg border border-th-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F8C37C] transition-colors"
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-1">
            <label
              htmlFor="settings-phone"
              className="block text-xs font-bold uppercase tracking-widest text-th-secondary"
            >
              Teléfono
            </label>
            <input
              id="settings-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+52 33 1234 5678"
              className="w-full bg-theme-bg border border-th-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F8C37C] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#F8C37C] text-black font-bold uppercase tracking-widest rounded-xl py-3 text-sm hover:bg-[#f0b55a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>

        {/* Cambiar contraseña */}
        <div className="mt-6 bg-theme-card border border-th-border rounded-2xl p-6">
          <p className="text-sm font-bold text-th-primary mb-1">Cambiar contraseña</p>
          <p className="text-xs text-th-secondary mb-4">
            Te enviaremos un código de verificación a tu correo.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block text-xs font-bold uppercase tracking-widest border border-th-border rounded-xl px-4 py-2 text-th-secondary hover:text-th-primary hover:border-[#F8C37C] transition-colors"
          >
            Solicitar código
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
