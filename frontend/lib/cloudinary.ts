/**
 * Cloudinary Utility — JerseysRAW
 * ─────────────────────────────────
 * Construye URLs de Cloudinary con transformaciones optimizadas.
 * Componentes usan el publicId (ej. "jerseys-raw/hero/slide-1"),
 * NUNCA la URL completa — así si cambia el cloud, se cambia aquí solo.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "dcwyl56kj";
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

export interface CldTransformOptions {
    /** Ancho en px (Cloudinary redimensiona proporcionalmente) */
    w?: number;
    /** Alto en px */
    h?: number;
    /** Calidad: 'auto' | 'auto:best' | 'auto:eco' | número 1-100 */
    q?: string | number;
    /** Formato: 'auto' (WebP/AVIF automático según navegador) | 'webp' | 'jpg' */
    f?: string;
    /** Tipo de recorte: 'fill' | 'fit' | 'limit' | 'pad' */
    c?: string;
}

/**
 * Genera una URL de Cloudinary con transformaciones.
 * @example
 *   cldUrl("jerseys-raw/hero/balon", { w: 1920 })
 *   // https://res.cloudinary.com/dcwyl56kj/image/upload/f_auto,q_auto,w_1920/jerseys-raw/hero/balon
 */
export function cldUrl(publicId: string, opts: CldTransformOptions = {}): string {
    const transforms: string[] = [
        `f_${opts.f ?? "auto"}`,
        `q_${opts.q ?? "auto"}`,
    ];
    if (opts.w) transforms.push(`w_${opts.w}`);
    if (opts.h) transforms.push(`h_${opts.h}`);
    if (opts.c) transforms.push(`c_${opts.c}`);

    return `${BASE_URL}/${transforms.join(",")}/${publicId}`;
}

/**
 * Custom loader para <Image> de Next.js.
 * Le dice a Next.js: "No toques esta imagen, Cloudinary ya la optimizó".
 * Úsalo como: <Image loader={cloudinaryLoader} src={publicId} ... />
 */
export function cloudinaryLoader({
    src,
    width,
    quality,
}: {
    src: string;
    width: number;
    quality?: number;
}): string {
    // Si ya es una URL completa de Cloudinary (migración gradual), la devuelve tal cual
    if (src.startsWith("https://res.cloudinary.com")) return src;

    // Si es un publicId, construye la URL optimizada
    return cldUrl(src, { w: width, q: quality ?? "auto" });
}
