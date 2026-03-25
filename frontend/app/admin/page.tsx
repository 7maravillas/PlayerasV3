"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign, Package, ShoppingCart, TrendingUp,
  ArrowUpRight, Loader2, Eye, Users, ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import MiniBarList  from "@/components/admin/charts/MiniBarList";

/* ── Types ── */
interface DashboardData {
  grossRevenueCents: number; netRevenueCents: number;
  totalFeesCents: number;    todayGrossCents: number;
  todayNetCents: number;     todayOrderCount: number;
  pendingShipment: number;   totalProducts: number;
}
interface TimelinePoint {
  date: string; grossCents: number; netCents: number; orderCount: number;
}
interface ProductStat {
  productId: string; name: string; slug: string;
  imageUrl: string; clubName: string | null;
  views?: number; totalSold?: number; revenueCents?: number;
}
interface OrdersSummary {
  total: number; paidTotal: number;
  byStatus: Record<string, number>; avgOrderCents: number;
  repeatCustomerRate: number;
  fulfillmentBreakdown: { LOCAL: number; DROPSHIPPING: number };
}
interface CustomersSummary {
  totalCustomers: number; newCustomers: number;
  returningCustomers: number; avgLifetimeValueCents: number;
}

/* ── Helpers ── */
const fmtMXN = (c: number) =>
  (c / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "Pendiente",  color: "bg-amber-400"  },
  PAID:            { label: "Pagado",     color: "bg-emerald-400" },
  PROCESSING:      { label: "Procesando", color: "bg-indigo-400"  },
  SHIPPED:         { label: "Enviado",    color: "bg-sky-400"     },
  DELIVERED:       { label: "Entregado",  color: "bg-teal-400"    },
  CANCELLED:       { label: "Cancelado",  color: "bg-rose-400"    },
};

