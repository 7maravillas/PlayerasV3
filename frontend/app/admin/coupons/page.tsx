"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  Ticket, Plus, Pencil, Trash2, Loader2, Check, X,
  Calendar, ToggleLeft, ToggleRight, Users, Infinity,
} from "lucide-react";
import { api } from "@/lib/api";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountPercent: number;
  minPurchaseCents: number;
  firstPurchaseOnly: boolean;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  _count?: { usages: number };
}

const EMPTY_FORM = {
  code: "",
  description: "",
  discountPercent: 10,
  minPurchaseCents: 0,
  firstPurchaseOnly: false,
  usageLimit: "" as string | number,
  startsAt: "",
  expiresAt: "",
  active: true,
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function statusBadge(coupon: Coupon) {
  const now = new Date();
  if (!coupon.active) return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Inactivo</span>;
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Expirado</span>;
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Pendiente</span>;
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Límite alcanzado</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><Check className="w-3 h-3" />Activo</span>;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchCoupons = () => {
    api.get("/api/v1/admin/coupons", { auth: true })
      .then((data: Coupon[]) => setCoupons(Array.isArray(data) ? data : []))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCoupons(); }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setFormSuccess("");
  };

  const startEdit = (c: Coupon) => {
    setEditingId(c.id);
    setFormError("");
    setFormSuccess("");
    setForm({
      code: c.code,
      description: c.description,
      discountPercent: c.discountPercent,
      minPurchaseCents: c.minPurchaseCents,
      firstPurchaseOnly: c.firstPurchaseOnly,
      usageLimit: c.usageLimit ?? "",
      startsAt: c.startsAt ? c.startsAt.slice(0, 10) : "",
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      active: c.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`¿Eliminar el cupón "${code}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/api/v1/admin/coupons/${id}`, { auth: true });
      fetchCoupons();
    } catch {
      alert("Error al eliminar el cupón");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discountPercent: Number(form.discountPercent),
        minPurchaseCents: Math.round(Number(form.minPurchaseCents) * 100),
        firstPurchaseOnly: form.firstPurchaseOnly,
        usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
        active: form.active,
      };

      if (editingId) {
        await api.put(`/api/v1/admin/coupons/${editingId}`, payload, { auth: true });
        setFormSuccess("Cupón actualizado.");
      } else {
        await api.post("/api/v1/admin/coupons", payload, { auth: true });
        setFormSuccess("Cupón creado.");
        resetForm();
      }
      fetchCoupons();
    } catch (err: any) {
      setFormError(err?.data?.error || "Error al guardar el cupón");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Cabecera */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-1">Descuentos</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <Ticket className="w-5 h-5 text-violet-500" />
          </div>
          Cupones
          <span className="text-sm font-normal text-slate-400 ml-1">({coupons.length})</span>
        </h1>
      </div>

      {/* ── FORMULARIO ── */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5"
      >
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
          {editingId ? "Editar cupón" : "Nuevo cupón"}
        </h2>

        {formError && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{formError}</p>}
        {formSuccess && <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">{formSuccess}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Código */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Código *</label>
            <input
              required
              type="text"
              placeholder="Ej: BIENVENIDO10"
              value={form.code}
              onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              className="w-full font-mono font-bold tracking-widest bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-violet-400 outline-none transition-colors"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Descripción</label>
            <input
              type="text"
              placeholder="Ej: Primera compra, Black Friday..."
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-violet-400 outline-none transition-colors"
            />
          </div>

          {/* % Descuento */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">% Descuento *</label>
            <div className="relative">
              <input
                required
                type="number"
                min={1}
                max={100}
                value={form.discountPercent}
                onChange={(e) => setForm(f => ({ ...f, discountPercent: Number(e.target.value) }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-violet-400 outline-none transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">%</span>
            </div>
          </div>

          {/* Mínimo de compra */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Compra mínima (MXN)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min={0}
                step={1}
                value={form.minPurchaseCents}
                onChange={(e) => setForm(f => ({ ...f, minPurchaseCents: Number(e.target.value) }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:border-violet-400 outline-none transition-colors"
              />
            </div>
            <p className="text-[10px] text-slate-400">0 = sin mínimo</p>
          </div>

          {/* Límite de usos */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Límite de usos</label>
            <input
              type="number"
              min={1}
              placeholder="Ilimitado"
              value={form.usageLimit}
              onChange={(e) => setForm(f => ({ ...f, usageLimit: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-violet-400 outline-none transition-colors"
            />
            <p className="text-[10px] text-slate-400">Vacío = ilimitado</p>
          </div>

          {/* Fechas */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vigencia</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={form.startsAt}
                onChange={(e) => setForm(f => ({ ...f, startsAt: e.target.value }))}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-violet-400 outline-none transition-colors"
              />
              <span className="flex items-center text-slate-300 text-xs font-bold">→</span>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-violet-400 outline-none transition-colors"
              />
            </div>
            <p className="text-[10px] text-slate-400">Inicio → Expiración (vacío = sin límite)</p>
          </div>
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-4 pt-2">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, firstPurchaseOnly: !f.firstPurchaseOnly }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
              form.firstPurchaseOnly
                ? "bg-violet-50 text-violet-600 border-violet-200"
                : "bg-slate-50 text-slate-400 border-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            Solo primera compra
            {form.firstPurchaseOnly ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-30" />}
          </button>

          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, active: !f.active }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
              form.active
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-slate-50 text-slate-400 border-slate-200"
            }`}
          >
            {form.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {form.active ? "Activo" : "Inactivo"}
          </button>
        </div>

        {/* Resumen */}
        {form.code && (
          <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-sm text-violet-800 space-y-0.5">
            <p className="font-bold">Código: <span className="font-mono tracking-widest">{form.code || "—"}</span></p>
            <p>{form.discountPercent}% de descuento{form.minPurchaseCents > 0 ? ` en compras de $${form.minPurchaseCents}+ MXN` : ""}{form.firstPurchaseOnly ? " • Solo primera compra" : ""}</p>
            {form.expiresAt && <p className="text-violet-500 text-xs">Expira: {fmtDate(form.expiresAt)}</p>}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className={`flex items-center gap-2 font-bold uppercase tracking-widest rounded-xl px-6 py-3 text-sm transition-colors disabled:opacity-50 ${
              editingId
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear cupón"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 font-bold uppercase tracking-widest rounded-xl px-6 py-3 text-sm border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
          )}
        </div>
      </form>

      {/* ── LISTA ── */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <Ticket className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No hay cupones creados aún.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Código</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Descuento</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Vigencia</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Usos</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {coupons.map((c) => (
                <tr key={c.id} className={`hover:bg-slate-50/60 transition-colors ${editingId === c.id ? "bg-violet-50/40" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-mono font-bold tracking-widest text-slate-800">{c.code}</p>
                    {c.description && <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>}
                    {c.firstPurchaseOnly && (
                      <span className="text-[10px] font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">1ª compra</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-lg font-black text-violet-600">{c.discountPercent}%</span>
                    {c.minPurchaseCents > 0 && (
                      <p className="text-xs text-slate-400">Mín: ${(c.minPurchaseCents / 100).toLocaleString("es-MX")}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      {c.startsAt ? fmtDate(c.startsAt) : "—"}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      {c.expiresAt ? fmtDate(c.expiresAt) : <span className="flex items-center gap-0.5"><Infinity className="w-3 h-3" />Sin límite</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-7 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold tabular-nums">
                      {c.usageCount}
                      {c.usageLimit !== null && <span className="text-slate-400">/{c.usageLimit}</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">{statusBadge(c)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => startEdit(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-violet-50 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.code)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
