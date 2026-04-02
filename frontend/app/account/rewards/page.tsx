"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Star, ShoppingBag, Gift, Trophy,
  TrendingUp, Lock, Sparkles, UserPlus, Loader2,
  Copy, Check, Zap, ChevronRight,
} from "lucide-react";

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

function getMotivationalText(points: number, goal: number, purchasesLeft: number): string {
  const pct = points / goal;
  if (pct >= 1) return "🎉 ¡JERSEY GRATIS DESBLOQUEADA!";
  if (purchasesLeft === 1) return "¡A UNA compra de tu jersey gratis!";
  if (pct >= 0.85) return "¡Estás a punto de lograrlo!";
  if (pct >= 0.7) return "¡Más de la mitad del camino!";
  if (pct >= 0.45) return "¡Vas muy bien, sigue así!";
  return "¡Ya empezaste! Cada compra te acerca más.";
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
  const goalPoints = balance?.goalPoints ?? 1450;
  const centsPerPoint = balance?.centsPerPoint ?? 200;
  const progress = Math.min((points / goalPoints) * 100, 100);
  const remaining = Math.max(goalPoints - points, 0);
  const ptsPerJersey = Math.round(55000 / centsPerPoint); // pts por jersey $550
  const purchasesLeft = remaining > 0 ? Math.ceil(remaining / ptsPerJersey) : 0;
  const motivational = getMotivationalText(points, goalPoints, purchasesLeft);

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
        <h2 className="text-5xl font-heading uppercase italic text-white tracking-tight">
          Tu jersey gratis<br />
          <span className="text-[#F8C37C]">te espera</span>
        </h2>
        <p className="text-white/50 max-w-sm text-sm">
          Crea tu cuenta gratis, llévate <strong className="text-white">500 puntos</strong> de bienvenida
          y empieza el camino a tu jersey gratis.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/register"
            className="bg-[#F8C37C] text-black font-bold uppercase tracking-widest rounded-full px-8 py-3 text-sm hover:bg-[#f0b55a] transition-colors"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="border border-white/20 text-white font-medium rounded-full px-8 py-3 text-sm hover:border-white/40 transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
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
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#F8C37C] mb-3">
            Programa de lealtad
          </p>
          <h1 className="text-5xl sm:text-6xl font-heading uppercase italic text-white tracking-tight leading-[0.9] mb-4">
            Acumula puntos<br />
            <span className="text-[#F8C37C]">con cada compra,</span><br />
            gana una jersey gratis
          </h1>
          <p className="text-white/50 text-sm max-w-md">
            Cada jersey que compras te acerca más. Cuando llegues a tu meta,
            una jersey es completamente tuya,{" "}
            <strong className="text-white">completamente gratis. Está va por nuestra parte.</strong>
          </p>
        </div>

        {/* BALANCE CARD */}
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden mb-4 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F8C37C]/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative">
            {/* Puntos + estado */}
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                <div className="flex items-end gap-3 mb-1">
                  <span className="text-6xl sm:text-7xl font-heading italic text-[#F8C37C] leading-none tabular-nums">
                    {points.toLocaleString("es-MX")}
                  </span>
                  <div className="pb-1">
                    <p className="text-xs uppercase tracking-widest text-white/40 font-bold">puntos</p>
                    <p className="text-sm text-white/50">de {goalPoints.toLocaleString("es-MX")}</p>
                  </div>
                </div>
                <p className="text-base font-bold text-white">{motivational}</p>
              </div>

              {/* Badge de compras restantes */}
              {points < goalPoints && (
                <div className="flex-shrink-0 text-center bg-[#F8C37C]/10 border border-[#F8C37C]/20 rounded-xl px-4 py-3">
                  <p className="text-2xl font-heading italic text-[#F8C37C] leading-none">{purchasesLeft}</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-0.5">
                    {purchasesLeft === 1 ? "compra más" : "compras más"}
                  </p>
                </div>
              )}
            </div>

            {remaining > 0 && (
              <p className="text-white/40 text-xs mb-5">
                Te faltan <span className="text-[#F8C37C] font-bold">{remaining} pts</span>
                {purchasesLeft === 1 && (
                  <span className="text-emerald-400 font-bold ml-1">— ¡1 jersey más y la consigues!</span>
                )}
              </p>
            )}

            {/* Barra de progreso */}
            <div className="mb-2">
              <div className="h-5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#F8C37C] to-[#fec375] rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  {progress > 5 && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                  )}
                  {/* Punta brillante */}
                  {progress > 3 && progress < 100 && (
                    <div className="absolute right-0 top-0 h-full w-3 bg-white/30 rounded-full" />
                  )}
                </div>
              </div>
              {/* Marcadores */}
              <div className="flex justify-between mt-2">
                {[0, Math.round(goalPoints * 0.25), Math.round(goalPoints * 0.5), Math.round(goalPoints * 0.75), goalPoints].map((marker) => (
                  <div
                    key={marker}
                    className={`text-[10px] font-bold ${points >= marker ? "text-[#F8C37C]" : "text-white/20"}`}
                  >
                    {marker === goalPoints ? (
                      <span className="flex items-center gap-0.5">
                        <Trophy size={10} />
                        {marker}
                      </span>
                    ) : marker === 0 ? "0" : marker}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ALERTA "ESTÁS CERCA" — cuando faltan 1-2 compras */}
        {points > 0 && points < goalPoints && purchasesLeft <= 2 && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Zap size={22} className="text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-white text-sm">
                  {purchasesLeft === 1
                    ? "¡Con tu próxima compra desbloqueas la jersey gratis!"
                    : "¡Estás a 2 jerseys de tu recompensa!"}
                </p>
                <p className="text-emerald-400/70 text-xs">
                  Te faltan solo {remaining} pts — equivale a {purchasesLeft} jersey{purchasesLeft > 1 ? "s" : ""} más
                </p>
              </div>
            </div>
            <Link
              href="/catalog"
              className="flex-shrink-0 bg-emerald-500 text-black font-bold uppercase tracking-wider rounded-full px-5 py-2.5 text-xs hover:bg-emerald-400 transition-colors flex items-center gap-1"
            >
              Ver jerseys <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* BOTÓN DE CANJE */}
        {points >= goalPoints && !redeemResult && (
          <div className="mb-8 rounded-2xl border border-[#F8C37C]/30 bg-[#F8C37C]/5 p-6 text-center">
            <Sparkles size={32} className="text-[#F8C37C] mx-auto mb-3" />
            <h3 className="text-3xl font-heading uppercase italic text-white mb-2">
              ¡La ganaste!
            </h3>
            <p className="text-white/50 text-sm mb-5 max-w-sm mx-auto">
              Tienes <strong className="text-white">$550 de descuento</strong> para usar en cualquier jersey.
              Si eliges Fan Básica, es completamente gratis.
            </p>
            {redeemError && <p className="text-red-400 text-sm mb-3">{redeemError}</p>}
            <button
              onClick={handleRedeem}
              disabled={redeeming}
              className="inline-flex items-center gap-2 bg-[#F8C37C] text-black font-black uppercase tracking-widest rounded-full px-10 py-4 text-sm hover:bg-[#f0b55a] transition-colors disabled:opacity-60"
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
            <h3 className="text-2xl font-heading uppercase italic text-white mb-2">¡Código generado!</h3>
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
              Elegir mi jersey gratis →
            </Link>
          </div>
        )}

        {/* CÓMO FUNCIONA */}
        <div className="mb-10">
          <h2 className="text-2xl font-heading uppercase italic text-white tracking-tight mb-5">
            Cómo funciona
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: UserPlus,
                step: "01",
                title: "Regístrate",
                desc: "Crea tu cuenta, empieza a acumular puntos desde hoy.",
                highlight: "+500 pts de bienvenida",
                color: "text-blue-400",
                bg: "bg-blue-400/10",
              },
              {
                icon: ShoppingBag,
                step: "02",
                title: "Compra jerseys",
                desc: "Por cada jersey que compres, acumulas puntos automáticamente.",
                highlight: "Puntos en cada compra",
                color: "text-[#F8C37C]",
                bg: "bg-[#F8C37C]/10",
              },
              {
                icon: Gift,
                step: "03",
                title: "¡Jersey gratis!",
                desc: "Escoge la jersey que siempre quisiste, completamente gratis.",
                highlight: "Tu jersey, tu elección",
                color: "text-emerald-400",
                bg: "bg-emerald-400/10",
              },
            ].map(({ icon: Icon, step, title, desc, highlight, color, bg }) => (
              <div
                key={step}
                className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 hover:border-white/20 hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl font-heading italic text-white/10 leading-none">{step}</span>
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon size={18} className={color} />
                  </div>
                </div>
                <h3 className="font-bold text-white uppercase tracking-wide text-sm mb-1">{title}</h3>
                <p className="text-white/40 text-xs leading-relaxed mb-3">{desc}</p>
                <span className={`text-[10px] font-black uppercase tracking-widest ${color} ${bg} rounded-full px-3 py-1`}>
                  {highlight}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PROGRESIÓN VISUAL — con jerseys como iconos */}
        <div className="mb-10 rounded-xl border border-white/[0.07] bg-white/[0.02] p-6">
          <h3 className="text-lg font-heading uppercase italic text-white mb-1">
            Tu camino a la jersey gratis
          </h3>
          <p className="text-white/40 text-xs mb-5">Comprando jerseys de $550</p>

          <div className="space-y-3">
            {[
              { label: "Registro", detail: "Bono de bienvenida", pts: 500, total: 500, Icon: UserPlus },
              { label: "1ª compra", detail: "Jersey + puntos", pts: ptsPerJersey, total: 500 + ptsPerJersey, Icon: ShoppingBag },
              { label: "2ª compra", detail: "Jersey + puntos", pts: ptsPerJersey, total: 500 + 2 * ptsPerJersey, Icon: ShoppingBag },
              { label: "3ª compra", detail: "¡Ya casi!", pts: ptsPerJersey, total: 500 + 3 * ptsPerJersey, Icon: Zap },
              { label: "4ª compra", detail: "¡Jersey gratis!", pts: ptsPerJersey, total: 500 + 4 * ptsPerJersey, Icon: Trophy },
            ].map(({ label, detail, pts, total, Icon }) => {
              const isGoal = total >= goalPoints;
              const isActive = points >= (total - pts);
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${isGoal ? "bg-[#F8C37C] text-black" : isActive ? "bg-white/10 text-white/60" : "bg-white/5 text-white/20"}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold ${isActive ? "text-white" : "text-white/40"}`}>{label}</span>
                      <span className="text-[10px] text-white/25">{detail}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isGoal ? "bg-[#F8C37C]" : "bg-white/25"}`}
                        style={{ width: `${Math.min((total / goalPoints) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-xs font-bold tabular-nums flex-shrink-0 w-20 text-right
                    ${isGoal ? "text-[#F8C37C]" : isActive ? "text-white/60" : "text-white/25"}`}>
                    {isGoal ? "✅ GRATIS" : `${total} pts`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA PRINCIPAL */}
        {points < goalPoints && (
          <div className="mb-10 rounded-2xl bg-gradient-to-br from-[#F8C37C]/10 to-[#F8C37C]/5 border border-[#F8C37C]/20 p-6 flex flex-col sm:flex-row items-center gap-5">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-[#F8C37C] text-xs font-bold uppercase tracking-widest mb-1">
                {purchasesLeft === 1 ? "¡A una compra de lograrlo!" : `${purchasesLeft} compras más`}
              </p>
              <p className="text-white font-bold text-lg">
                {purchasesLeft === 1
                  ? "Tu próxima jersey puede ser gratis"
                  : "Cada jersey te acerca más a la gratis"}
              </p>
            </div>
            <Link
              href="/catalog"
              className="flex-shrink-0 bg-[#F8C37C] text-black font-black uppercase tracking-widest rounded-full px-8 py-3 text-sm hover:bg-[#f0b55a] transition-colors whitespace-nowrap"
            >
              Ver jerseys →
            </Link>
          </div>
        )}

        {/* HISTORIAL (colapsable) */}
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-lg font-heading uppercase italic text-white/50 tracking-tight mb-4 hover:text-white transition-colors"
          >
            <TrendingUp size={18} />
            Historial de puntos
            <span className="text-base text-white/20 normal-case font-sans not-italic">
              {showHistory ? "▲" : "▼"}
            </span>
          </button>

          {showHistory && (
            history.length === 0 ? (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-10 text-center">
                <Star size={32} className="text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">Aún no tienes transacciones.</p>
                <Link href="/catalog" className="text-[#F8C37C] text-xs hover:underline mt-2 inline-block">
                  Haz tu primera compra →
                </Link>
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

        <div className="mt-8 pt-6 border-t border-white/[0.07]">
          <p className="text-white/20 text-xs text-center">
            Los puntos se acreditan al confirmar el pago · Válido solo en jerseysraw.com
          </p>
        </div>

      </div>
    </div>
  );
}