/* ── Component ── */
export default function AdminDashboard() {
  const [kpi,       setKpi]       = useState<DashboardData | null>(null);
  const [timeline,  setTimeline]  = useState<TimelinePoint[]>([]);
  const [topViewed, setTopViewed] = useState<ProductStat[]>([]);
  const [topSold,   setTopSold]   = useState<ProductStat[]>([]);
  const [orders,    setOrders]    = useState<OrdersSummary | null>(null);
  const [customers, setCustomers] = useState<CustomersSummary | null>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/api/v1/analytics/dashboard",                              { auth: true }),
      api.get("/api/v1/analytics/revenue/timeline?period=30d",           { auth: true }),
      api.get("/api/v1/analytics/products/top-viewed?period=30d&limit=5",{ auth: true }),
      api.get("/api/v1/analytics/products/top-sold?period=30d&limit=5",  { auth: true }),
      api.get("/api/v1/analytics/orders/summary?period=30d",             { auth: true }),
      api.get("/api/v1/analytics/customers/summary?period=30d",          { auth: true }),
    ]).then(([r0, r1, r2, r3, r4, r5]) => {
      if (r0.status === "fulfilled") setKpi(r0.value);
      if (r1.status === "fulfilled") setTimeline(r1.value?.series ?? []);
      if (r2.status === "fulfilled") setTopViewed(r2.value?.items ?? []);
      if (r3.status === "fulfilled") setTopSold(r3.value?.items ?? []);
      if (r4.status === "fulfilled") setOrders(r4.value);
      if (r5.status === "fulfilled") setCustomers(r5.value);
      setLoading(false);
    });
  }, []);

  const kpiCards = [
    {
      label: "Ingresos Netos",
      value: loading ? "..." : fmtMXN(kpi?.netRevenueCents ?? 0),
      sub:   loading ? "" : `Bruto: ${fmtMXN(kpi?.grossRevenueCents ?? 0)}`,
      icon:  DollarSign, color: "bg-indigo-50 text-indigo-500", border: "border-indigo-100",
      href:  "/admin/orders",
    },
    {
      label: "Ventas Hoy",
      value: loading ? "..." : `${kpi?.todayOrderCount ?? 0}`,
      sub:   loading ? "" : `Neto: ${fmtMXN(kpi?.todayNetCents ?? 0)}`,
      icon:  TrendingUp, color: "bg-emerald-50 text-emerald-500", border: "border-emerald-100",
      href:  "/admin/orders",
    },
    {
      label: "Pendientes de Envío",
      value: loading ? "..." : `${kpi?.pendingShipment ?? 0}`,
      sub:   "Pagadas, sin enviar",
      icon:  ShoppingCart, color: "bg-violet-50 text-violet-500", border: "border-violet-100",
      href:  "/admin/orders?status=PAID",
    },
    {
      label: "Productos",
      value: loading ? "..." : `${kpi?.totalProducts ?? 0}`,
      sub:   "En catálogo",
      icon:  Package, color: "bg-amber-50 text-amber-500", border: "border-amber-100",
      href:  "/admin/products",
    },
  ];

  const totalOrders = orders ? Object.values(orders.byStatus).reduce((s, v) => s + v, 0) : 0;

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Cabecera ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Panel de Control</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Resumen de tu tienda JerseysRAW.</p>
        </div>
        <div className="text-xs text-slate-400 bg-white border border-slate-100 px-4 py-2 rounded-full shadow-sm">
          {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card) => (
          <Link key={card.label} href={card.href}
            className={`bg-white border ${card.border} p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all block`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              {loading
                ? <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
                : <ArrowUpRight className="w-4 h-4 text-slate-300" />
              }
            </div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{card.value}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">{card.label}</p>
            {card.sub && <p className="text-[11px] text-slate-400 mt-1">{card.sub}</p>}
          </Link>
        ))}
      </div>

      {/* ── Revenue Timeline ── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-0.5">Últimos 30 días</p>
            <h2 className="text-base font-black text-slate-800">Ingresos Netos</h2>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-0.5 bg-indigo-400 rounded inline-block" />
              Neto
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-0.5 bg-indigo-200 rounded inline-block border-dashed" style={{ borderBottom: '1px dashed #c7d2fe', background: 'none' }} />
              Bruto
            </span>
          </div>
        </div>
        {loading
          ? <div className="flex items-center justify-center h-36"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
          : <RevenueChart data={timeline} />
        }
      </div>

      {/* ── Top Vistos + Top Vendidos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Vistos */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-0.5">30 días</p>
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" /> Más Vistos
              </h2>
            </div>
            <Link href="/admin/analytics?tab=views" className="text-xs text-slate-400 hover:text-indigo-500 flex items-center gap-1">
              Ver todo <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          {loading
            ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
            : <MiniBarList
                items={topViewed.map(p => ({ name: p.name, value: p.views ?? 0, imageUrl: p.imageUrl, clubName: p.clubName }))}
                color="bg-sky-400"
                formatValue={v => `${v} vistas`}
              />
          }
        </div>

        {/* Top Vendidos */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-0.5">30 días</p>
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Más Vendidos
              </h2>
            </div>
            <Link href="/admin/analytics?tab=sales" className="text-xs text-slate-400 hover:text-indigo-500 flex items-center gap-1">
              Ver todo <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          {loading
            ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
            : <MiniBarList
                items={topSold.map(p => ({ name: p.name, value: p.totalSold ?? 0, imageUrl: p.imageUrl, clubName: p.clubName }))}
                color="bg-emerald-400"
                formatValue={v => `${v} uds`}
              />
          }
        </div>
      </div>

      {/* ── Resumen Órdenes + Clientes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Resumen de Órdenes */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-0.5">30 días</p>
              <h2 className="text-base font-black text-slate-800">Resumen de Órdenes</h2>
            </div>
            <Link href="/admin/orders" className="text-xs text-slate-400 hover:text-indigo-500 flex items-center gap-1">
              Ver órdenes <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {loading || !orders
            ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
            : <div className="space-y-3">
                {/* KPIs inline */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xl font-black text-slate-800">{orders.total}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Total</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xl font-black text-slate-800">{fmtMXN(orders.avgOrderCents)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Ticket Promedio</p>
                  </div>
                </div>

                {/* Status bars */}
                <div className="space-y-2">
                  {Object.entries(orders.byStatus)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => {
                      const meta = STATUS_META[status] ?? { label: status, color: "bg-slate-300" };
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${meta.color} shrink-0`} />
                          <span className="text-xs text-slate-600 w-24 shrink-0">{meta.label}</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${meta.color} rounded-full`}
                              style={{ width: `${(count / Math.max(totalOrders, 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-500 w-6 text-right tabular-nums">{count}</span>
                        </div>
                      );
                    })
                  }
                </div>

                {/* Repeat rate */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Clientes recurrentes</span>
                  <span className="text-sm font-black text-indigo-500">{orders.repeatCustomerRate}%</span>
                </div>
              </div>
          }
        </div>

        {/* Resumen de Clientes */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-0.5">30 días</p>
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-400" /> Clientes
              </h2>
            </div>
            <Link href="/admin/customers" className="text-xs text-slate-400 hover:text-indigo-500 flex items-center gap-1">
              Ver CRM <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {loading || !customers
            ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
            : <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xl font-black text-slate-800">{customers.totalCustomers.toLocaleString("es-MX")}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Total</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <p className="text-xl font-black text-emerald-600">+{customers.newCustomers}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mt-0.5">Nuevos (30d)</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xl font-black text-slate-800">{customers.returningCustomers}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Recurrentes</p>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-3">
                    <p className="text-xl font-black text-indigo-600">{fmtMXN(customers.avgLifetimeValueCents)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mt-0.5">LTV Promedio</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Fulfillment mixto (30d)</span>
                  {orders && (
                    <span className="text-xs text-slate-600 font-semibold">
                      {orders.fulfillmentBreakdown.LOCAL} Local · {orders.fulfillmentBreakdown.DROPSHIPPING} Drop
                    </span>
                  )}
                </div>
              </div>
          }
        </div>
      </div>

    </div>
  );
}
