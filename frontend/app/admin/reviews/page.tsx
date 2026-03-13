"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Star, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formProductId, setFormProductId] = useState("");
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formDate, setFormDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Cargar reseñas y productos
  useEffect(() => {
    Promise.all([
      api.get("/api/v1/admin/reviews", { auth: true }),
      api.get("/api/v1/products?limit=200"),
    ])
      .then(([reviewsData, productsData]) => {
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        // El endpoint devuelve { items: [...], pagination: {...} }
        const pList = productsData?.items ?? productsData?.products ?? productsData;
        setProducts(Array.isArray(pList) ? pList : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductId || !formName) return;
    setSubmitting(true);

    try {
      const newReview = await api.post(
        `/api/v1/products/${formProductId}/reviews`,
        {
          name: formName,
          image: formImage || undefined,
          rating: formRating,
          comment: formComment,
          ...(formDate ? { createdAt: formDate } : {}),
        },
        { auth: true }
      );

      // Agregar al listado local con info del producto
      const product = products.find((p: any) => p.id === formProductId);
      setReviews((prev) => [
        { ...newReview, product: product ? { id: product.id, name: product.name } : null },
        ...prev,
      ]);

      // Reset
      setFormName("");
      setFormComment("");
      setFormImage("");
      setFormRating(5);
      setFormDate("");
      setShowForm(false);
    } catch (err: any) {
      alert(err.message || "Error al crear reseña");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta reseña?")) return;
    try {
      await api.delete(`/api/v1/reviews/${id}`, { auth: true });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "Error al eliminar");
    }
  };

  if (loading) return <div className="p-10 text-slate-500 text-center">Cargando reseñas...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-0.5">Admin</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Reseñas</h1>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-500 text-white text-xs font-bold uppercase px-5 py-3 rounded-xl hover:bg-indigo-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Crear Reseña
        </button>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4"
        >
          <h3 className="text-sm font-bold uppercase text-slate-500">Nueva Reseña</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Producto</label>
              <select
                required
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-indigo-400 outline-none"
              >
                <option value="">— Seleccionar —</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nombre del Cliente</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="María García"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-indigo-400 outline-none"
              />
            </div>
          </div>

          {/* Rating selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase text-slate-400">Calificación:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-125"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= (hoverRating || formRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Foto del Cliente (URL, opcional)</label>
            <input
              type="url"
              value={formImage}
              onChange={(e) => setFormImage(e.target.value)}
              placeholder="https://res.cloudinary.com/.../foto.jpg"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-indigo-400 outline-none"
            />
            {formImage && (
              <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Comentario</label>
            <textarea
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
              rows={3}
              placeholder="Excelente calidad, el jersey llegó perfecto..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-indigo-400 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Fecha (opcional, para antedatar)</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-indigo-400 outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-500 text-white font-bold uppercase text-sm px-6 py-3 rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {submitting ? "Creando..." : "Crear Reseña"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 font-bold text-sm px-4 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de reseñas */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {reviews.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold">Sin reseñas</p>
            <p className="text-xs mt-1">Crea reseñas manualmente para tus productos</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {reviews.map((review: any) => (
              <div key={review.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold text-sm flex-shrink-0">
                    {review.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-800 text-sm">{review.name}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs truncate max-w-md">{review.comment || "Sin comentario"}</p>
                    <p className="text-slate-300 text-[10px] mt-0.5">
                      {review.product?.name || "Producto desconocido"} •{" "}
                      {new Date(review.createdAt).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(review.id)}
                  className="text-rose-300 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
