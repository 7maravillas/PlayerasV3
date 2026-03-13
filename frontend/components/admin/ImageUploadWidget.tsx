"use client";

import { useState, useRef } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Upload, CheckCircle2, ImagePlus, X, GripVertical } from "lucide-react";

interface MultiImageUploadProps {
    /** Array actual de URLs de imagenes */
    images: string[];
    /** Callback inmutable: recibe el nuevo array completo */
    onChange: (images: string[]) => void;
}

export default function ImageUploadWidget({ images, onChange }: MultiImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // Ref que siempre tiene el valor más reciente del array (evita stale closure)
    const imagesRef = useRef(images);
    imagesRef.current = images;

    // Agregar imagen al final — lee del ref para evitar stale state
    const handleUploadSuccess = (secureUrl: string) => {
        onChange([...imagesRef.current, secureUrl]);
        setUploading(false);
    };

    // Eliminar una imagen (inmutable)
    const handleRemove = (index: number) => {
        onChange(images.filter((_, i) => i !== index));
    };

    // Drag & Drop reorder (inmutable)
    const handleDragStart = (index: number) => {
        dragItem.current = index;
    };
    const handleDragEnter = (index: number) => {
        dragOverItem.current = index;
    };
    const handleDragEnd = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const reordered = [...images];
        const [removed] = reordered.splice(dragItem.current, 1);
        reordered.splice(dragOverItem.current, 0, removed);
        onChange(reordered);
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="w-full space-y-3">

            {/* Grid de imágenes */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                    {images.map((url, index) => (
                        <div
                            key={`${url}-${index}`}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className={`relative aspect-square rounded-lg border-2 overflow-hidden group cursor-grab active:cursor-grabbing transition-all ${
                                index === 0 ? "border-indigo-400 col-span-2" : "border-slate-200"
                            }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={url}
                                alt={`Imagen ${index + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay con controles */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <GripVertical className="w-5 h-5 text-white/70" />
                            </div>

                            {/* Badge de orden */}
                            <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {index === 0 ? "Principal" : `#${index + 1}`}
                            </div>

                            {/* Botón eliminar */}
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Zona vacía cuando no hay imágenes */}
            {images.length === 0 && (
                <div className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
                    <div className="text-center text-slate-400 p-4">
                        <Upload className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-xs font-bold uppercase tracking-wide">Sin imágenes</p>
                        <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, WebP • Máx. 10MB</p>
                    </div>
                </div>
            )}

            {/* Botón de subida (una imagen a la vez) */}
            <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "jerseys_raw_products"}
                options={{
                    sources: ["local", "url", "camera"],
                    multiple: false,
                    maxFiles: 1,
                    cropping: false,
                    folder: "jerseys-raw/products",
                    clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "avif"],
                    maxFileSize: 10000000,
                    showPoweredBy: false,
                    styles: {
                        palette: {
                            window: "#111111",
                            windowBorder: "#333333",
                            tabIcon: "#00d2d3",
                            menuIcons: "#aaaaaa",
                            textDark: "#000000",
                            textLight: "#ffffff",
                            link: "#00d2d3",
                            action: "#00d2d3",
                            inactiveTabIcon: "#555555",
                            error: "#ef4444",
                            inProgress: "#00d2d3",
                            complete: "#10b981",
                            sourceBg: "#1c1c1c",
                        },
                    },
                }}
                onOpen={() => setUploading(true)}
                onSuccess={(result: any) => {
                    const info = result?.info;
                    if (info && typeof info === "object") {
                        handleUploadSuccess(info.secure_url);
                    }
                }}
                onClose={() => setUploading(false)}
            >
                {({ open }) => (
                    <button
                        type="button"
                        onClick={() => open()}
                        disabled={uploading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-400 text-indigo-600 font-bold uppercase text-sm rounded-xl transition-all duration-200 disabled:opacity-50"
                    >
                        {uploading ? (
                            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <ImagePlus className="w-4 h-4" />
                        )}
                        {uploading ? "Subiendo..." : images.length > 0 ? "Agregar Otra Foto" : "Subir Foto del Jersey"}
                    </button>
                )}
            </CldUploadWidget>

            {/* Contador */}
            {images.length > 0 && (
                <p className="text-emerald-500 text-[10px] text-center font-bold uppercase tracking-wide flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {images.length} {images.length === 1 ? "imagen" : "imágenes"} • Arrastra para reordenar
                </p>
            )}
        </div>
    );
}
