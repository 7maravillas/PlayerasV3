"use client";
import { useState, useEffect } from "react";
import { Plus, Trophy, Edit2, Trash2, X, Save, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminLeaguesPage() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [formState, setFormState] = useState({ name: "", slug: "", country: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // 1. CARGAR LIGAS
  const fetchLeagues = () => {
    setFetchError(false);
    api.get('/api/v1/leagues')
      .then(data => { if (Array.isArray(data)) setLeagues(data); })
      .catch(() => setFetchError(true));
  };
  useEffect(() => { fetchLeagues(); }, []);

  // 2. GUARDAR
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.slug) return;
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/api/v1/leagues/${editingId}`, formState, { auth: true });
      } else {
        await api.post('/api/v1/leagues', formState, { auth: true });
      }
      resetForm(); fetchLeagues();
    } catch { alert("Error al guardar (¿slug duplicado?)"); }
    finally { setLoading(false); }
  };

  // 3. ELIMINAR
  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro? No podrás borrarla si ya tiene equipos asignados.")) return;
    try {
      await api.delete(`/api/v1/leagues/${id}`, { auth: true });
      fetchLeagues(); if (editingId === id) resetForm();
    } catch { alert("Error al eliminar"); }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setFormState({ name: item.name, slug: item.slug, country: item.country || "" });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const resetForm = () => { setEditingId(null); setFormState({ name: "", slug: "", country: "" }); };
  const handleNameChange = (e: any) => {
    const val = e.target.value;
    setFormState(prev => ({ ...prev, name: val, slug: !editingId ? val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : prev.slug }));
  };
  const regenerateSlug = () => setFormState(prev => ({ ...prev, slug: prev.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') }));

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">

      {/* CABECERA */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Configuración</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          {editingId ? "Editar Liga" : "Ligas / Competiciones"}
        </h1>
        <p className="text-slate-400 text-sm mt-1">Define las categorías: Liga MX, Premier League, Champions...</p>
      </div>

      {/* ERROR DE CONEXIÓN */}
      {fetchError && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600">
          <WifiOff className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">Sin conexión al servidor</p>
            <p className="text-xs text-rose-400">Asegúrate de que el backend esté corriendo en el puerto 4000.</p>
          </div>
          <button onClick={fetchLeagues} className="ml-auto text-xs font-bold underline">Reintentar</button>
        </div>
      )}

      {/* FORMULARIO */}
      <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-colors ${editingId ? "border-indigo-200" : "border-slate-100"}`}>
        <div className="flex justify-between items-center mb-5">
          <h3 className={`font-bold text-sm uppercase tracking-wide ${editingId ? "text-indigo-500" : "text-slate-600"}`}>
            {editingId ? "✏️ Editando Liga" : "Crear Nueva Liga"}
          </h3>
          {editingId && (
            <button onClick={resetForm} className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" /> Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nombre</label>
              <input
                type="text" required value={formState.name}
                onChange={handleNameChange} placeholder="Ej: Liga MX"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:border-indigo-400 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Slug URL</label>
              <input
                type="text" required value={formState.slug}
                onChange={e => setFormState({ ...formState, slug: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-500 font-mono text-sm focus:border-indigo-400 outline-none pr-8 transition-all"
              />
              {editingId && (
                <button type="button" onClick={regenerateSlug} className="absolute right-2 top-[26px] text-slate-300 hover:text-indigo-500">
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">País / Región</label>
              <input
                type="text" value={formState.country}
                onChange={e => setFormState({ ...formState, country: e.target.value })}
                placeholder="Ej: México"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:border-indigo-400 outline-none transition-all"
              />
            </div>
          </div>
          <button
            type="submit" disabled={loading}
            className={`font-bold py-2.5 px-4 rounded-xl transition-colors w-full flex justify-center items-center gap-2 shadow-sm disabled:opacity-50 ${editingId
              ? "bg-amber-400 hover:bg-amber-500 text-white"
              : "bg-indigo-500 hover:bg-indigo-600 text-white"
              }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {loading ? "Guardando..." : editingId ? "Guardar Cambios" : "Crear Liga"}
          </button>
        </form>
      </div>

      {/* LISTA */}
      <div className="space-y-2">
        {leagues.length === 0 && !fetchError && (
          <p className="text-center text-slate-400 text-sm py-8 bg-white border border-slate-100 rounded-2xl">
            No hay ligas registradas. ¡Crea la primera! 🏆
          </p>
        )}
        {leagues.map(league => (
          <div key={league.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{league.name}</h4>
                <p className="text-[10px] text-slate-400 font-mono">/leagues/{league.slug} · {league.country || "Internacional"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => startEdit(league)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(league.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}