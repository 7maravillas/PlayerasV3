"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Image as ImageIcon, ChevronLeft, ChevronRight, Loader2, Package } from "lucide-react";
import { api, apiFetch } from "@/lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchProducts = (pageNumber: number) => {
    setLoading(true);
    api.get(`/api/v1/products?page=${pageNumber}`)
      .then((data) => {
        setProducts(Array.isArray(data.items) ? data.items : []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto para siempre?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/v1/products/${id}`, { auth: true });
      fetchProducts(page);
    } catch {
      alert("Error al eliminar.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => { fetchProducts(page); }, [page]);

  return (
    <div className="space-y-6 max-w-6xl">

      {/* CABECERA */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Catálogo</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">Productos</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {totalItems} productos en total · Página {page} de {totalPages || 1}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors shadow-sm shadow-indigo-100"
        >
          <Plus className="w-4 h-4" /> Nuevo Producto
        </Link>
      </div>

      {/* TABLA */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="p-4 font-bold">Imagen</th>
                <th className="p-4 font-bold">Producto</th>
                <th className="p-4 font-bold">Categoría / Marca</th>
                <th className="p-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-10 w-10 bg-slate-100 rounded-lg" /></td>
                    <td className="p-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="p-4" />
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <Package className="w-7 h-7 text-slate-300" />
                      </div>
                      <p className="font-semibold text-slate-500">No hay productos aún</p>
                      <p className="text-xs">Agrega tu primer jersey al catálogo</p>
                    </div>
                  </td>
                </tr>
              ) : products.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{p.name}</p>
                    {p.price > 0 && (
                      <span className="text-xs text-indigo-500 font-semibold">${p.price} MXN</span>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="text-slate-600">{p.category?.name || "General"}</p>
                    <span className="text-xs text-slate-400">{p.brand}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="p-2 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors text-slate-400"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="p-2 border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 transition-colors text-slate-400 disabled:opacity-50"
                        title="Eliminar"
                      >
                        {deletingId === p.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 rounded-b-2xl flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Mostrando hasta 10 resultados por página
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              Pág {page} / {totalPages || 1}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => page < totalPages ? p + 1 : p)}
                disabled={page >= totalPages || loading}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}