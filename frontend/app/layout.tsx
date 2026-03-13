// 1. IMPORTAR LOS ESTILOS
import "../styles/globals.css";
import { Inter, Bebas_Neue } from "next/font/google";
import CartSidebar from "@/components/CartSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { RouteThemeForcer } from "@/components/RouteThemeForcer";

// Fuentes
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-heading" });

export const metadata = {
  title: "Jerseys Raw",
  description: "Official Gear — Born in the streets",
};

// 2. ESTRUCTURA BÁSICA (HTML y BODY)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${bebasNeue.variable} font-sans bg-theme-bg text-th-primary transition-colors duration-300`}>
        <ThemeProvider>
          <RouteThemeForcer />
          {children}
          <CartSidebar />
        </ThemeProvider>
      </body>
    </html>
  );
}