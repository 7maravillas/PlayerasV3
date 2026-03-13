/**
 * CloudinaryImage — JerseysRAW
 * ─────────────────────────────────────────────────────────────────
 * Wrapper sobre <Image> de Next.js con loader personalizado de Cloudinary.
 *
 * Acepta TANTO:
 *   - publicId: "jerseys-raw/hero/balon"  (Capa 1: static-images.ts)
 *   - URL completa: "https://res.cloudinary.com/..."  (URLs ya migradas)
 *
 * El loader le dice a Next.js que NO recomprima la imagen — Cloudinary
 * ya entregó WebP/AVIF optimizado, así que no hay doble compresión.
 *
 * @example
 *   // Con publicId (forma ideal a futuro):
 *   <CloudinaryImage publicId="jerseys-raw/clubs/real-madrid" alt="Real Madrid" fill />
 *
 *   // Con URL completa (URLs ya migradas):
 *   <CloudinaryImage src="https://res.cloudinary.com/dcwyl56kj/..." alt="..." fill />
 */
"use client";

import Image, { ImageProps } from "next/image";
import { cloudinaryLoader } from "@/lib/cloudinary";

type CloudinaryImageProps = Omit<ImageProps, "src" | "loader"> & {
    /** Public ID de Cloudinary (ej. "jerseys-raw/hero/balon") */
    publicId?: string;
    /** URL completa (para URLs ya migradas sin publicId) */
    src?: string;
};

export default function CloudinaryImage({
    publicId,
    src,
    alt,
    ...rest
}: CloudinaryImageProps) {
    const imgSrc = publicId ?? src ?? "";

    if (!imgSrc) {
        console.warn("[CloudinaryImage] Se requiere 'publicId' o 'src'.");
        return null;
    }

    return (
        <Image
            src={imgSrc}
            alt={alt}
            loader={cloudinaryLoader}
            {...rest}
        />
    );
}
