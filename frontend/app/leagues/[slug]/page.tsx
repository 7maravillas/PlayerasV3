import { ProductListing } from "@/components/store/ProductListing";

async function getLeagueProducts(slug: string) {
  try {
    // Nota: Necesitas asegurarte de que tu backend soporte ?league=slug
    // Si aún no lo agregaste al backend, esto devolverá vacío, pero el diseño funcionará.
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/v1/products?league=${slug}&limit=100`,
      { cache: 'no-store' }
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

  return (
    <ProductListing 
      title={title}
      count={data.items ? data.items.length : 0}
      products={data.items || []}
      categorySlug={slug}
    />
  );
}