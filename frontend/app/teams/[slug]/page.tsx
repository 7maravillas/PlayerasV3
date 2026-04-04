import type { Metadata } from "next";
import { ProductListing } from "@/components/store/ProductListing";

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const title = params.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `Jerseys de ${title} | Jerseys Raw`,
    description: `Jerseys oficiales de ${title} 2024-2025. Versión Fan y Player. Tallas XS a 3XL. Personalización con nombre y número. Envío express a toda la República Mexicana.`,
    openGraph: {
      title: `Jerseys de ${title} — Jerseys Raw`,
      description: `Jerseys oficiales de ${title} 2024-2025. Versión Fan y Player. Envío a todo México.`,
      url: `https://jerseysraw.com/teams/${params.slug}`,
    },
    alternates: { canonical: `https://jerseysraw.com/teams/${params.slug}` },
  };
}

// Obtener datos (Server Component)
async function getTeamProducts(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/v1/products?club=${slug}&limit=100`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return { items: [] };
    return res.json();
  } catch (error) {
    return { items: [] };
  }
}

export default async function TeamPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const data = await getTeamProducts(slug);
  
  // Nombre bonito (ej: real-madrid -> Real Madrid)
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <>
      <ProductListing
        title={title}
        products={data.items || []}
        clubSlug={slug}
        enableFilters={true}
      />
      <section className="max-w-3xl mx-auto px-6 md:px-12 pb-16 text-sm text-gray-500 leading-relaxed">
        <h2 className="text-base font-medium text-gray-700 mb-2">Jerseys de {title} en México</h2>
        <p>
          En Jerseys Raw encontrarás los jerseys oficiales de {title} de la temporada 2024-2025.
          Disponibles en versión Fan y Player, mangas corta y larga, con tallas de XS a 3XL.
          Todos los modelos —{" "}local, visita y tercero — con personalización de nombre y número disponible.
          Envío express a domicilio en toda la República Mexicana.
        </p>
      </section>
    </>
  );
}