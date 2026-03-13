"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { ProductCard } from "@/components/store/ProductCard";
import { useWishlistStore } from "@/app/store/wishlistStore";
import { Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function WishlistPage() {
    const { items, clearWishlist } = useWishlistStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-theme-bg text-th-primary font-sans pb-20 transition-colors duration-300">
            <Navbar />

            <div className="pt-24 md:pt-32 container mx-auto px-6 max-w-7xl">

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div>
                        <div className="flex items-center gap-4 mb-4 text-sm text-th-secondary">
                            <Link href="/" className="hover:text-accent transition-colors flex items-center gap-1">
                                <ArrowLeft className="w-4 h-4" /> Volver
                            </Link>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-heading uppercase tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300 flex items-center gap-4">
                            Favoritos 
                        </h1>
                        <p className="text-th-secondary">
                            {items.length} {items.length === 1 ? 'artículo' : 'artículos'} guardados
                        </p>
                    </div>

                    {items.length > 0 && (
                        <button
                            onClick={clearWishlist}
                            className="text-sm font-bold uppercase tracking-widest text-th-secondary hover:text-red-500 transition-colors"
                        >
                            Vaciar Lista
                        </button>
                    )}
                </div>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-th-secondary bg-theme-card rounded-2xl border border-th-border/10">
                        <Heart className="w-16 h-16 opacity-20 mb-4" />
                        <p className="font-medium text-lg mb-2 text-th-primary">Tu lista de favoritos está vacía.</p>
                        <p className="text-sm mb-8 text-center max-w-md">Ve al catálogo y comienza a guardar los jerseys que más te gusten haciendo clic en el corazón.</p>
                        <Link href="/catalog" className="bg-accent-cta text-accent-cta-text font-black uppercase text-sm px-8 py-3 rounded-full hover:opacity-90 transition-all">
                            Explorar Catálogo
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-1000">
                        {items.map((item) => (
                            <ProductCard key={item.id} product={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
