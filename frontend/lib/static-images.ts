/**
 * Registro de Imágenes Estáticas — JerseysRAW
 * ─────────────────────────────────────────────────────────────────
 * Fuente de verdad para imágenes estáticas de la UI.
 * Solo el publicId de Cloudinary — la URL base viene de lib/cloudinary.ts.
 *
 * Estructura de carpetas en Cloudinary (dcwyl56kj):
 *   ├── clubs/        Imágenes de clubes (FootballSlider)
 *   ├── destacados/   Jerseys top ventas (ProductCarousel)
 *   ├── editorial/    Mosaico Clásicos (Street Style, Retro Kits)
 *   ├── hero/         Slides del carrusel Hero
 *   ├── promos/       Banners de promociones
 *   └── trendings/    Jerseys en tendencia
 *
 * NOTA: Imágenes de PRODUCTOS no viven aquí → vienen de la BD (admin panel).
 */

// ─── Hero ────────────────────────────────────────────────────────────
export const HERO_IMAGES = [
    { publicId: "jerseys-raw/hero/slide-1", alt: "Jerseys Raw — Colección" },
    { publicId: "jerseys-raw/hero/slide-2", alt: "Jerseys Raw — Retro" },
    { publicId: "jerseys-raw/hero/slide-3", alt: "Jerseys Raw — Clásicos" },
    { publicId: "jerseys-raw/hero/slide-4", alt: "Club América — Banner" },
] as const;

// ─── FootballSlider (Clubes) ──────────────────────────────────────────
export const CLUB_IMAGES = {
    realMadrid: { publicId: "jerseys-raw/clubs/real-madrid", alt: "Real Madrid" },
    barcelona: { publicId: "jerseys-raw/clubs/barcelona", alt: "FC Barcelona" },
    manchesterCity: { publicId: "jerseys-raw/clubs/manchester-city", alt: "Manchester City" },
    seleccionMex: { publicId: "jerseys-raw/clubs/seleccion-mex", alt: "Selección Mexicana" },
    brasil: { publicId: "jerseys-raw/clubs/brasil", alt: "Selección Brasileña" },
    chivas: { publicId: "jerseys-raw/clubs/chivas", alt: "Chivas" },
} as const;

// ─── Editorial (Mosaico Clásicos en Home) ────────────────────────────
export const EDITORIAL_IMAGES = {
    streetStyle: { publicId: "jerseys-raw/editorial/street-style", alt: "Street Style" },
    retroKits: { publicId: "jerseys-raw/editorial/retro-kits", alt: "Retro Kits" },
} as const;

// ─── Destacados (ProductCarousel — top ventas) ───────────────────────
// Las imágenes viven en la carpeta /destacados/ de Cloudinary
export const DESTACADOS_IMAGES = {
    realMadridLocal: { publicId: "jerseys-raw/destacados/real-madrid-local-25-26", alt: "Real Madrid Local 2025-26" },
    barcelonaLocal: { publicId: "jerseys-raw/destacados/barcelona-local-25-26", alt: "Barcelona Local 2025-26" },
    manchester2008: { publicId: "jerseys-raw/destacados/ronaldo-man-utd-2007-08", alt: "Ronaldo 2007-08 Man Utd" },
    milan2007: { publicId: "jerseys-raw/destacados/milan-2007-08", alt: "Milan 2007-08" },
    america1998: { publicId: "jerseys-raw/destacados/america-1998-99", alt: "América 1998-99" },
    mexico1998: { publicId: "jerseys-raw/destacados/mexico-1998", alt: "México 1998" },
    japon1998: { publicId: "jerseys-raw/destacados/japon-1998", alt: "Japón 1998" },
} as const;

// ─── Trendings ────────────────────────────────────────────────────────
// (Para uso futuro — carpeta trendings/ en Cloudinary)
export const TRENDING_IMAGES: { publicId: string; alt: string }[] = [];

// ─── Promos ───────────────────────────────────────────────────────────
// (Para uso futuro — carpeta promos/ en Cloudinary)
export const PROMO_IMAGES: { publicId: string; alt: string }[] = [];
