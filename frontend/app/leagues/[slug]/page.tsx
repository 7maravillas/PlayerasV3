import type { Metadata } from "next";
import { ProductListing } from "@/components/store/ProductListing";

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const title = params.slug.replace(/-/g, ' ').toUpperCase();
  const titleCase = params.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `Jerseys ${titleCase} 2024-2025 | Jerseys Raw`,
    description: `Jerseys oficiales de todos los equipos de ${title} 2024-2025. Versión Fan y Player disponible. Tallas XS a 3XL. Envío express a toda la República Mexicana.`,
    openGraph: {
      title: `Jerseys ${titleCase} — Jerseys Raw`,
      description: `Todos los equipos de ${title}. Jerseys oficiales con envío a México.`,
      url: `https://jerseysraw.com/leagues/${params.slug}`,
    },
    alternates: { canonical: `https://jerseysraw.com/leagues/${params.slug}` },
  };
}

async function getLeagueProducts(slug: string) {
  try {
    // Nota: Necesitas asegurarte de que tu backend soporte ?league=slug
    // Si aún no lo agregaste al backend, esto devolverá vacío, pero el diseño funcionará.
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/v1/products?leagues=${slug}&limit=100`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return { items: [] };
    return res.json();
  } catch (error) {
    return { items: [] };
  }
}

export default async function LeaguePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const data = await getLeagueProducts(slug);
  
  const title = slug.replace(/-/g, ' ').toUpperCase();
  const titleCase = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <>
      <ProductListing
        title={title}
        products={data.items || []}
      />
      <section className="max-w-3xl mx-auto px-6 md:px-12 pb-16 text-sm text-gray-500 leading-relaxed">
        <h2 className="text-base font-medium text-gray-700 mb-2">Jerseys de {titleCase} en México</h2>
        <p>
          Explora todos los jerseys oficiales de los equipos de {title} temporada 2024-2025.
          Versión Fan y Player disponible en cada modelo. Tallas de XS a 3XL.
          Personalización con nombre y número. Envío express a domicilio en toda la República Mexicana.
        </p>
      </section>
    </>
  );
}