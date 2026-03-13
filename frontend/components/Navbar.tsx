"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, ShoppingCart, User, Search, Menu, X } from "lucide-react";
import { useCartStore } from "@/app/store/cartStore";

// --- MENSAJES DEL CARRUSEL ---
const ANNOUNCEMENTS = [
  "ENVÍOS GRATIS a partir de $999 MXN",
  "AUTENTICIDAD GARANTIZADA • CALIDAD PREMIUM",
  "10% DE DESCUENTO EN TU PRIMERA COMPRA",
  "PAGO SEGURO • ENCRIPTACIÓN SSL",
];

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart
  const { openCart, getTotalItems } = useCartStore();

  useEffect(() => { setMounted(true); }, []);

  // Carousel timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);
      const scrolledToBottom = window.innerHeight + currentScrollY >= document.body.offsetHeight - 100;
      if (currentScrollY > lastScrollY && scrolledToBottom) {
        setIsHidden(true);
      } else if (currentScrollY < lastScrollY) {
        setIsHidden(false);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);



  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const solid = !isHomePage || isScrolled;

  return (
    <header
      className={`fixed top-0 w-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${isHidden
          ? "-translate-y-full"
          : solid
            ? "-translate-y-[34px] md:-translate-y-[38px]"
            : "translate-y-0"
        }`}
    >
      {/* 1. BARRA DE ANUNCIOS */}
      <div className={`text-[10px] md:text-xs font-bold py-2.5 px-4 tracking-widest border-b relative z-50 h-[34px] md:h-[38px] transition-all duration-500 ${solid
        ? 'bg-th-announce text-th-primary border-th-border/20'
        : 'bg-transparent text-white border-white/10'
        }`}>
        <div className="container mx-auto flex justify-center md:justify-between items-center h-full">
          <div className="flex-1 text-center transition-all duration-500 ease-in-out pl-8 md:pl-19">
            <span key={currentIndex} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {ANNOUNCEMENTS[currentIndex]}
            </span>
          </div>
          <div className="hidden md:flex gap-6 text-[10px] absolute right-6 opacity-70">
            <span className="cursor-pointer hover:opacity-100 transition-opacity">AYUDA</span>
            <span className="cursor-pointer hover:opacity-100 transition-opacity">RASTREA TU ORDEN</span>
          </div>
        </div>
      </div>

      {/* 2. NAVBAR PRINCIPAL */}
      <div className={`w-full backdrop-blur-md border-b h-16 md:h-20 transition-all duration-500 ${solid
        ? 'bg-th-navbar/95 border-th-border/10 shadow-lg'
        : 'bg-transparent border-transparent shadow-none'
        }`}>
        <div className="container mx-auto px-6 h-full flex items-center justify-between">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-1 group">
            <span className={`text-2xl font-black italic tracking-tighter transition-colors duration-500 group-hover:opacity-80 ${solid ? 'text-th-primary' : 'text-white'
              }`}>JERSEYS</span>
            <span className="text-2xl font-black italic tracking-tighter text-accent">RAW</span>
          </Link>

          {/* MENÚ */}
          <nav className="hidden md:flex items-center gap-8">
            {['Hombres', 'Mujeres', 'Niños'].map((label) => (
              <Link
                key={label}
                href={`/categoria/${label.toLowerCase().replace('ñ', 'n')}`}
                className={`text-sm font-bold uppercase tracking-widest hover:text-accent transition-colors duration-300 ${solid ? 'text-th-primary' : 'text-white'
                  }`}
              >{label}</Link>
            ))}
            <Link
              href="/categoria/outlet"
              className={`text-sm font-bold uppercase tracking-widest transition-colors duration-300 ${solid ? 'text-th-sale hover:opacity-80' : 'text-white hover:text-accent'
                }`}
            >Outlet</Link>
          </nav>

          {/* ÍCONOS + SEARCH */}
          <div className={`flex items-center gap-3 transition-colors duration-500 ${solid ? 'text-th-primary' : 'text-white'
            }`}>
            {/* Search — siempre visible, con relleno gris */}
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-secondary/60 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                placeholder="Buscar"
                className={`w-40 lg:w-48 text-sm py-2 pl-9 pr-3 rounded-full outline-none transition-colors ${
                  solid
                    ? "bg-theme-surface text-th-primary placeholder:text-th-secondary/50"
                    : "bg-white/10 text-white placeholder:text-white/50"
                }`}
              />
            </div>

            <button className="hover:text-accent transition-colors"><User className="w-5 h-5" /></button>

            {/* CARRITO */}
            <button onClick={openCart} className="relative hover:text-accent transition-colors">
              {mounted && getTotalItems() > 0
                ? <ShoppingCart className="w-5 h-5" />
                : <ShoppingBag className="w-5 h-5" />
              }
              <span
                suppressHydrationWarning
                className={`absolute -top-2 -right-2 bg-accent-cta text-accent-cta-text text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full transition-opacity duration-200 ${mounted && getTotalItems() > 0 ? 'opacity-100' : 'opacity-0'
                  }`}
              >
                {mounted ? getTotalItems() : 0}
              </span>
            </button>

            <button className="md:hidden"><Menu className="w-6 h-6" /></button>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;