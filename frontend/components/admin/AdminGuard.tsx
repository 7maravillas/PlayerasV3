"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminToken } from "@/lib/api";

interface AdminGuardProps {
    children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const token = getAdminToken();
        if (!token) {
            router.replace("/admin/login");
        } else {
            setAuthorized(true);
        }
        setChecking(false);
    }, [router]);

    // Mientras verifica, mostrar un skeleton sutil
    if (checking) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm font-medium">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    if (!authorized) return null;

    return <>{children}</>;
}
