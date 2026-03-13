"use client";
import { useState, useEffect } from "react";
import { Plus, Shield, Edit2, Trash2, X, Save, Loader2, RefreshCw, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [formState, setFormState] = useState({ name: "", slug: "", leagueId: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    api.get('/api/v1/clubs')
      .then(data => { if (Array.isArray(data)) setClubs(data); })
      .catch(console.error);
    api.get('/api/v1/leagues')
      .then(data => { if (Array.isArray(data)) setLeagues(data); })
      .catch(console.error);
  };
  useEffect(() => { fetchData(); }, []);

  const filteredClubs = clubs.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredClubs.length / ITEMS_PER_PAGE);
  const displayedClubs = filteredClubs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.slug) return;
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/api/v1/clubs/${editingId}`, formState, { auth: true });
      } else {
        await api.post('/api/v1/clubs', formState, { auth: true });
      }
      resetForm(); fetchData();
    } catch (e: any) { alert(e.message || "Error al guardar"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro? Si borras el equipo, los productos asignados se quedarán sin equipo.")) return;
    try {
      await api.delete(`/api/v1/clubs/${id}`, { auth: true });
      fetchData(); if (editingId === id) resetForm();
    } catch { alert("No se puede eliminar (quizá tiene productos asociados)."); }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setFormState({ name: item.name, slug: item.slug, leagueId: item.leagueId || "" });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const resetForm = () => { setEditingId(null); setFormState({ name: "", slug: "", leagueId: "" }); };
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
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-500" />
          </div>
          {editingId ? "Editar Equipo" : "Equipos / Clubes"}
        </h1>
        <p className="text-slate-400 text-sm mt-1">Gestiona los equipos y sus ligas.</p>
      </div>

      {/* FORMULARIO */}
      <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-colors ${editingId ? "border-indigo-200" : "border-slate-100"}`}>
        <div className="flex justify-between items-center mb-5">
          <h3 className={`font-bold text-sm uppercase tracking-wide ${editingId ? "text-indigo-500" : "text-slate-600"}`}>
            {editingId ? "✏️ Editando Equipo" : "Crear Nuevo Equipo"}
          </h3>
          {editingId && (
            <button onClick={resetForm} className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" /> Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nombre</label>
              <input
                type="text" required value={formState.name}
                onChange={handleNameChange} placeholder="Ej: Real Madrid"
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
                  <button type="button" onClick={regenerateSlug} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SELECTOR DE LIGA */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Liga / Categoría</label>
            <select
              value={formState.leagueId}
              onChange={e => setFormState({ ...formState, leagueId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:border-indigo-400 outline-none transition-all"
            >
              <option value="">-- Selecciona una liga --</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>{league.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Esto agrupa al equipo en las pestañas del selector de productos.</p>
          </div>

          <button
            type="submit" disabled={loading}
            className={`font-bold py-2.5 px-4 rounded-xl transition-colors w-full flex justify-center items-center gap-2 shadow-sm disabled:opacity-50 ${editingId
              ? "bg-amber-400 hover:bg-amber-500 text-white"
              : "bg-indigo-500 hover:bg-indigo-600 text-white"
              }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {loading ? "Guardando..." : editingId ? "Guardar Cambios" : "Crear Equipo"}
          </button>
        </form>
      </div>

      {/* LISTA */}
      <div className="space-y-2">
        {clubs.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8 bg-white border border-slate-100 rounded-2xl">
            No hay equipos registrados. ¡Crea el primero! 🛡️
          </p>
        )}
        {displayedClubs.map(club => (
          <div key={club.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{club.name}</h4>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-lg text-slate-400 font-mono">/teams/{club.slug}</span>
                  {club.league && (
                    <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg font-bold uppercase flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> {club.league.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => startEdit(club)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(club.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
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
          <span className="text-sm text-slate-400 font-mono">{currentPage} / {totalPages}</span>
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