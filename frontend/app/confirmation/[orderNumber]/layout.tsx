import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedido Confirmado",
  description: "Tu pedido ha sido recibido y está en proceso. Recibirás un correo con el número de rastreo cuando sea enviado.",
  robots: { index: false, follow: false },
};

export default function ConfirmationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
