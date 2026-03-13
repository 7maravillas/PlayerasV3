"use client";

import { useState, useEffect } from "react";
import Marquee from "@/components/animata/container/marquee";

interface Review {
  id: string;
  name: string;
  image: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

/* ── Card exacta del patrón Animata ScrollingTestimonials ── */
function TestimonialCard({ review }: { review: Review }) {
  return (
    <div className="flex h-44 w-96 overflow-hidden rounded-xl border border-th-border/10 bg-theme-card">
      {/* Foto lateral */}
      <div className="relative h-full w-32 flex-shrink-0 overflow-hidden">
        {review.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={review.image} alt={review.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-accent/10 flex items-center justify-center">
            <span className="text-4xl font-black text-accent/30 uppercase font-heading">
              {review.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      {/* Contenido */}
      <div className="px-4 py-2 flex flex-col justify-center min-w-0">
        <span className="block text-lg font-bold text-th-primary">{review.name}</span>
        <span className="-mt-1 mb-1 block text-sm font-medium leading-loose text-th-secondary">
          Cliente verificado
        </span>
        <span className="block text-sm text-th-primary line-clamp-3">
          {review.comment || "¡Excelente jersey! Muy contento con mi compra."}
        </span>
      </div>
    </div>
  );
}

/* ── Componente principal: Animata Scrolling Testimonials ── */
export default function ScrollingReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${baseUrl}/api/v1/reviews`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
      })
      .catch(() => { });
  }, [baseUrl]);

  if (reviews.length === 0) return null;

  return (
    <section className="mt-16 space-y-4">
      {/* Header simple — trust global, sin promedio de estrellas */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black uppercase italic text-th-primary tracking-tight">
          Lo Que Dicen Nuestros Clientes
        </h2>
      </div>

      {/* 3 filas de marquee — patrón Animata exacto */}
      <div className="w-full">
        <Marquee className="[--duration:30s]" pauseOnHover applyMask={false}>
          {reviews.map((review) => (
            <TestimonialCard key={review.id} review={review} />
          ))}
        </Marquee>

        <Marquee reverse className="[--duration:45s] marquee-reverse" pauseOnHover applyMask={false}>
          {reviews.map((review) => (
            <TestimonialCard key={review.id} review={review} />
          ))}
        </Marquee>

        <Marquee className="[--duration:30s]" pauseOnHover applyMask={false}>
          {reviews.map((review) => (
            <TestimonialCard key={review.id} review={review} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
