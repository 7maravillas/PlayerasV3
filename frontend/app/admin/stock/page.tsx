"use client";

import { useState, useEffect, useRef } from "react";
import {
  Package, ChevronDown, ChevronUp, Plus, Loader2,
  FileDown, AlertTriangle, CheckCircle, Search, Filter, X,
} from "lucide-react";
import { api } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface StockMovement {
  id: string;
  quantity: number;
  notes: string;
  createdAt: string;
}

interface VariantRow {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  audience: string | null;
  sleeve: string | null;
  isDropshippable: boolean;
  isPlayerVersion: boolean;
  allowsNameNumber: boolean;
  priceCents: number;
  stock: number;
  sold: number;
  totalRestocked: number;
  initialStock: number;
  recentMovements: StockMovement[];
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  variants: VariantRow[];
}

type StockFilter = "all" | "low" | "out";

const AUDIENCE_LABELS: Record<string, string> = {
  HOMBRE: "Hombre",
  MUJER: "Mujer",
  NINO: "Niño",
};

const SLEEVE_LABELS: Record<string, string> = {
  SHORT: "Manga corta",
  LONG:  "Manga larga",
};

/* ─────────────────────── Modal nueva variante ─────────────────────── */
interface NewVariantModalProps {
  product: ProductRow;
  onClose: () => void;
  onCreated: () => void;
}

const EMPTY_FORM = {
  sku: "",
  size: "",
  color: "",
  audience: "HOMBRE",
  sleeve: "SHORT",
  priceCents: "",
  compareAtPriceCents: "",
  stock: "1",
  isDropshippable: false,
  isPlayerVersion: false,
  allowsNameNumber: false,
  hasLeaguePatch: false,
  hasChampionsPatch: false,
};

