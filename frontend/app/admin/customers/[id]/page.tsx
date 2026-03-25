"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Users, ShoppingBag, Star, Gift, MessageSquare,
  Plus, Trash2, Loader2, Tag, X, Check, Crown, AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";

/* ─────────────── Types ─────────────── */
interface CustomerDetail {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  customerTags: string[];
  stats: {
    totalOrders: number;
    totalSpentCents: number;
    avgOrderCents: number;
    repeatRate: number;
    favoriteClub: string | null;
    favoriteSizes: string[];
  };
  orders: Order[];
  notes: Note[];
  rewardHistory: RewardEvent[];
  rewardPoints: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  createdAt: string;
  itemCount: number;
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
}

interface RewardEvent {
  id: string;
  type: string;
  points: number;
  description: string | null;
  createdAt: string;
}

/* ─────────────── Helpers ─────────────── */
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "Pendiente",  cls: "bg-amber-50  text-amber-600  border-amber-200"  },
  PAID:       { label: "Pagado",     cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  PROCESSING: { label: "Proceso",   cls: "bg-sky-50    text-sky-600    border-sky-200"    },
  SHIPPED:    { label: "Enviado",    cls: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  DELIVERED:  { label: "Entregado", cls: "bg-teal-50   text-teal-600   border-teal-200"   },
  CANCELLED:  { label: "Cancelado", cls: "bg-rose-50   text-rose-600   border-rose-200"   },
  EXPIRED:    { label: "Expirado",  cls: "bg-slate-50  text-slate-500  border-slate-200"  },
};

const TAG_COLORS: Record<string, string> = {
  vip:        "bg-amber-50  text-amber-600  border-amber-200",
  recurrente: "bg-emerald-50 text-emerald-600 border-emerald-200",
  nuevo:      "bg-sky-50    text-sky-600    border-sky-200",
  inactivo:   "bg-slate-50  text-slate-500  border-slate-200",
};
function tagClass(t: string) {
  return TAG_COLORS[t.toLowerCase()] ?? "bg-violet-50 text-violet-600 border-violet-200";
}

function fmtMXN(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

const TABS = [
  { id: "orders",  label: "Órdenes",    icon: ShoppingBag },
  { id: "notes",   label: "Notas",      icon: MessageSquare },
  { id: "rewards", label: "Puntos",     icon: Gift },
] as const;
type TabId = typeof TABS[number]["id"];

/* ─────────────── Page ─────────────── */
export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<TabId>("orders");

  /* Tags editing */
  const [editingTags, setEditingTags] = useState(false);
  const [tagInput, setTagInput]       = useState("");
  const [tags, setTags]               = useState<string[]>([]);
  const [savingTags, setSavingTags]   = useState(false);

  /* Notes */
  const [noteInput, setNoteInput]     = useState("");
  const [addingNote, setAddingNote]   = useState(false);
  const [deletingNote, setDeletingNote] = useState<string | null>(null);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/v1/admin/crm/customers/${id}`, { auth: true });
      setCustomer(data);
      setTags(data.customerTags ?? []);
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCustomer(); }, [fetchCustomer]);

  /* ── Tags ── */
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t) || tags.length >= 20) return;
    setTags(prev => [...prev, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));
  const saveTags = async () => {
    setSavingTags(true);
    try {
      await api.put(`/api/v1/admin/crm/customers/${id}/tags`, { tags }, { auth: true });
      setCustomer(prev => prev ? { ...prev, customerTags: tags } : prev);
      setEditingTags(false);
    } catch { /* ignore */ } finally { setSavingTags(false); }
  };

  /* ── Notes ── */
  const addNote = async () => {
    if (!noteInput.trim()) return;
    setAddingNote(true);
    try {
      await api.post(`/api/v1/admin/crm/customers/${id}/notes`, { content: noteInput.trim() }, { auth: true });
      setNoteInput("");
      await fetchCustomer();
    } catch { /* ignore */ } finally { setAddingNote(false); }
  };
  const deleteNote = async (noteId: string) => {
    setDeletingNote(noteId);
    try {
      await api.delete(`/api/v1/admin/crm/customers/${id}/notes/${noteId}`, { auth: true });
      await fetchCustomer();
    } catch { /* ignore */ } finally { setDeletingNote(null); }
  };

  /* ─────────────── Render ─────────────── */
  if (loading) {
    return (
      <div className="flex justify-center py-40">
        <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-32">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400">Cliente no encontrado.</p>
        <button onClick={() => router.back()} className="mt-4 text-violet-500 text-sm font-semibold hover:underline">
          ← Volver
        </button>
      </div>
    );
  }

  const { stats } = customer;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-violet-500 transition-colors font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Clientes
      </button>

      {/* Header card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-start gap-5">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0">
          <Users className="w-7 h-7 text-violet-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-slate-800 leading-none">
              {customer.name || "Sin nombre"}
            </h1>
            {stats.totalOrders >= 3 && (
              <Crown className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5">{customer.email}</p>
          {customer.phone && <p className="text-xs text-slate-400">{customer.phone}</p>}
          <p className="text-xs text-slate-300 mt-1">Registro: {fmtDate(customer.createdAt)}</p>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {editingTags ? (
              <>
                {tags.map(t => (
                  <span key={t} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${tagClass(t)}`}>
                    {t}
                    <button onClick={() => removeTag(t)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                  placeholder="Nuevo tag…"
                  className="px-2 py-0.5 text-xs border border-violet-300 rounded-full outline-none focus:ring-1 ring-violet-300 w-28"
                />
                <button
                  onClick={saveTags}
                  disabled={savingTags}
                  className="flex items-center gap-1 px-2.5 py-1 bg-violet-500 text-white text-xs font-bold rounded-full hover:bg-violet-600 transition-colors disabled:opacity-50"
                >
                  {savingTags ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Guardar
                </button>
                <button
                  onClick={() => { setEditingTags(false); setTags(customer.customerTags); }}
                  className="px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 rounded-full border border-slate-200 transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                {customer.customerTags.map(t => (
                  <span key={t} className={`px-2 py-0.5 rounded-full text-xs font-bold border capitalize ${tagClass(t)}`}>
                    {t}
                  </span>
                ))}
                <button
                  onClick={() => setEditingTags(true)}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-dashed border-slate-300 text-slate-400 hover:border-violet-400 hover:text-violet-500 transition-colors"
                >
                  <Tag className="w-3 h-3" /> Editar tags
                </button>
              </>
            )}
          </div>
        </div>

        {/* KPI stats */}
        <div className="grid grid-cols-2 gap-3 text-center min-w-[220px]">
          <div className="bg-violet-50 rounded-xl p-3">
            <p className="text-lg font-black text-violet-700 tabular-nums">
              {fmtMXN(stats.totalSpentCents)}
            </p>
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wide">Gasto total</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-lg font-black text-slate-700">{stats.totalOrders}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Órdenes</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-lg font-black text-slate-700 tabular-nums">
              {stats.avgOrderCents > 0 ? fmtMXN(stats.avgOrderCents) : "—"}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Promedio</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-lg font-black text-emerald-700">{customer.rewardPoints}</p>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Puntos</p>
          </div>
        </div>
      </div>

      {/* Additional stats row */}
      {(stats.favoriteClub || stats.favoriteSizes.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.favoriteClub && (
            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Club favorito</p>
                <p className="font-bold text-slate-700">{stats.favoriteClub}</p>
              </div>
            </div>
          )}
          {stats.favoriteSizes.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-sky-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tallas frecuentes</p>
                <p className="font-bold text-slate-700">{stats.favoriteSizes.join(", ")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-100">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "border-violet-500 text-violet-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.id === "orders"  && <span className="ml-1 text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 font-bold">{customer.orders.length}</span>}
              {t.id === "notes"   && <span className="ml-1 text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 font-bold">{customer.notes.length}</span>}
              {t.id === "rewards" && <span className="ml-1 text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 font-bold">{customer.rewardPoints}</span>}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── Orders ── */}
          {tab === "orders" && (
            <div className="space-y-2">
              {customer.orders.length === 0 ? (
                <p className="text-sm text-slate-300 text-center py-8">Sin órdenes.</p>
              ) : customer.orders.map(o => {
                const s = STATUS_MAP[o.status] ?? { label: o.status, cls: "bg-slate-50 text-slate-500 border-slate-200" };
                return (
                  <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-violet-200 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-700">#{o.orderNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.cls}`}>{s.label}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {o.itemCount} artículo{o.itemCount !== 1 ? "s" : ""} · {fmtDate(o.createdAt)}
                      </p>
                    </div>
                    <span className="font-bold text-sm text-slate-700 tabular-nums">{fmtMXN(o.totalCents)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Notes ── */}
          {tab === "notes" && (
            <div className="space-y-4">
              {/* Add note */}
              <div className="flex gap-2">
                <textarea
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  placeholder="Escribe una nota interna sobre este cliente…"
                  rows={2}
                  className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400 resize-none transition-colors"
                />
                <button
                  onClick={addNote}
                  disabled={addingNote || !noteInput.trim()}
                  className="px-4 py-2 bg-violet-500 text-white rounded-xl text-sm font-bold hover:bg-violet-600 transition-colors disabled:opacity-40 flex items-center gap-1.5 self-end"
                >
                  {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Agregar
                </button>
              </div>

              {/* Notes list */}
              {customer.notes.length === 0 ? (
                <p className="text-sm text-slate-300 text-center py-6">Sin notas todavía.</p>
              ) : customer.notes.map(n => (
                <div key={n.id} className="group flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                    <p className="text-[10px] text-slate-300 mt-1">{fmtDate(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => deleteNote(n.id)}
                    disabled={deletingNote === n.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-rose-50"
                  >
                    {deletingNote === n.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Rewards ── */}
          {tab === "rewards" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-600">Balance actual</p>
                <span className="text-2xl font-black text-emerald-600">{customer.rewardPoints} pts</span>
              </div>
              {customer.rewardHistory.length === 0 ? (
                <p className="text-sm text-slate-300 text-center py-6">Sin historial de puntos.</p>
              ) : customer.rewardHistory.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black
                    ${r.points >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                    {r.points >= 0 ? "+" : ""}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700">
                      {r.description || r.type}
                    </p>
                    <p className="text-[10px] text-slate-400">{fmtDate(r.createdAt)}</p>
                  </div>
                  <span className={`font-bold text-sm tabular-nums ${r.points >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {r.points >= 0 ? "+" : ""}{r.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
