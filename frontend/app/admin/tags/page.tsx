"use client";
import { useState, useEffect } from "react";
import { Plus, Tag, Edit2, Trash2, X, Save, Loader2, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminTagsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const [formState, setFormState] = useState({ name: "", slug: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTags = () => {
    api.get('/api/v1/tags')
      .then(data => { if (Array.isArray(data)) setTags(data); })
      .catch(err => console.error("Error cargando tags:", err));
  };
  useEffect(() => { fetchTags(); }, []);

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredTags.length / ITEMS_PER_PAGE);
  const paginatedTags = filteredTags.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.slug) return;
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/api/v1/tags/${editingId}`, formState, { auth: true });
      } else {
        await api.post('/api/v1/tags', formState, { auth: true });
      }
      resetForm(); fetchTags();
    } catch (e: any) { alert(e.message || "Error al guardar"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro? Se quitará de todos los productos.")) return;
    try {
      await api.delete(`/api/v1/tags/${id}`, { auth: true });
      fetchTags(); if (editingId === id) resetForm();
    } catch { alert("Error al eliminar."); }
  };

  const startEdit = (tag: any) => {
    setEditingId(tag.id);
    setFormState({ name: tag.name, slug: tag.slug });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const resetForm = () => { setEditingId(null); setFormState({ name: "", slug: "" }); };
  const generateSlug = (text: string) => text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  const handleNameChange = (e: any) => {
    const val = e.target.value;
    setFormState(prev => ({ ...prev, name: val, slug: !editingId ? generateSlug(val) : prev.slug }));
  };
  const regenerateSlug = () => setFormState(prev => ({ ...prev, slug: generateSlug(prev.name) }));

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">

      {/* CABECERA */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Configuración</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <Tag className="w-5 h-5 text-violet-500" />
          </div>
          {editingId ? "Editar Estilo" : "Estilos / Tags"}
        </h1>
        <p className="text-slate-400 text-sm mt-1">{filteredTags.length} etiquetas en total.</p>
      </div>

      {/* FORMULARIO */}
      <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-colors ${editingId ? "border-indigo-200" : "border-slate-100"}`}>
        <div className="flex justify-between items-center mb-5">
          <h3 className={`font-bold text-sm uppercase tracking-wide ${editingId ? "text-indigo-500" : "text-slate-600"}`}>
            {editingId ? "✏️ Editando Etiqueta" : "Crear Nuevo Estilo"}
          </h3>
          {editingId && (
            <button onClick={resetForm} className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" /> Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nombre</label>
            <input
              type="text" required value={formState.name}
              onChange={handleNameChange} placeholder="Ej: Manga Larga"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:border-indigo-400 outline-none transition-all"
            />
          </div>
          <div className="flex-1 w-full relative">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Slug URL</label>
            <div className="relative">
              <input
                type="text" required value={formState.slug}
                onChange={e => setFormState({ ...formState, slug: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-500 font-mono text-sm focus:border-indigo-400 outline-none pr-8 transition-all"
              />
              {editingId && (
                <button type="button" onClick={regenerateSlug} title="Regenerar Slug"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500">
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <button
            type="submit" disabled={loading}
            className={`font-bold py-2.5 px-5 rounded-xl transition-colors w-full sm:w-auto flex justify-center items-center gap-2 shadow-sm disabled:opacity-50 ${editingId
              ? "bg-amber-400 hover:bg-amber-500 text-white"
              : "bg-indigo-500 hover:bg-indigo-600 text-white"
              }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {!loading && (editingId ? "Guardar" : "Crear")}
          </button>
        </form>
      </div>

      {/* BÚSQUEDA */}
      <div className="relative">
        <input
          type="text" placeholder="Buscar etiquetas..."
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-10 text-slate-800 focus:border-indigo-400 outline-none transition-all shadow-sm placeholder:text-slate-400"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
      </div>

      {/* LISTA */}
      <div className="space-y-2">
        {paginatedTags.map(tag => (
          <div
            key={tag.id}
            className={`flex items-center justify-between p-4 border rounded-2xl transition-all ${editingId === tag.id
              ? "border-indigo-200 bg-indigo-50 ring-1 ring-indigo-200"
              : "bg-white border-slate-100 hover:border-indigo-100 hover:shadow-sm"
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                <Tag className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{tag.name}</h4>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-lg text-slate-400 font-mono">
                  /collections/{tag.slug}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => startEdit(tag)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(tag.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredTags.length === 0 && (
          <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl">
            <Tag className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 font-medium text-sm">No se encontraron etiquetas.</p>
          </div>
        )}
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-30 text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-400 font-mono">
            Página <span className="text-slate-700 font-bold">{currentPage}</span> de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-30 text-slate-500 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}