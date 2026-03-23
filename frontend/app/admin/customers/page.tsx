"use client";
import { useState, useEffect, useRef } from "react";
import { Users, ChevronLeft, ChevronRight, Search, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface Customer {
    id: string;
    email: string;
    name: string | null;
    role: string;
    emailVerifiedAt: string | null;
    createdAt: string;
    _count: { orders: number };
}

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchCustomers = async (pageNum: number, q: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(pageNum), limit: "20" });
            if (q) params.append("search", q);
            const data = await api.get(`/api/v1/admin/customers?${params}`, { auth: true });
            setCustomers(data.items || []);
            setTotal(data.pagination?.total || 0);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch {
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCustomers(page, search); }, [page, search]);

    const handleSearchChange = (val: string) => {
        setSearchInput(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(val);
            setPage(1);
        }, 350);
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
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

            {/* Buscador */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    id="customer-search"
                    name="customer-search"
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchInput}
                    onChange={e => handleSearchChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-violet-400 outline-none transition-colors"
                />
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
                        {search ? "No se encontraron clientes." : "Aún no hay clientes registrados."}
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 text-left">
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Verificado</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Órdenes</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Registro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {customers.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-800">
                                        {c.name || <span className="text-slate-400 italic">Sin nombre</span>}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">{c.email}</td>
                                    <td className="px-4 py-3 text-center">
                                        {c.emailVerifiedAt
                                            ? <CheckCircle className="w-4 h-4 text-emerald-500 inline" />
                                            : <XCircle className="w-4 h-4 text-slate-300 inline" />}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-violet-50 text-violet-600 text-xs font-bold">
                                            {c._count.orders}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(c.createdAt)}</td>
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
        </div>
    );
}
