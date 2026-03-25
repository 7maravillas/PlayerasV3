"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Users, ChevronLeft, ChevronRight, Search,
  CheckCircle, XCircle, Loader2, ArrowUpDown, Tag, TrendingUp
} from "lucide-react";
import { api } from "@/lib/api";

interface Customer {
  id: string;
  email: string;
  name: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  totalOrders: number;
  totalSpentCents: number;
  lastOrderDate: string | null;
  customerTags: string[];
}

const SORT_OPTIONS = [
  { value: "recent",      label: "Más recientes" },
  { value: "spent_desc",  label: "Mayor gasto" },
  { value: "orders_desc", label: "Más órdenes" },
];

const TAG_COLORS: Record<string, string> = {
  vip:        "bg-amber-50  text-amber-600  border-amber-200",
  recurrente: "bg-emerald-50 text-emerald-600 border-emerald-200",
  nuevo:      "bg-sky-50    text-sky-600    border-sky-200",
  inactivo:   "bg-slate-50  text-slate-500  border-slate-200",
};

function tagClass(tag: string) {
  return TAG_COLORS[tag.toLowerCase()] ?? "bg-violet-50 text-violet-600 border-violet-200";
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort]           = useState("recent");
  const [tagFilter, setTagFilter] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCustomers = async (pg: number, q: string, s: string, t: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: "20", sort: s });
      if (q) params.append("search", q);
      if (t) params.append("tag", t);
      const data = await api.get(`/api/v1/admin/crm/customers?${params}`, { auth: true });
      setCustomers(data.items || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(page, search, sort, tagFilter); }, [page, search, sort, tagFilter]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 350);
  };

  const handleSort = (val: string) => { setSort(val); setPage(1); };
  const handleTag  = (val: string) => { setTagFilter(v => v === val ? "" : val); setPage(1); };

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const fmtMXN = (cents: number) =>
    (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

  const COMMON_TAGS = ["vip", "recurrente", "nuevo", "inactivo"];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Cabecera */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-1">CRM</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-500" />
          </div>
          Clientes
          <span className="text-sm font-normal text-slate-400 ml-2">({total})</span>
        </h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Buscador */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-violet-400 outline-none transition-colors"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sort}
            onChange={e => handleSort(e.target.value)}
            className="bg-transparent text-slate-600 text-sm outline-none pr-1 cursor-pointer"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Tags rápidos */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          {COMMON_TAGS.map(t => (
            <button
              key={t}
              onClick={() => handleTag(t)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all capitalize ${
                tagFilter === t
                  ? tagClass(t) + " ring-2 ring-offset-1 ring-violet-300"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
          {tagFilter && !COMMON_TAGS.includes(tagFilter) && (
            <button
              onClick={() => setTagFilter("")}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${tagClass(tagFilter)}`}
            >
              {tagFilter} ×
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">
            {search || tagFilter ? "No se encontraron clientes." : "Aún no hay clientes registrados."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Cliente</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Tags</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Verificado</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Gasto total</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Órdenes</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Última orden</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-violet-50/30 transition-colors group">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="group-hover:text-violet-600 transition-colors">
                      <p className="font-semibold text-slate-800 group-hover:text-violet-600">
                        {c.name || <span className="text-slate-400 italic font-normal">Sin nombre</span>}
                      </p>
                      <p className="text-xs text-slate-400">{c.email}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.customerTags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          onClick={() => handleTag(tag)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer capitalize transition-all hover:ring-1 hover:ring-violet-300 ${tagClass(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                      {c.customerTags.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-400 border-slate-200">
                          +{c.customerTags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.emailVerifiedAt
                      ? <CheckCircle className="w-4 h-4 text-emerald-500 inline" />
                      : <XCircle className="w-4 h-4 text-slate-300 inline" />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold tabular-nums text-sm ${c.totalSpentCents > 0 ? "text-emerald-600" : "text-slate-300"}`}>
                      {c.totalSpentCents > 0 ? fmtMXN(c.totalSpentCents) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-violet-50 text-violet-600 text-xs font-bold">
                      {c.totalOrders}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{fmt(c.lastOrderDate)}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{fmt(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-violet-50 disabled:opacity-30 text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-400 font-mono">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-violet-50 disabled:opacity-30 text-slate-500 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <TrendingUp className="w-3.5 h-3.5" />
        <span>Haz clic en un cliente para ver su perfil completo.</span>
      </div>
    </div>
  );
}
