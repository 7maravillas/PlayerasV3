import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reseñas de Clientes",
  description: "Lee lo que opinan nuestros clientes. Reseñas verificadas de compradores reales sobre calidad, tallas y tiempos de entrega.",
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
