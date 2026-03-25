"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Star, ShoppingBag, Gift, Trophy, TrendingUp, Lock } from "lucide-react";

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

export default function RewardsPage() {
  const { user, token, loading } = useAuth();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

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
  const goalPoints = balance?.goalPoints ?? 550;
  const centsPerPoint = balance?.centsPerPoint ?? 400;
  const progress = Math.min((points / goalPoints) * 100, 100);
  const remaining = Math.max(goalPoints - points, 0);
  const pesosNeeded = Math.ceil(remaining * centsPerPoint / 100);

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
      {/* ── Fondo decorativo ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#F8C37C]/3 blur-[120px]" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[400px] rounded-full bg-[#F8C37C]/2 blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* ── Back ── */}
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft size={16} />
          Mi cuenta
        </Link>

        {/* ── HEADER ── */}
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#F8C37C] mb-3">
            Programa de lealtad
          </p>
          <h1 className="text-6xl sm:text-7xl font-heading uppercase italic text-white tracking-tight leading-[0.9] mb-4">
            Mis<br />
            <span className="text-[#F8C37C]">Recompensas</span>
          </h1>
          <p className="text-white/50 text-sm max-w-md">
            Cada compra te acerca más a una playera gratis. Acumula puntos y canjéalos cuando quieras.
          </p>
        </div>

        {/* ── BALANCE CARD ── */}
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden mb-10 p-6 sm:p-8">
          {/* Decoración interna */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F8C37C]/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative">
            {/* Puntos principales */}
            <div className="flex items-end gap-4 mb-2">
              <span className="text-7xl sm:text-8xl font-heading italic text-[#F8C37C] leading-none tabular-nums">
                {points.toLocaleString("es-MX")}
              </span>
              <div className="pb-2">
                <p className="text-xs uppercase tracking-widest text-white/40 font-bold">puntos</p>
                <p className="text-lg font-bold text-white">
                  = ${points.toLocaleString("es-MX")} MXN
                </p>
              </div>
            </div>

            <p className="text-white/40 text-sm mb-6">
              {points >= goalPoints
                ? "🎉 ¡Tienes suficientes puntos para canjear una playera gratis!"
                : `Te faltan ${remaining} pts (~$${pesosNeeded} MXN en compras) para tu próxima playera gratis`}
            </p>

            {/* Barra de progreso */}
            <div>
              <div className="flex justify-between text-xs text-white/40 mb-2">
                <span>{points} pts</span>
                <span className="flex items-center gap-1">
                  <Trophy size={11} className="text-[#F8C37C]" />
                  {goalPoints} pts — playera gratis
                </span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
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
                {[25, 50, 75, 100].map((pct) => (
                  <div
                    key={pct}
                    className={`text-[10px] ${progress >= pct ? "text-[#F8C37C]" : "text-white/20"}`}
                  >
                    {Math.round(goalPoints * pct / 100)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── CÓMO FUNCIONA ── */}
        <div className="mb-12">
          <h2 className="text-2xl font-heading uppercase italic text-white tracking-tight mb-6">
            Cómo funciona
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: ShoppingBag,
                step: "01",
                title: "Compra",
                desc: `~1 punto por cada $${Math.round((centsPerPoint) / 100)} MXN gastados en playeras elegibles`,
              },
              {
                icon: TrendingUp,
                step: "02",
                title: "Acumula",
                desc: `Junta ${goalPoints} puntos para un descuento de $${Math.round(goalPoints * (balance?.pointValueCents ?? 100) / 100)} MXN`,
              },
              {
                icon: Gift,
                step: "03",
                title: "Canjea",
                desc: "Aplica tus puntos como descuento en tu siguiente compra al hacer checkout",
              },
            ].map(({ icon: Icon, step, title, desc }) => (
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
                <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── HISTORIAL ── */}
        <div>
          <h2 className="text-2xl font-heading uppercase italic text-white tracking-tight mb-6">
            Historial
          </h2>

          {history.length === 0 ? (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-12 text-center">
              <Star size={36} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Aún no tienes transacciones.</p>
              <Link
                href="/catalog"
                className="inline-block mt-4 text-xs font-bold uppercase tracking-widest text-[#F8C37C] hover:opacity-70 transition-opacity"
              >
                Ir al catálogo →
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.07] overflow-hidden">
              {history.map((tx, i) => {
                const isEarn = tx.type === "EARN";
                return (
                  <div
                    key={tx.id}
                    className={`flex items-center gap-4 px-5 py-4 ${
                      i < history.length - 1 ? "border-b border-white/[0.05]" : ""
                    } hover:bg-white/[0.02] transition-colors`}
                  >
                    {/* Icono */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isEarn
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-[#F8C37C]/10 text-[#F8C37C]"
                      }`}
                    >
                      {isEarn ? <TrendingUp size={16} /> : <Gift size={16} />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {tx.description}
                      </p>
                      <p className="text-xs text-white/30">
                        {new Date(tx.createdAt).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Puntos */}
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        isEarn ? "text-emerald-400" : "text-[#F8C37C]"
                      }`}
                    >
                      {isEarn ? "+" : ""}{tx.points} pts
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CTA ── */}
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
