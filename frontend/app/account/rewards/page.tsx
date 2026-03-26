"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Star, ShoppingBag, Gift, Trophy, TrendingUp, Lock, Sparkles, UserPlus, Loader2, Copy, Check } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface Balance {
  points: number;
  valueCents: number;
  goalPoints: number;
  centsPerPoint: number;
  pointValueCents: number;
  enabled: boolean;
}

interface Transaction {
  id: string;
  type: "EARN" | "REDEEM";
  points: number;
  description: string;
  orderId: string | null;
  createdAt: string;
}

function getMotivationalText(points: number, goal: number): string {
  const pct = points / goal;
  if (pct >= 1) return "🎉 ¡JERSEY GRATIS DESBLOQUEADA! ¡Ya puedes canjearla!";
  if (pct >= 0.9) return "¡Ya casi tienes la tuya gratis! Un esfuerzo más.";
  if (pct >= 0.7) return "¡Más de la mitad! Vas muy bien.";
  if (pct >= 0.45) return "¡Casi a la mitad! Sigue comprando.";
  if (pct > 0) return "¡Ya empezaste tu camino a la jersey gratis!";
  return "Regístrate y empieza a acumular hoy.";
}

export default function RewardsPage() {
  const { user, token, loading } = useAuth();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ couponCode: string; expiresAt: string } | null>(null);
  const [redeemError, setRedeemError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!token) { setDataLoading(false); return; }
    Promise.all([
      fetch(`${API_BASE}/api/v1/rewards/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_BASE}/api/v1/rewards/history`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([bal, hist]) => {
        setBalance(bal);
        setHistory(Array.isArray(hist) ? hist : []);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [token]);

  const points = balance?.points ?? 0;
  const goalPoints = balance?.goalPoints ?? 1200;
  const centsPerPoint = balance?.centsPerPoint ?? 275;
  const progress = Math.min((points / goalPoints) * 100, 100);
  const remaining = Math.max(goalPoints - points, 0);
  const jerseyEquiv = Math.round(550 / (centsPerPoint / 100 * (goalPoints / 4)));

  const handleRedeem = async () => {
    if (!token) return;
    setRedeeming(true);
    setRedeemError("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/rewards/redeem`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al canjear");
      setRedeemResult({ couponCode: data.couponCode, expiresAt: data.expiresAt });
      // Actualizar balance local
      setBalance((prev) => prev ? { ...prev, points: prev.points - goalPoints } : prev);
    } catch (err: any) {
      setRedeemError(err.message);
    } finally {
      setRedeeming(false);
    }
  };

  const copyCode = () => {
    if (!redeemResult) return;
    navigator.clipboard.writeText(redeemResult.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#F8C37C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 px-4 text-center">
        <Lock size={48} className="text-[#F8C37C]/40" />
        <h2 className="text-4xl font-heading uppercase italic text-white tracking-tight">
          Inicia sesión
        </h2>
        <p className="text-white/50 max-w-sm">
          Necesitas una cuenta para ver y acumular tus puntos de recompensa.
        </p>
        <Link
          href="/login"
          className="bg-[#F8C37C] text-black font-bold uppercase tracking-widest rounded-full px-8 py-3 text-sm hover:bg-[#f0b55a] transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Fondo decorativo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#F8C37C]/3 blur-[120px]" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[400px] rounded-full bg-[#F8C37C]/2 blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* Back */}
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft size={16} />
          Mi cuenta
        </Link>

        {/* HEADER */}
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#F8C37C] mb-3">
            Programa de lealtad
          </p>
          <h1 className="text-6xl sm:text-7xl font-heading uppercase italic text-white tracking-tight leading-[0.9] mb-4">
            Mis<br />
            <span className="text-[#F8C37C]">Recompensas</span>
          </h1>
          <p className="text-white/50 text-sm max-w-md">
            Acumula {goalPoints.toLocaleString("es-MX")} puntos y llévate una jersey con <strong className="text-white">$550 de descuento</strong> — ¡gratis si eliges Fan Básica!
          </p>
        </div>

        {/* BALANCE CARD */}
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden mb-6 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F8C37C]/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative">
            {/* Puntos principales */}
            <div className="flex items-end gap-4 mb-2">
              <span className="text-7xl sm:text-8xl font-heading italic text-[#F8C37C] leading-none tabular-nums">
                {points.toLocaleString("es-MX")}
              </span>
              <div className="pb-2">
                <p className="text-xs uppercase tracking-widest text-white/40 font-bold">puntos</p>
                <p className="text-sm text-white/60 font-medium">de {goalPoints.toLocaleString("es-MX")} para jersey gratis</p>
              </div>
            </div>

            {/* Texto motivacional */}
            <p className="text-white/60 text-sm mb-6 font-medium">
              {getMotivationalText(points, goalPoints)}
              {remaining > 0 && (
                <span className="text-white/40 ml-2">
                  — te faltan <span className="text-[#F8C37C] font-bold">{remaining} pts</span>
                </span>
              )}
            </p>

            {/* Barra de progreso */}
            <div>
              <div className="h-4 bg-white/5 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-[#F8C37C] to-[#fec375] rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  {progress > 5 && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                  )}
                </div>
              </div>
              {/* Marcadores */}
              <div className="flex justify-between mt-1">
                {[0, 300, 600, 900, 1200].map((marker) => (
                  <div
                    key={marker}
                    className={`text-[10px] font-bold ${points >= marker ? "text-[#F8C37C]" : "text-white/20"}`}
                  >
                    {marker === 1200 ? (
                      <span className="flex items-center gap-0.5">
                        <Trophy size={10} />
                        {marker}
                      </span>
                    ) : marker}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTÓN DE CANJE — solo si tiene suficientes puntos */}
        {points >= goalPoints && !redeemResult && (
          <div className="mb-8 rounded-2xl border border-[#F8C37C]/30 bg-[#F8C37C]/5 p-6 text-center">
            <Sparkles size={32} className="text-[#F8C37C] mx-auto mb-3" />
            <h3 className="text-2xl font-heading uppercase italic text-white mb-2">
              ¡Jersey gratis lista!
            </h3>
            <p className="text-white/50 text-sm mb-5 max-w-sm mx-auto">
              Obtienes <strong className="text-white">$550 de descuento</strong> en cualquier playera. Si eliges Fan Básica es completamente gratis.
            </p>
            {redeemError && (
              <p className="text-red-400 text-sm mb-3">{redeemError}</p>
            )}
            <button
              onClick={handleRedeem}
              disabled={redeeming}
              className="inline-flex items-center gap-2 bg-[#F8C37C] text-black font-black uppercase tracking-widest rounded-full px-8 py-4 text-sm hover:bg-[#f0b55a] transition-colors disabled:opacity-60"
            >
              {redeeming ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
              {redeeming ? "Generando código..." : "¡Canjear mi jersey gratis!"}
            </button>
          </div>
        )}

        {/* CÓDIGO GENERADO */}
        {redeemResult && (
          <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
            <Check size={32} className="text-emerald-400 mx-auto mb-3" />
            <h3 className="text-2xl font-heading uppercase italic text-white mb-2">
              ¡Código generado!
            </h3>
            <p className="text-white/50 text-sm mb-5">
              Aplícalo en el checkout. Válido hasta el{" "}
              <span className="text-white">
                {new Date(redeemResult.expiresAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </p>
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="font-mono text-2xl font-black tracking-[0.2em] text-[#F8C37C] bg-black/30 rounded-xl px-6 py-3">
                {redeemResult.couponCode}
              </span>
              <button
                onClick={copyCode}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              >
                {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
            </div>
            <Link
              href="/catalog"
              className="inline-block bg-[#F8C37C] text-black font-black uppercase tracking-widest rounded-full px-8 py-3 text-sm hover:bg-[#f0b55a] transition-colors"
            >
              Ir al catálogo a elegir
            </Link>
          </div>
        )}

        {/* CÓMO GANAR PUNTOS */}
        <div className="mb-12">
          <h2 className="text-2xl font-heading uppercase italic text-white tracking-tight mb-6">
            Cómo ganar puntos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: UserPlus,
                step: "01",
                title: "Regístrate",
                desc: "+500 puntos gratis solo por crear tu cuenta. ¡Ya empiezas al 41%!",
                highlight: "+500 pts",
              },
              {
                icon: ShoppingBag,
                step: "02",
                title: "Compra",
                desc: `Cada $${Math.round(centsPerPoint / 100)} MXN gastados = 1 punto. Una jersey de $550 te da ~200 puntos.`,
                highlight: "~200 pts por jersey",
              },
              {
                icon: Star,
                step: "03",
                title: "Próximamente",
                desc: "Nuevas formas de ganar puntos estarán disponibles muy pronto.",
                highlight: "Más formas",
              },
            ].map(({ icon: Icon, step, title, desc, highlight }) => (
              <div
                key={step}
                className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 hover:border-[#F8C37C]/30 hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl font-heading italic text-[#F8C37C]/30 leading-none">
                    {step}
                  </span>
                  <Icon size={20} className="text-[#F8C37C]" />
                </div>
                <h3 className="font-bold text-white uppercase tracking-wide text-sm mb-1">
                  {title}
                </h3>
                <p className="text-white/40 text-xs leading-relaxed mb-2">{desc}</p>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F8C37C] bg-[#F8C37C]/10 rounded-full px-3 py-1">
                  {highlight}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PROGRESIÓN TÍPICA */}
        <div className="mb-12 rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">
            Progresión típica (jersey $550)
          </h3>
          <div className="space-y-2">
            {[
              { label: "Registro", pts: 500, total: 500 },
              { label: "1ª compra", pts: 200, total: 700 },
              { label: "2ª compra", pts: 200, total: 900 },
              { label: "3ª compra", pts: 200, total: 1100 },
              { label: "4ª compra", pts: 200, total: 1300 },
            ].map(({ label, pts, total }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-white/40 text-xs">{label}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${total >= goalPoints ? "bg-[#F8C37C]" : "bg-white/20"}`}
                    style={{ width: `${Math.min((total / goalPoints) * 100, 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-bold w-16 text-right ${total >= goalPoints ? "text-[#F8C37C]" : "text-white/40"}`}>
                  {total >= goalPoints ? "✅ GRATIS" : `${total} pts`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* HISTORIAL (colapsable) */}
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-2xl font-heading uppercase italic text-white tracking-tight mb-4 hover:text-[#F8C37C] transition-colors"
          >
            <TrendingUp size={20} />
            Historial
            <span className="text-base text-white/30 normal-case font-sans not-italic">
              {showHistory ? "▲" : "▼"}
            </span>
          </button>

          {showHistory && (
            history.length === 0 ? (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-12 text-center">
                <Star size={36} className="text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">Aún no tienes transacciones.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.07] overflow-hidden">
                {history.map((tx, i) => {
                  const isEarn = tx.type === "EARN";
                  return (
                    <div
                      key={tx.id}
                      className={`flex items-center gap-4 px-5 py-4 ${i < history.length - 1 ? "border-b border-white/[0.05]" : ""} hover:bg-white/[0.02] transition-colors`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isEarn ? "bg-emerald-500/10 text-emerald-400" : "bg-[#F8C37C]/10 text-[#F8C37C]"}`}>
                        {isEarn ? <TrendingUp size={16} /> : <Gift size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{tx.description}</p>
                        <p className="text-xs text-white/30">
                          {new Date(tx.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${isEarn ? "text-emerald-400" : "text-[#F8C37C]"}`}>
                        {isEarn ? "+" : ""}{tx.points} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* CTA */}
        <div className="mt-10 pt-8 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            Los puntos se acreditan al confirmar el pago de tu orden.
          </p>
          <Link
            href="/catalog"
            className="bg-[#F8C37C] text-black font-bold uppercase tracking-widest rounded-full px-7 py-3 text-xs hover:bg-[#f0b55a] transition-colors whitespace-nowrap"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
