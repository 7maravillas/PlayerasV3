"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Share2, Star, Truck, ShieldCheck, Ruler, ZoomIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import ScrollingReviews from "@/components/store/ScrollingReviews";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface Props {
  productId: string;
  initialProduct: any; // Pre-fetched desde el Server Component
}

export default function ProductDetailClient({ productId, initialProduct }: Props) {
  const [product, setProduct] = useState<any>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [selectedSize, setSelectedSize] = useState("");

  const [isCustomized, setIsCustomized] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const zoomRef = useRef<HTMLDivElement>(null);

  // ======= LÓGICA REACTIVA DE VARIANTES =======
  const ALL_SIZES = ['S', 'M', 'L', 'XL', '2XL'];
  const variants = product?.variants || [];
  const SIZES = ALL_SIZES;

  const selectedVariant = variants.find((v: any) => v.size === selectedSize) || null;

  useEffect(() => {
    if (product && !selectedSize && SIZES.length > 0) {
      setSelectedSize(SIZES[0]);
    }
  }, [product, selectedSize, SIZES]);

  const localStock = selectedVariant?.stock ?? 0;
  const isDropshippable = selectedVariant?.isDropshippable ?? true;
  const customizationPrice = selectedVariant?.customizationPrice ? selectedVariant.customizationPrice / 100 : 199;

  const globalAllowsCustomization = variants.length > 0
    ? variants.some((v: any) => v.allowsNameNumber)
    : true;
  const canCustomize = globalAllowsCustomization;

  useEffect(() => {
    if (!canCustomize) {
      setIsCustomized(false);
      setCustomName("");
      setCustomNumber("");
    }
  }, [selectedSize, canCustomize]);

  const basePrice = selectedVariant?.priceCents ? selectedVariant.priceCents / 100 : product?.price || 0;
  const displayPrice = isCustomized ? basePrice + customizationPrice : basePrice;
  const compareAtPrice = selectedVariant?.compareAtPriceCents ? selectedVariant.compareAtPriceCents / 100 : product?.compareAtPrice || 0;

  // ── Si no había producto inicial, fetch desde el cliente (fallback) ──
  useEffect(() => {
    if (!initialProduct) {
      fetch(`${API_BASE}/api/v1/products/${productId}`)
        .then(res => { if (!res.ok) throw new Error("Producto no encontrado"); return res.json(); })
        .then(data => { setProduct(data); setLoading(false); })
        .catch(err => { console.error(err); setLoading(false); });
    }
  }, [productId, initialProduct]);

  // ── 📊 ANALÍTICAS: Registrar visita al montar (silencioso, no bloquea la UI) ──
  useEffect(() => {
    if (!productId) return;
    fetch(`${API_BASE}/api/v1/analytics/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    }).catch(() => { /* fallo silencioso */ });
  }, [productId]);

  const getDeliveryDates = (type: 'fast' | 'standard' | 'custom') => {
    const today = new Date();
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const addDays = (d: Date, days: number) => { const copy = new Date(d); copy.setDate(copy.getDate() + days); return copy; };
    const formatRange = (start: Date, end: Date) => `${start.getDate()} al ${end.getDate()} de ${months[end.getMonth()]}`;
    if (type === 'fast') return formatRange(addDays(today, 3), addDays(today, 7));
    if (type === 'standard' || type === 'custom') return formatRange(addDays(today, 20), addDays(today, 27));
    return "";
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center text-th-primary transition-colors duration-300">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
          Cargando jersey...
        </div>
      </div>
    );
  }

  if (!product) return <div className="text-th-primary text-center py-20">Producto no encontrado</div>;

  return (
    <div className="min-h-screen bg-theme-bg text-th-primary font-sans transition-colors duration-300">
      <Navbar />

      <div className="pt-24 md:pt-32 pb-20 container mx-auto px-6">

        {/* BREADCRUMBS */}
        <div className="flex items-center gap-4 mb-8 text-sm text-th-secondary">
          <Link href="/" className="hover:text-accent transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <span>/</span>
          <span className="uppercase tracking-widest">{product.category?.name || "Catálogo"}</span>
          <span>/</span>
          <span className="text-th-primary truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

          {/* COLUMNA IZQUIERDA: GALERÍA */}
          <div className="space-y-6">
            {(() => {
              const galleryImages: string[] =
                product.images?.length > 0
                  ? product.images.map((img: any) => img.url || img)
                  : product.imageUrl ? [product.imageUrl] : [];
              const currentImage = galleryImages[selectedImageIndex] || galleryImages[0] || '';
              const hasMultiple = galleryImages.length > 1;

              return (
                <div className="space-y-3">
                  {/* Imagen principal con zoom */}
                  <div
                    ref={zoomRef}
                    className="relative aspect-square bg-theme-card rounded-2xl overflow-hidden border border-th-border/10 cursor-crosshair"
                    onMouseEnter={() => setZoomActive(true)}
                    onMouseLeave={() => setZoomActive(false)}
                    onMouseMove={(e) => {
                      if (!zoomRef.current) return;
                      const rect = zoomRef.current.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setZoomPos({ x, y });
                    }}
                  >
                    {/* Imagen normal */}
                    <Image
                      key={currentImage}
                      src={currentImage}
                      alt={product.name}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain p-8 transition-opacity duration-500 drop-shadow-2xl"
                    />

                    {/* Zoom overlay (2x) */}
                    {zoomActive && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          backgroundImage: `url(${currentImage})`,
                          backgroundSize: '200%',
                          backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                          backgroundRepeat: 'no-repeat',
                          opacity: 1,
                        }}
                      />
                    )}

                    {/* Zoom hint */}
                    {!zoomActive && (
                      <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 opacity-60">
                        <ZoomIn className="w-3 h-3" /> Zoom
                      </div>
                    )}
                  </div>

                  {/* Thumbnails strip */}
                  {hasMultiple && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {galleryImages.map((url: string, i: number) => (
                        <button
                          key={`thumb-${i}`}
                          type="button"
                          onClick={() => setSelectedImageIndex(i)}
                          className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedImageIndex === i
                            ? 'border-accent ring-2 ring-accent/30 scale-105'
                            : 'border-th-border/10 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <Image
                            src={url}
                            alt={`Vista ${i + 1}`}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ENVÍO DUAL UI */}
            <div className="bg-theme-card p-5 rounded-xl border border-th-border/10 space-y-3">
              <h4 className="text-xs font-bold uppercase text-th-secondary flex items-center gap-2">
                <Truck className="w-4 h-4" /> Disponibilidad Logística
              </h4>

              {isCustomized ? (
                <div className="flex items-start gap-3 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                  <span className="text-xl">🧵</span>
                  <div>
                    <p className="text-accent font-bold text-sm tracking-wide">Envío Estándar (Personalizado)</p>
                    <p className="text-th-secondary text-xs mt-1">Llega del {getDeliveryDates('custom')}</p>
                  </div>
                </div>
              ) : localStock > 0 ? (
                <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <span className="text-xl">⚡</span>
                  <div>
                    <p className="text-green-400 font-bold text-sm tracking-wide">Envío Rápido</p>
                    <p className="text-th-secondary text-xs mt-1">Llega del {getDeliveryDates('fast')}</p>
                  </div>
                </div>
              ) : localStock === 0 && isDropshippable ? (
                <div className="flex items-start gap-3 p-3 bg-theme-surface border border-th-border/10 rounded-lg">
                  <span className="text-xl">🚚</span>
                  <div>
                    <p className="text-th-primary font-bold text-sm tracking-wide">Envío Estándar</p>
                    <p className="text-th-secondary text-xs mt-1">Llega del {getDeliveryDates('standard')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <span className="text-xl">❌</span>
                  <div>
                    <p className="text-red-400 font-bold text-sm tracking-wide">Agotado</p>
                    <p className="text-th-secondary text-xs mt-1">Sin disponibilidad por el momento.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mensajes de Confianza */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-theme-card p-4 rounded-xl text-center border border-th-border/10">
                <Truck className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-[10px] font-bold uppercase text-th-secondary">Envío Rápido</p>
              </div>
              <div className="bg-theme-card p-4 rounded-xl text-center border border-th-border/10">
                <ShieldCheck className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-[10px] font-bold uppercase text-th-secondary">Oficial</p>
              </div>
              <div className="bg-theme-card p-4 rounded-xl text-center border border-th-border/10">
                <Share2 className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-[10px] font-bold uppercase text-th-secondary">Compartir</p>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: INFO Y COMPRA */}
          <div className="flex flex-col">

            {/* Etiquetas y Título */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-accent-cta text-accent-cta-text text-xs font-black uppercase px-2 py-1 tracking-wider rounded-sm">
                  Nuevo
                </span>
                <span className="text-accent text-xs font-bold uppercase tracking-widest">
                  {product.brand || "Oficial"}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-heading uppercase leading-none mb-3 text-th-primary">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                {product.compareAtPrice > 0 && (
                  <span className="text-th-secondary line-through decoration-red-500 decoration-2 text-lg">${product.compareAtPrice}</span>
                )}
                <span className="text-accent font-bold text-2xl">${Number(displayPrice).toFixed(2).replace(/\.00$/, '')} MXN</span>
              </div>
            </div>

            <div className="h-px w-full bg-th-border/10 my-4" />

            {/* Descripción */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-th-secondary mb-2">Descripción</h3>
              <p className="text-th-secondary leading-relaxed font-light text-sm">
                {product.description || "El jersey oficial de la temporada. Fabricado con tecnología de alta transpirabilidad para mantenerte fresco dentro y fuera de la cancha."}
              </p>
            </div>

            {/* Selector de Talla */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-th-secondary">Selecciona tu talla</h3>
                <button className="flex items-center gap-1 text-xs text-accent hover:underline">
                  <Ruler className="w-3 h-3" /> Guía de tallas
                </button>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {SIZES.map((size) => {
                  const variantForSize = variants.find((v: any) => v.size === size);
                  const hasLocalStock = (variantForSize?.stock ?? 0) > 0;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-12 border rounded-lg font-bold transition-all relative ${selectedSize === size
                        ? "bg-accent text-accent-cta-text border-accent shadow-lg"
                        : "bg-transparent border-th-border/20 text-th-secondary hover:border-accent/50 hover:text-th-primary"
                      }`}
                    >
                      {size}
                      {hasLocalStock && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full" title="Envío Rápido disponible" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PERSONALIZACIÓN UI */}
            <div className={`mb-6 p-5 border rounded-xl space-y-4 ${canCustomize ? 'border-th-border/20 bg-theme-surface/50' : 'border-th-border/5 bg-theme-surface/20'}`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-th-primary">¿Deseas personalizar tu Jersey?</h3>
                {!canCustomize && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-1 rounded">No Disponible</span>
                )}
              </div>

              {canCustomize && (
                <p className="text-xs text-th-secondary">Al personalizar, el envío cambia a Estándar (se manda a hacer con tu nombre y número).</p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => canCustomize && setIsCustomized(false)}
                  disabled={!canCustomize}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all border ${!canCustomize
                    ? 'bg-transparent border-th-border/10 text-th-secondary/50 cursor-not-allowed'
                    : !isCustomized
                      ? 'bg-accent/10 border-accent text-accent'
                      : 'bg-transparent border-th-border/20 text-th-secondary hover:border-th-border/50'
                  }`}
                >
                  Sin Personalizar
                </button>
                <button
                  onClick={() => canCustomize && setIsCustomized(true)}
                  disabled={!canCustomize}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all border ${!canCustomize
                    ? 'bg-transparent border-th-border/10 text-th-secondary/50 cursor-not-allowed'
                    : isCustomized
                      ? 'bg-accent/10 border-accent text-accent'
                      : 'bg-transparent border-th-border/20 text-th-secondary hover:border-th-border/50'
                  }`}
                >
                  Personalizar (+${customizationPrice} MXN)
                </button>
              </div>

              {isCustomized && canCustomize && (
                <div className="pt-4 grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-th-secondary mb-1">Nombre en el Jersey (Máx 15)</label>
                    <input
                      type="text"
                      maxLength={15}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value.toUpperCase().replace(/[^A-Z ]/g, ''))}
                      className="w-full bg-theme-bg border border-th-border/20 rounded-lg px-4 py-3 text-th-primary uppercase focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-th-secondary/50 font-bold"
                      placeholder="MESSI"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-th-secondary mb-1">Número (Máx 3 dígitos)</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={customNumber}
                      onChange={(e) => setCustomNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-theme-bg border border-th-border/20 rounded-lg px-4 py-3 text-th-primary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-th-secondary/50 font-bold text-center"
                      placeholder="10"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Botón de Compra */}
            <button
              onClick={() => {
                if (!selectedSize) { alert("Por favor, selecciona una talla antes de agregar al carrito."); return; }
                if (isCustomized && (!customName.trim() || !customNumber.trim())) { alert("Por favor, ingresa el Nombre y Número para tu jersey personalizado."); return; }
                const { useCartStore } = require('@/app/store/cartStore');
                useCartStore.getState().addItem({
                  id: `${product.id}-${selectedSize}${isCustomized ? `-${customName}-${customNumber}` : ''}`,
                  variantId: selectedVariant?.id || product.id,
                  productId: product.id, name: product.name, slug: product.slug, price: basePrice,
                  imageUrl: product.imageUrl || product.images?.[0]?.url || "", size: selectedSize,
                  isCustomized, customName: isCustomized ? customName : undefined,
                  customNumber: isCustomized ? customNumber : undefined, customizationPrice: isCustomized ? customizationPrice : 0
                });
              }}
              className="w-full bg-accent-cta hover:opacity-90 text-accent-cta-text font-black uppercase text-lg py-5 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              disabled={localStock === 0 && !isDropshippable}
            >
              {(localStock === 0 && !isDropshippable) ? "Agotado" : `Agregar al Carrito — $${Number(displayPrice).toFixed(2).replace(/\.00$/, '')} MXN`}
            </button>

            <p className="text-center text-xs text-th-secondary mt-4 tracking-wide font-bold">
              🔥 Envío gratis en compras mayores a $999 MXN 🔥
            </p>

          </div>
        </div>
      </div>

      {/* RESEÑAS — Animata Scrolling Testimonials (global trust) */}
      <ScrollingReviews />

    </div>
  );
}
