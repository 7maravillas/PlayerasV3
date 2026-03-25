"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Eye, TrendingUp, Target, Trophy, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

/* ── Types ── */
type Period = "7d" | "30d" | "90d";
type Tab    = "views" | "sales" | "conversion";

interface ViewedProduct {
  productId: string; name: string; slug: string;
  imageUrl: string;  clubName: string | null; views: number;
}
interface SoldProduct {
  productId: string; name: string; slug: string;
  imageUrl: string;  clubName: string | null;
  totalSold: number; revenueCents: number;
}
interface ConversionProduct {
  productId: string; name: string; slug: string;
  imageUrl: string;  clubName: string | null;
  views: number; purchases: number;
  conversionRate: number; revenueCents: number;
}

/* ── Helpers ── */
const fmtMXN = (c: number) =>
  (c / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const PERIODS: { label: string; value: Period }[] = [
  { label: "7 días",  value: "7d"  },
  { label: "30 días", value: "30d" },
  { label: "90 días", value: "90d" },
];

const TABS: { label: string; value: Tab; icon: React.ElementType }[] = [
  { label: "Vistas",      value: "views",      icon: Eye       },
  { label: "Ventas",      value: "sales",      icon: TrendingUp},
  { label: "Conversión",  value: "conversion", icon: Target    },
];

/* ── Sub-components ── */
function ProductImg({ src, alt }: { src: string; alt: string }) {
  return src
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={src} alt={alt} className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-100 shrink-0" />
    : <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />;
}

function Bar({ value, max, color = "bg-indigo-400" }: { value: number; max: number; color?: string }) {
  return (
    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`}
        style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color, count }: {
  icon: React.ElementType; title: string; color: string; count: number;
}) {
  return (
    <div className={`flex items-center gap-2 mb-4 pb-3 border-b border-slate-100`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <h3 className="text-sm font-black text-slate-700">{title}</h3>
      <span className="text-xs text-slate-400">({count})</span>
    </div>
  );
}

/* ── Main page (wrapped for Suspense) ── */
function AnalyticsContent() {
  const router      = useSearchParams();
  const initTab     = (router.get("tab") as Tab) ?? "views";

  const [period,  setPeriod]  = useState<Period>("30d");
  const [tab,     setTab]     = useState<Tab>(initTab);
  const [loading, setLoading] = useState(true);

  const [topViewed,       setTopViewed]       = useState<ViewedProduct[]>([]);
  const [leastViewed,     setLeastViewed]     = useState<ViewedProduct[]>([]);
  const [topSold,         setTopSold]         = useState<SoldProduct[]>([]);
  const [leastSold,       setLeastSold]       = useState<SoldProduct[]>([]);
  const [bestConversion,  setBestConversion]  = useState<ConversionProduct[]>([]);
  const [worstConversion, setWorstConversion] = useState<ConversionProduct[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      api.get(`/api/v1/analytics/products/top-viewed?period=${period}&limit=10`,         { auth: true }),
      api.get(`/api/v1/analytics/products/least-viewed?period=${period}&limit=5`,        { auth: true }),
      api.get(`/api/v1/analytics/products/top-sold?period=${period}&limit=10`,           { auth: true }),
      api.get(`/api/v1/analytics/products/least-sold?period=${period}&limit=5`,          { auth: true }),
      api.get(`/api/v1/analytics/products/conversion?period=${period}&limit=10&sort=best`,  { auth: true }),
      api.get(`/api/v1/analytics/products/conversion?period=${period}&limit=5&sort=worst`,  { auth: true }),
    ]).then(([r0, r1, r2, r3, r4, r5]) => {
      if (r0.status === "fulfilled") setTopViewed(r0.value?.items       ?? []);
      if (r1.status === "fulfilled") setLeastViewed(r1.value?.items     ?? []);
      if (r2.status === "fulfilled") setTopSold(r2.value?.items         ?? []);
      if (r3.status === "fulfilled") setLeastSold(r3.value?.items       ?? []);
      if (r4.status === "fulfilled") setBestConversion(r4.value?.items  ?? []);
      if (r5.status === "fulfilled") setWorstConversion(r5.value?.items ?? []);
      setLoading(false);
    });
  }, [period]);

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Cabecera ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">CRM</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">Analíticas</h1>
          <p className="text-slate-400 text-sm mt-1">Rendimiento de productos en tu catálogo.</p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === p.value
                  ? "bg-white shadow text-slate-800"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${
              tab === t.value
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
        </div>
      ) : (
        <>
          {/* ── VISTAS ── */}
          {tab === "views" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                <SectionHeader icon={Trophy} title="Más vistos" color="text-sky-500" count={topViewed.length} />
                <ViewsTable items={topViewed} />
              </div>
              <div className="bg-white border border-amber-100 rounded-2xl shadow-sm p-6">
                <SectionHeader icon={AlertTriangle} title="Menos vistos" color="text-amber-400" count={leastViewed.length} />
                <ViewsTable items={leastViewed} dim />
              </div>
            </div>
          )}

          {/* ── VENTAS ── */}
          {tab === "sales" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                <SectionHeader icon={Trophy} title="Más vendidos" color="text-emerald-500" count={topSold.length} />
                <SalesTable items={topSold} />
              </div>
              <div className="bg-white border border-amber-100 rounded-2xl shadow-sm p-6">
                <SectionHeader icon={AlertTriangle} title="Menos vendidos" color="text-amber-400" count={leastSold.length} />
                <SalesTable items={leastSold} dim />
              </div>
            </div>
          )}

          {/* ── CONVERSIÓN ── */}
          {tab === "conversion" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                <SectionHeader icon={Trophy} title="Mejor conversión" color="text-indigo-500" count={bestConversion.length} />
                <ConversionTable items={bestConversion} />
              </div>
              <div className="bg-white border border-amber-100 rounded-2xl shadow-sm p-6">
                <SectionHeader icon={AlertTriangle} title="Peor conversión" color="text-amber-400" count={worstConversion.length} />
                <ConversionTable items={worstConversion} dim />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Tables ── */

function ViewsTable({ items, dim }: { items: ViewedProduct[]; dim?: boolean }) {
  const max = Math.max(...items.map(i => i.views), 1);
  if (!items.length) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-8">#</th>
            <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Producto</th>
            <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden sm:table-cell">Club</th>
            <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Vistas</th>
            <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell w-28" />
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.productId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="py-3 px-3 text-xs font-bold text-slate-300">{idx + 1}</td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-3">
                  <ProductImg src={item.imageUrl} alt={item.name} />
                  <span className={`text-sm font-semibold truncate max-w-[200px] ${dim ? "text-slate-400" : "text-slate-700"}`}>
                    {item.name}
                  </span>
                </div>
              </td>
              <td className="py-3 px-3 text-xs text-slate-400 hidden sm:table-cell">{item.clubName ?? "—"}</td>
              <td className="py-3 px-3 text-right">
                <span className={`text-sm font-black tabular-nums ${dim ? "text-amber-500" : "text-sky-600"}`}>
                  {item.views.toLocaleString("es-MX")}
                </span>
              </td>
              <td className="py-3 px-3 hidden md:table-cell">
                <Bar value={item.views} max={max} color={dim ? "bg-amber-300" : "bg-sky-400"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalesTable({ items, dim }: { items: SoldProduct[]; dim?: boolean }) {
  const max = Math.max(...items.map(i => i.totalSold), 1);
  if (!items.length) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-8">#</th>
            <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Producto</th>
            <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden sm:table-cell">Club</th>
            <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Unidades</th>
            <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden sm:table-cell">Revenue</th>
            <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell w-28" />
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.productId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="py-3 px-3 text-xs font-bold text-slate-300">{idx + 1}</td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-3">
                  <ProductImg src={item.imageUrl} alt={item.name} />
                  <span className={`text-sm font-semibold truncate max-w-[200px] ${dim ? "text-slate-400" : "text-slate-700"}`}>
                    {item.name}
                  </span>
                </div>
              </td>
              <td className="py-3 px-3 text-xs text-slate-400 hidden sm:table-cell">{item.clubName ?? "—"}</td>
              <td className="py-3 px-3 text-right">
                <span className={`text-sm font-black tabular-nums ${dim ? "text-amber-500" : "text-emerald-600"}`}>
                  {item.totalSold.toLocaleString("es-MX")}
                </span>
              </td>
              <td className="py-3 px-3 text-right text-xs text-slate-400 hidden sm:table-cell tabular-nums">
                {fmtMXN(item.revenueCents)}
              </td>
              <td className="py-3 px-3 hidden md:table-cell">
                <Bar value={item.totalSold} max={max} color={dim ? "bg-amber-300" : "bg-emerald-400"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConversionTable({ items, dim }: { items: ConversionProduct[]; dim?: boolean }) {
  const max = Math.max(...items.map(i => i.conversionRate), 1);
  if (!items.length) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-8">#</th>
            <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Producto</th>
            <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden sm:table-cell">Vistas</th>
            <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden sm:table-cell">Compras</th>
            <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Tasa</th>
            <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell w-28" />
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.productId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="py-3 px-3 text-xs font-bold text-slate-300">{idx + 1}</td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-3">
                  <ProductImg src={item.imageUrl} alt={item.name} />
                  <div>
                    <span className={`text-sm font-semibold block truncate max-w-[180px] ${dim ? "text-slate-400" : "text-slate-700"}`}>
                      {item.name}
                    </span>
                    {item.clubName && (
                      <span className="text-[11px] text-slate-400">{item.clubName}</span>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3 px-3 text-right text-xs text-slate-400 hidden sm:table-cell tabular-nums">
                {item.views.toLocaleString("es-MX")}
              </td>
              <td className="py-3 px-3 text-right text-xs text-slate-400 hidden sm:table-cell tabular-nums">
                {item.purchases.toLocaleString("es-MX")}
              </td>
              <td className="py-3 px-3 text-right">
                <span className={`text-sm font-black tabular-nums ${
                  dim
                    ? "text-amber-500"
                    : item.conversionRate >= 5
                      ? "text-emerald-600"
                      : item.conversionRate >= 2
                        ? "text-indigo-600"
                        : "text-slate-600"
                }`}>
                  {Number(item.conversionRate).toFixed(1)}%
                </span>
              </td>
              <td className="py-3 px-3 hidden md:table-cell">
                <Bar value={item.conversionRate} max={max} color={dim ? "bg-amber-300" : "bg-indigo-400"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty() {
  return <p className="text-xs text-slate-300 text-center py-8">Sin datos para el período seleccionado</p>;
}

/* ── Export with Suspense (useSearchParams requires it) ── */
export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  );
}
