---
name: PLayera v2 — Contexto de seguridad del proyecto
description: Arquitectura de autenticación, librerías de seguridad en uso y patrones recurrentes identificados en auditorías pre-despliegue (2026-03-25 y 2026-03-26)
type: project
---

Stack: Express + TypeScript + Prisma + PostgreSQL (Neon) / Next.js 14 App Router.

**Auth architecture:**
- Customer JWT: `jr_token` en localStorage, generado en `/api/v1/auth/login`, 7 días de expiración, payload `{ sub: userId, role: 'CUSTOMER' }`.
- Admin JWT: `admin_token` en localStorage (via `lib/api.ts`), generado en `/api/v1/admin/login`, mismo secret y duración que customer. Sub fijo = 'admin'.
- `requireAuth` middleware verifica JWT pero las rutas admin hacen `req.user?.role !== 'admin'` manualmente — no hay un middleware adminOnly centralizado.

**Security libraries in use:** helmet (con CSP configurado en server.ts), bcrypt (12 rounds), zod, express-rate-limit, cors con whitelist.

**Sensitive data types:** passwordHash (bcrypt), JWT_SECRET, ADMIN_PASSWORD_HASH, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SMTP_PASS, datos PII de órdenes (email, dirección, teléfono), códigos de cupón de recompensas.

**Mejoras confirmadas en auditoría 2026-03-26 (vs auditoría 2026-03-25):**
1. RESUELTO: `GET /api/v1/orders` ahora verifica `req.user?.role !== 'admin'`.
2. RESUELTO: `PUT /api/v1/orders/:id/status` ahora verifica `req.user?.role !== 'admin'`.
3. RESUELTO: `GET /api/v1/analytics/abandoned` ahora usa `adminOnly()`.
4. RESUELTO: `POST /api/v1/analytics/view` ahora tiene `viewLimiter` (10/min por IP).
5. RESUELTO: `POST /verify-email` ahora tiene `otpLimiter`.
6. RESUELTO: `redeemForFreeJersey` ahora usa `randomBytes(4)` de crypto (CSPRNG).
7. RESUELTO: Coupon validate endpoint ahora tiene `couponValidateLimiter` (5/min por IP).
8. RESUELTO: CSP ahora configurada en helmet con directivas reales.

**Hallazgos pendientes identificados en auditoría 2026-03-26:**
1. HIGH: `POST /api/v1/admin/login` sin rate limiting — fuerza bruta de contraseña admin posible.
2. HIGH: `POST /api/v1/auth/register` sin rate limiting — permite crear cuentas masivas y abusar el bono de 500 pts.
3. HIGH: `POST /api/v1/auth/login` sin rate limiting — fuerza bruta de contraseñas de clientes.
4. HIGH: `GET /api/v1/analytics/views/:productId` sin verificación de rol admin — cualquier autenticado accede.
5. MEDIUM: `Math.random()` en `generateOrderNumber()` — no es CSPRNG; colisiones predecibles en número de orden.
6. MEDIUM: `POST /api/v1/auth/register` sin rate limiting + bono de 500 pts = abuso de puntos de recompensa.
7. MEDIUM: `gran` (granularity) en analytics/revenue/timeline pasa por `DATE_TRUNC(${gran}, ...)` via tagged template — en Prisma esto ES seguro (parametrizado), pero requiere confirmación de versión.
8. MEDIUM: CORS permite peticiones sin `origin` (curl/postman) en producción — correcto para server-to-server pero aumenta superficie de ataque manual.
9. MEDIUM: `/api/revalidate` en frontend sin autenticación — cualquiera puede disparar revalidaciones ISR.
10. LOW: `isOwner` en PDF check compara `order.email === req.user!.sub` (sub es userId, no email) — lógica siempre falsa para el segundo caso.
11. INFO: `express.json({ limit: '10mb' })` es excesivamente generoso para una API de e-commerce.
12. INFO: Tokens JWT en localStorage — XSS persistente si se logra inyección (riesgo arquitectónico aceptado, sin cambios).

**Why:** Auditoría completa solicitada antes del primer despliegue a producción (segunda revisión).
**How to apply:** En futuras revisiones, verificar especialmente que rutas admin tengan `adminOnly` guard y que nuevas rutas de escritura/login tengan rate limiting.
