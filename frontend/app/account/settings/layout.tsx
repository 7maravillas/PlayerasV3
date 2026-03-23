import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuración de Cuenta",
  description: "Actualiza tu nombre, teléfono y contraseña.",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
