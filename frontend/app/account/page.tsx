import type { Metadata } from "next";
import AccountClient from "./AccountClient";

export const metadata: Metadata = {
  title: "Mi Cuenta",
  description: "Revisa tus pedidos, descarga comprobantes y edita tu perfil.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountClient />;
}
