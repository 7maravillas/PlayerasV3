// backend/src/lib/mailer.ts
import * as nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  NODE_ENV,
} = process.env;

// Si faltan credenciales, usamos transporte que imprime el correo en consola
const useConsole =
  !SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM;

export const mailer = useConsole
  ? nodemailer.createTransport({ jsonTransport: true }) // imprime el “email” en consola (no envía)
  : nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

export async function sendVerificationEmail(to: string, code: string) {
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
      <h2>Verifica tu correo</h2>
      <p>Tu código de verificación es:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>
      <p>Este código expira en 10 minutos.</p>
    </div>
  `;

  const info = await mailer.sendMail({
    from: SMTP_FROM || 'no-reply@example.com',
    to,
    subject: 'Verifica tu correo',
    html,
  });

  // Log útil para desarrollo o cuando no hay SMTP real configurado
  if (useConsole || NODE_ENV === 'development') {
    console.log('[MAIL DEBUG] Enviado a:', to);
    console.log('[MAIL DEBUG] messageId:', (info as any).messageId ?? '(sin messageId)');
    try {
      console.log('[MAIL DEBUG] Info:', JSON.stringify(info, null, 2));
    } catch {
      console.log('[MAIL DEBUG] Info (raw):', info);
    }
    console.log('[MAIL DEBUG] Código:', code);

    // Si usas jsonTransport, algunos incluyen `message` fuera del tipo TS.
    // Descomenta si quieres ver el payload crudo:
    // console.log('[MAIL DEBUG] Payload:', (info as any).message);
  }
}