function NewVariantModal({ product, onClose, onCreated }: NewVariantModalProps) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const price = Number(form.priceCents);
    const compareAt = form.compareAtPriceCents ? Number(form.compareAtPriceCents) : undefined;
    const stock = Number(form.stock);

    if (!form.sku.trim() || form.sku.trim().length < 4) {
      setError("El SKU debe tener al menos 4 caracteres.");
      return;
    }
    if (!price || price <= 0) {
      setError("El precio debe ser mayor a 0.");
      return;
    }
    if (!stock || stock < 0) {
      setError("Las unidades deben ser 0 o más.");
      return;
    }

    setSaving(true);
    try {
      await api.post(
        "/api/v1/variants",
        {
          productId: product.id,
          sku: form.sku.trim(),
          size: form.size.trim() || undefined,
          color: form.color.trim() || undefined,
          audience: form.audience,
          sleeve: form.sleeve,
          priceCents: Math.round(price * 100),
          compareAtPriceCents: compareAt ? Math.round(compareAt * 100) : undefined,
          stock,
          isDropshippable: form.isDropshippable,
          isPlayerVersion: form.isPlayerVersion,
          allowsNameNumber: form.allowsNameNumber,
          hasLeaguePatch: form.hasLeaguePatch,
          hasChampionsPatch: form.hasChampionsPatch,
        },
        { auth: true },
      );
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al crear la variante.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-0.5">Nueva variante</p>
            <h2 className="text-lg font-black text-slate-800 leading-tight">{product.name}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* SKU */}
          <div>
            <label className={labelClass}>SKU *</label>
            <input
              className={inputClass}
              placeholder="Ej. RMAD-HOME-25-M-H"
              value={form.sku}
              onChange={e => set("sku", e.target.value)}
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">Identificador único de la variante.</p>
          </div>

          {/* Talla + Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Talla</label>
              <input
                className={inputClass}
                placeholder="S, M, L, XL..."
                value={form.size}
                onChange={e => set("size", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Color</label>
              <input
                className={inputClass}
                placeholder="Blanco, Negro..."
                value={form.color}
                onChange={e => set("color", e.target.value)}
              />
            </div>
          </div>

          {/* Audiencia + Manga */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Audiencia *</label>
              <select
                className={inputClass}
                value={form.audience}
                onChange={e => set("audience", e.target.value)}
              >
                <option value="HOMBRE">Hombre</option>
                <option value="MUJER">Mujer</option>
                <option value="NINO">Niño</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Manga *</label>
              <select
                className={inputClass}
                value={form.sleeve}
                onChange={e => set("sleeve", e.target.value)}
              >
                <option value="SHORT">Manga corta</option>
                <option value="LONG">Manga larga</option>
              </select>
            </div>
          </div>

          {/* Precio + Precio comparado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Precio (MXN) *</label>
              <input
                className={inputClass}
                type="number"
                min={1}
                step="0.01"
                placeholder="599.00"
                value={form.priceCents}
                onChange={e => set("priceCents", e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Precio tachado (MXN)</label>
              <input
                className={inputClass}
                type="number"
                min={1}
                step="0.01"
                placeholder="799.00"
                value={form.compareAtPriceCents}
                onChange={e => set("compareAtPriceCents", e.target.value)}
              />
            </div>
          </div>

          {/* Unidades */}
          <div>
            <label className={labelClass}>Unidades iniciales *</label>
            <input
              className={inputClass}
              type="number"
              min={0}
              max={9999}
              placeholder="0"
              value={form.stock}
              onChange={e => set("stock", e.target.value)}
              required
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2 pt-1">
            <p className={labelClass}>Opciones</p>
            {[
              { key: "isDropshippable",  label: "Dropshipping (sin stock físico)" },
              { key: "isPlayerVersion",  label: "Versión jugador" },
              { key: "allowsNameNumber", label: "Permite nombre y número" },
              { key: "hasLeaguePatch",   label: "Parche de liga" },
              { key: "hasChampionsPatch",label: "Parche Champions/UCL" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => set(key, !form[key as keyof typeof form])}
                  className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                    form[key as keyof typeof form]
                      ? "bg-indigo-500 border-indigo-500"
                      : "bg-white border-slate-300 group-hover:border-indigo-300"
                  }`}
                >
                  {form[key as keyof typeof form] && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-slate-600">{label}</span>
              </label>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Crear variante
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────── Página principal ─────────────────────── */
export default function AdminStockPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StockFilter>("all");
  const [search, setSearch] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  // Restock state: variantId → input value
  const [restockQty, setRestockQty] = useState<Record<string, string>>({});
  const [restockNotes, setRestockNotes] = useState<Record<string, string>>({});
  const [restocking, setRestocking] = useState<string | null>(null);
  const [restockSuccess, setRestockSuccess] = useState<string | null>(null);

  // Modal nueva variante
  const [newVariantProduct, setNewVariantProduct] = useState<ProductRow | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const fetchStock = async () => {
    try {
      const data = await api.get("/api/v1/admin/stock", { auth: true });
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStock(); }, []);

  const handleRestock = async (variantId: string) => {
    const qty = Number(restockQty[variantId] || "0");
    if (!qty || qty < 1) return;
    setRestocking(variantId);
    try {
      await api.post(
        `/api/v1/admin/stock/${variantId}/restock`,
        { quantity: qty, notes: restockNotes[variantId] ?? "" },
        { auth: true },
      );
      setRestockQty(prev => { const n = { ...prev }; delete n[variantId]; return n; });
      setRestockNotes(prev => { const n = { ...prev }; delete n[variantId]; return n; });
      setRestockSuccess(variantId);
      setTimeout(() => setRestockSuccess(null), 3000);
      fetchStock();
    } catch {
      alert("Error al reponer stock");
    } finally {
      setRestocking(null);
    }
  };

  const downloadPDF = () => {
    setPdfLoading(true);
    const token = localStorage.getItem("admin_token") || "";
    fetch(`${API_BASE}/api/v1/admin/stock/report/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `inventario-${new Date().toISOString().split("T")[0]}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => alert("No se pudo generar el PDF"))
      .finally(() => setPdfLoading(false));
  };

  // ── Filtrado ──
  const displayed = products
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => {
      if (filter === "all") return true;
      return p.variants.some(v => {
        if (v.isDropshippable) return false;
        if (filter === "out") return v.stock === 0;
        if (filter === "low") return v.stock > 0 && v.stock <= 3;
        return false;
      });
    });

  // ── Stats globales ──
  const totalProducts  = products.length;
  const totalVariants  = products.reduce((s, p) => s + p.variants.length, 0);
  const totalStock     = products.reduce((s, p) => s + p.variants.reduce((sv, v) => sv + v.stock, 0), 0);
  const outOfStockCnt  = products.reduce((s, p) => s + p.variants.filter(v => !v.isDropshippable && v.stock === 0).length, 0);
  const lowStockCnt    = products.reduce((s, p) => s + p.variants.filter(v => !v.isDropshippable && v.stock > 0 && v.stock <= 3).length, 0);

  const stockBadge = (v: VariantRow) => {
    if (v.isDropshippable) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-sky-50 text-sky-600 border-sky-200">✈️ Drop</span>;
    if (v.stock === 0)     return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-red-50 text-red-600 border-red-200">Agotado</span>;
    if (v.stock <= 3)      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-600 border-amber-200">⚠ Bajo</span>;
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-600 border-emerald-200">OK</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <>
      {newVariantProduct && (
        <NewVariantModal
          product={newVariantProduct}
          onClose={() => setNewVariantProduct(null)}
          onCreated={fetchStock}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        {/* Cabecera */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Logística</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-indigo-500" />
              </div>
              Inventario
            </h1>
          </div>
          <button
            onClick={downloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Descargar PDF
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Productos",       value: totalProducts,  color: "text-slate-800" },
            { label: "Variantes",       value: totalVariants,  color: "text-slate-800" },
            { label: "Unidades disp.",  value: totalStock,     color: "text-slate-800" },
            { label: "Bajo stock",      value: lowStockCnt,    color: lowStockCnt  > 0 ? "text-amber-600" : "text-slate-800" },
            { label: "Sin stock",       value: outOfStockCnt,  color: outOfStockCnt > 0 ? "text-red-600"   : "text-slate-800" },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-slate-100 rounded-xl p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-black tabular-nums ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-48">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-sm text-slate-700 bg-transparent outline-none w-full placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {([["all", "Todos"], ["low", "⚠ Bajo stock"], ["out", "❌ Agotados"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === key ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de productos */}
        {displayed.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
            <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No hay productos.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(product => {
              const isExpanded = expandedId === product.id;
              const hasAlert = product.variants.some(v => !v.isDropshippable && v.stock <= 3);
              const hasOut   = product.variants.some(v => !v.isDropshippable && v.stock === 0);

              return (
                <div key={product.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-sm transition-all">
                  {/* Header del producto */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer select-none"
                    onClick={() => setExpandedId(isExpanded ? null : product.id)}
                  >
                    {product.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="w-12 h-14 object-cover rounded-lg border border-slate-100 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-black text-slate-800 truncate">{product.name}</p>
                        {hasOut   && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                        {!hasOut && hasAlert && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-400">
                        {product.variants.length} variante{product.variants.length !== 1 ? "s" : ""}
                        {" · "}
                        {product.variants.reduce((s, v) => s + v.stock, 0)} uds. locales
                      </p>
                    </div>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-slate-300" />
                      : <ChevronDown className="w-4 h-4 text-slate-300" />
                    }
                  </div>

                  {/* Detalle expandido */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      {/* Cabecera de tabla */}
                      <div className="grid grid-cols-[1fr_90px_80px_80px_80px_100px_180px] gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                        <span>Variante / SKU</span>
                        <span>Precio</span>
                        <span className="text-right">Vendido</span>
                        <span className="text-right">Repuesto</span>
                        <span className="text-right">Actual</span>
                        <span className="text-center">Estado</span>
                        <span className="text-center">Reponer</span>
                      </div>

                      {product.variants.map(v => {
                        const isRestockOk = restockSuccess === v.id;
                        const stockColor =
                          v.isDropshippable ? "text-sky-600" :
                          v.stock === 0     ? "text-red-600 font-black" :
                          v.stock <= 3      ? "text-amber-600 font-bold" :
                          "text-emerald-600 font-bold";

                        const variantTags = [
                          v.audience ? AUDIENCE_LABELS[v.audience] : null,
                          v.sleeve   ? SLEEVE_LABELS[v.sleeve]     : null,
                          v.isPlayerVersion ? "Jugador" : "Fan",
                          v.allowsNameNumber ? "Personalizable" : null,
                          v.size || null,
                          v.color || null,
                        ].filter(Boolean);

                        return (
                          <div
                            key={v.id}
                            className="grid grid-cols-[1fr_90px_80px_80px_80px_100px_180px] gap-2 px-4 py-3 border-b border-slate-100 last:border-0 items-center"
                          >
                            {/* Variante info */}
                            <div>
                              <div className="flex flex-wrap gap-1 mb-0.5">
                                {variantTags.map(tag => (
                                  <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono">{v.sku}</p>
                            </div>

                            {/* Precio */}
                            <span className="text-sm text-slate-600 tabular-nums">
                              ${(v.priceCents / 100).toFixed(0)}
                            </span>

                            {/* Datos numéricos */}
                            <span className="text-right text-sm text-slate-500 tabular-nums">{v.sold}</span>
                            <span className="text-right text-sm text-slate-500 tabular-nums">{v.totalRestocked}</span>
                            <span className={`text-right text-sm tabular-nums ${stockColor}`}>
                              {v.stock}
                            </span>

                            {/* Badge */}
                            <div className="flex justify-center">{stockBadge(v)}</div>

                            {/* Reponer */}
                            <div className="flex items-center gap-1.5">
                              {isRestockOk ? (
                                <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                  <CheckCircle className="w-4 h-4" /> Repuesto
                                </div>
                              ) : (
                                <>
                                  <input
                                    type="number"
                                    min={1}
                                    max={999}
                                    placeholder="Cant."
                                    value={restockQty[v.id] ?? ""}
                                    onChange={e => setRestockQty(prev => ({ ...prev, [v.id]: e.target.value }))}
                                    className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-center focus:border-indigo-400 outline-none"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Nota..."
                                    value={restockNotes[v.id] ?? ""}
                                    onChange={e => setRestockNotes(prev => ({ ...prev, [v.id]: e.target.value }))}
                                    className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:border-indigo-400 outline-none"
                                  />
                                  <button
                                    onClick={() => handleRestock(v.id)}
                                    disabled={restocking === v.id || !restockQty[v.id]}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white p-1.5 rounded-lg transition-colors disabled:opacity-40"
                                  >
                                    {restocking === v.id
                                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      : <Plus className="w-3.5 h-3.5" />
                                    }
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Botón nueva variante */}
                      <div className="px-4 py-3 border-t border-slate-100">
                        <button
                          onClick={e => { e.stopPropagation(); setNewVariantProduct(product); }}
                          className="flex items-center gap-2 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Nueva variante
                        </button>
                      </div>

                      {/* Historial de reposiciones recientes */}
                      {product.variants.some(v => v.recentMovements.length > 0) && (
                        <div className="px-4 py-3 border-t border-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Historial de reposición</p>
                          <div className="space-y-1">
                            {product.variants
                              .flatMap(v => v.recentMovements.map(m => ({
                                ...m,
                                variantLabel: [
                                  v.size,
                                  v.color,
                                  v.audience ? AUDIENCE_LABELS[v.audience] : null,
                                  v.sleeve   ? SLEEVE_LABELS[v.sleeve]     : null,
                                ].filter(Boolean).join(" · ") || v.sku,
                              })))
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .slice(0, 5)
                              .map(m => (
                                <div key={m.id} className="flex items-center gap-3 text-xs text-slate-500">
                                  <span className="text-emerald-600 font-bold">+{m.quantity}</span>
                                  <span className="font-medium text-slate-600">{m.variantLabel}</span>
                                  {m.notes && <span className="text-slate-400 italic">{m.notes}</span>}
                                  <span className="ml-auto text-slate-400">
                                    {new Date(m.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
