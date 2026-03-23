import type { Metadata } from "next";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Recuperar Contraseña",
  description: "¿Olvidaste tu contraseña? Te enviamos un código de 6 dígitos a tu correo para recuperar el acceso a tu cuenta.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
