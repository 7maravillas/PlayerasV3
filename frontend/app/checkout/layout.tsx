import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finalizar Compra",
  description: "Completa tu pedido de forma segura. Pago con tarjeta, envíos a toda la República Mexicana con rastreo en tiempo real.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
