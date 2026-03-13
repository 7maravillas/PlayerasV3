import { ProductListing } from "@/components/store/ProductListing";

// Obtener datos (Server Component)
async function getTeamProducts(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/v1/products?club=${slug}&limit=100`,
      { cache: 'no-store' }
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
    <ProductListing 
      title={title}
      products={data.items || []}
      clubSlug={slug}
      enableFilters={true}
    />
  );
}