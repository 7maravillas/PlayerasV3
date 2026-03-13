"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { api, setAdminToken } from "@/lib/api";

export default function AdminLoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = await api.post("/api/v1/admin/login", { password });
            setAdminToken(data.token);
            router.replace("/admin");
        } catch (err: any) {
            if (err.status === 401) {
                setError("Contraseña incorrecta.");
            } else {
                setError(err.message || "Error de conexión.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">

                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h1 className="text-2xl font-black italic tracking-tighter text-slate-800">
                        ADMIN<span className="text-indigo-500">RAW</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Ingresa tu contraseña para continuar</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8 space-y-5">

                    {/* Password field */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                            Contraseña
                        </label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                required
                                autoFocus
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-slate-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                            <p className="text-rose-500 text-xs font-semibold">{error}</p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold uppercase py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Verificando...
                            </>
                        ) : (
                            "Ingresar"
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-xs text-slate-300 mt-6">
                    JerseysRAW — Panel de Administración
                </p>
            </div>
        </div>
    );
}
