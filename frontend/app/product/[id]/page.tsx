// app/product/[id]/page.tsx — SERVER COMPONENT
// Responsabilidades:
//   1. Fetchear el producto desde el backend (server-side, para SEO)
//   2. Exportar generateMetadata con OpenGraph tags dinámicos
//   3. Renderizar el ProductDetailClient (que contiene toda la lógica interactiva)

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function getProduct(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/products/${id}`, {
      next: { revalidate: 60 }, // Revalidar cada 60s (ISR)
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/* ─── SEO Dinámico — generateMetadata ─── */
export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const product = await getProduct(params.id);

  if (!product) {
    return { title: "Producto no encontrado — Jerseys Raw" };
  }

  const price = product.variants?.[0]?.priceCents
    ? `$${(product.variants[0].priceCents / 100).toFixed(0)} MXN`
    : "";

  const description = product.description
    || `Compra el jersey ${product.name} al mejor precio${price ? ` — ${price}` : ""}. Versión Fan y Player disponible. Envío express a toda la República Mexicana. Personalización con nombre y número.`;

  const imageUrl = product.images?.[0]?.url || product.imageUrl || "";

  return {
    title: `${product.name} | Jersey Oficial${price ? ` — ${price}` : ""} | Jerseys Raw`,
    description,
    openGraph: {
      title: `${product.name}${price ? ` — ${price}` : ""}`,
      description,
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 800, alt: product.name }] : [],
      type: "website" as const,
      siteName: "Jerseys Raw",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name}${price ? ` — ${price}` : ""}`,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: { canonical: `https://jerseysraw.com/product/${params.id}` },
  };
}

/* ─── Page Component ─── */
export default async function ProductDetailPage(
  { params }: { params: { id: string } }
) {
  const product = await getProduct(params.id);

  if (!product) notFound();

  const variants: any[] = product.variants ?? [];
  const prices = variants.map((v: any) => v.priceCents).filter(Boolean);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const imageUrl = product.images?.[0]?.url || product.imageUrl || "";
  const availability = variants.some((v: any) => v.stock > 0)
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `https://jerseysraw.com/product/${params.id}#product`,
        "name": product.name,
        "description": product.description || `Jersey oficial de ${product.name}`,
        "image": imageUrl ? [imageUrl] : [],
        "sku": params.id,
        "brand": { "@type": "Brand", "name": "Jerseys Raw" },
        ...(minPrice ? {
          "offers": {
            "@type": "Offer",
            "url": `https://jerseysraw.com/product/${params.id}`,
            "priceCurrency": "MXN",
            "price": (minPrice / 100).toFixed(2),
            "priceValidUntil": priceValidUntil,
            "availability": availability,
            "itemCondition": "https://schema.org/NewCondition",
            "seller": { "@type": "Organization", "name": "Jerseys Raw" },
          },
        } : {}),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://jerseysraw.com" },
          { "@type": "ListItem", "position": 2, "name": "Catálogo", "item": "https://jerseysraw.com/catalog" },
          { "@type": "ListItem", "position": 3, "name": product.name, "item": `https://jerseysraw.com/product/${params.id}` },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient productId={params.id} initialProduct={product} />
    </>
  );
}