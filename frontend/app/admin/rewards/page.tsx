"use client";

import { useState, useEffect, FormEvent } from "react";
import { Gift, Loader2, Save, ToggleLeft, ToggleRight, TrendingUp, Users } from "lucide-react";
import { api } from "@/lib/api";

interface RewardConfig {
  id: number;
  enabled: boolean;
  centsPerPoint: number;
  pointValueCents: number;
  goalPoints: number;
  updatedAt: string;
}

interface RewardStats {
  totalPoints: number;
  totalUsers: number;
}

export default function AdminRewardsPage() {
  const [config, setConfig] = useState<RewardConfig | null>(null);
  const [stats, setStats] = useState<RewardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [enabled, setEnabled] = useState(true);
  const [centsPerPoint, setCentsPerPoint] = useState(400);
  const [pointValueCents, setPointValueCents] = useState(100);
  const [goalPoints, setGoalPoints] = useState(550);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/admin/rewards/config", { auth: true }),
      api.get("/api/v1/admin/rewards/stats", { auth: true }).catch(() => null),
    ])
      .then(([cfg, st]) => {
        setConfig(cfg);
        setEnabled(cfg.enabled);
        setCentsPerPoint(cfg.centsPerPoint);
        setPointValueCents(cfg.pointValueCents);
        setGoalPoints(cfg.goalPoints);
        if (st) setStats(st);
      })
      .catch(() => setError("No se pudo cargar la configuración"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const updated = await api.put(
        "/api/v1/admin/rewards/config",
        { enabled, centsPerPoint, pointValueCents, goalPoints },
        { auth: true },
      );
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  const pesosPerPoint = (centsPerPoint / 100).toFixed(0);
  const pesoValuePerPoint = (pointValueCents / 100).toFixed(2);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Cabecera */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Sistema de Puntos</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <Gift className="w-5 h-5 text-amber-500" />
          </div>
          Configuración de Recompensas
        </h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Puntos totales</p>
            </div>
            <p className="text-3xl font-black text-slate-800 tabular-nums">
              {stats.totalPoints.toLocaleString("es-MX")}
            </p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-indigo-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Usuarios con puntos</p>
            </div>
            <p className="text-3xl font-black text-slate-800 tabular-nums">
              {stats.totalUsers.toLocaleString("es-MX")}
            </p>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm rounded-xl px-4 py-3">
            Configuración guardada correctamente.
          </div>
        )}

        {/* Toggle enabled */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">Programa activo</p>
            <p className="text-xs text-slate-400 mt-0.5">Desactivar detiene acumulación y canje de puntos</p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              enabled
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}
          >
            {enabled ? (
              <><ToggleRight className="w-4 h-4" /> Activo</>
            ) : (
              <><ToggleLeft className="w-4 h-4" /> Inactivo</>
            )}
          </button>
        </div>

        <hr className="border-slate-100" />

        {/* centsPerPoint */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
            Centavos por punto (tasa de acumulación)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={100}
              max={10000}
              step={100}
              value={centsPerPoint}
              onChange={(e) => setCentsPerPoint(Number(e.target.value))}
              className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-indigo-400 transition-colors"
            />
            <p className="text-sm text-slate-500">
              = por cada <span className="font-bold text-slate-800">${pesosPerPoint} MXN</span> gastados, el cliente gana <span className="font-bold text-amber-600">1 punto</span>
            </p>
          </div>
        </div>

        {/* pointValueCents */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
            Valor del punto en centavos (tasa de canje)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={1000}
              step={1}
              value={pointValueCents}
              onChange={(e) => setPointValueCents(Number(e.target.value))}
              className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-indigo-400 transition-colors"
            />
            <p className="text-sm text-slate-500">
              = 1 punto vale <span className="font-bold text-slate-800">${pesoValuePerPoint} MXN</span> de descuento
            </p>
          </div>
        </div>

        {/* goalPoints */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
            Meta de puntos (mostrada en página de recompensas)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={9999}
              step={1}
              value={goalPoints}
              onChange={(e) => setGoalPoints(Number(e.target.value))}
              className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-indigo-400 transition-colors"
            />
            <p className="text-sm text-slate-500">
              puntos = <span className="font-bold text-slate-800">${(goalPoints * pointValueCents / 100).toLocaleString("es-MX")} MXN</span> de descuento acumulado
            </p>
          </div>
        </div>

        {/* Resumen */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800 space-y-1">
          <p className="font-bold mb-2">Resumen de la configuración actual:</p>
          <p>• Por cada <strong>${pesosPerPoint} MXN</strong> de compra → <strong>1 punto</strong></p>
          <p>• 1 punto equivale a <strong>${pesoValuePerPoint} MXN</strong> de descuento</p>
          <p>• Meta de la barra de progreso: <strong>{goalPoints} puntos</strong> (${(goalPoints * pointValueCents / 100).toLocaleString("es-MX")} MXN)</p>
        </div>

        {config?.updatedAt && (
          <p className="text-xs text-slate-400">
            Última actualización: {new Date(config.updatedAt).toLocaleString("es-MX")}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 text-white font-bold uppercase tracking-widest rounded-xl px-6 py-3 text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </form>
    </div>
  );
}
