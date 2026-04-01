import type { Metadata } from "next";
import ReviewsClient from "./ReviewsClient";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export const metadata: Metadata = {
  title: "Reseñas de Clientes | Jerseys Raw",
  description: "Lee las opiniones de nuestros clientes sobre sus jerseys. Reseñas verificadas de compras reales.",
  alternates: { canonical: "https://jerseysraw.com/reviews" },
};

async function getInitialData() {
  try {
    const [reviewsRes, statsRes] = await Promise.all([
      fetch(`${API_BASE}/api/v1/reviews?status=APPROVED`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE}/api/v1/reviews/stats`, { next: { revalidate: 60 } }),
    ]);
    const reviews = await reviewsRes.json();
    const stats = await statsRes.json();
    return {
      reviews: Array.isArray(reviews) ? reviews : [],
      stats,
    };
  } catch {
    return { reviews: [], stats: null };
  }
}

export default async function ReviewsPage() {
  const { reviews, stats } = await getInitialData();
  return <ReviewsClient initialReviews={reviews} initialStats={stats} />;
}
