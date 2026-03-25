"use client";

import { useState, useEffect, useRef } from "react";
import {
  Package, ChevronDown, ChevronUp, Plus, Loader2,
  FileDown, AlertTriangle, CheckCircle, Search, Filter,
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
  isDropshippable: boolean;
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
        {/* Búsqueda */}
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

        {/* Stock filter */}
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
                    <div className="grid grid-cols-[1fr_80px_80px_80px_80px_100px_180px] gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <span>Variante / SKU</span>
                      <span className="text-right">Inicial</span>
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

                      return (
                        <div
                          key={v.id}
                          className="grid grid-cols-[1fr_80px_80px_80px_80px_100px_180px] gap-2 px-4 py-3 border-b border-slate-100 last:border-0 items-center"
                        >
                          {/* Variante info */}
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              {[v.size, v.color].filter(Boolean).join(" · ") || "Sin talla/color"}
                              {v.audience && v.audience !== "UNISEX" && (
                                <span className="ml-1 text-[10px] text-slate-400 font-normal">{v.audience}</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">{v.sku}</p>
                          </div>

                          {/* Datos numéricos */}
                          <span className="text-right text-sm text-slate-500 tabular-nums">{v.initialStock}</span>
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

                    {/* Historial de reposiciones recientes */}
                    {product.variants.some(v => v.recentMovements.length > 0) && (
                      <div className="px-4 py-3 border-t border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Historial de reposición</p>
                        <div className="space-y-1">
                          {product.variants
                            .flatMap(v => v.recentMovements.map(m => ({ ...m, variantLabel: [v.size, v.color].filter(Boolean).join(" · ") || v.sku })))
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
  );
}
