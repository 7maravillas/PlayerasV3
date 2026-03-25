# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ LECTURA OBLIGATORIA PARA CADA SESIÓN

**ANTES DE HACER CUALQUIER COSA:** Lee `.claude/PLAN.md` completamente. Ese archivo contiene:
- Todas las tareas pendientes y su estado
- Orden de ejecución recomendado
- Complejidad y dependencias
- Problemas conocidos en desarrollo

**NO inicies ninguna tarea sin revisar PLAN.md primero.**

## Plan de Desarrollo

**SIEMPRE** consultar `.claude/PLAN.md` antes de proponer o iniciar cualquier tarea de desarrollo. Ese archivo contiene el plan completo con todas las tareas pendientes, su estado, complejidad y orden de ejecución recomendado. Cualquier nueva tarea o sprint debe registrarse ahí.

## Project Overview

**PLayera v2** is a full-stack e-commerce platform for selling football jerseys (playeras de fútbol). Spanish is the primary language for content/UI.

- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS (port 3000)
- **Backend**: Express + TypeScript + Prisma ORM + PostgreSQL/Neon (port 4000)
- **Images**: Cloudinary CDN (res.cloudinary.com/dcwyl56kj)
- **Payments**: Stripe webhooks
- **Deployment**: Frontend → Vercel, Backend → Render/Railway, DB → Neon

## Development Commands

### Setup
```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Database
cd backend && npm run prisma:generate
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed data
npm run prisma:studio    # Open DB GUI
```

### Running Locally
```bash
# Terminal 1 — Frontend (http://localhost:3000)
cd frontend && npm run dev

# Terminal 2 — Backend (http://localhost:4000)
cd backend && npm run dev
```

### Build & Lint
```bash
# Frontend
cd frontend
npm run build
npm run lint
npm run typecheck   # tsc --noEmit

# Backend
cd backend
npm run build       # tsc → dist/
npm run lint        # eslint .
```

## Architecture

### Backend (`/backend/src`)

Layered architecture: **Route → Controller → Service → Repository → Prisma**

- `routes/` — 16 route files, all mounted under `/api/v1/`
- `controllers/` — Request/response handling
- `services/` — Business logic (e.g., `ProductService`)
- `repositories/` — Data access layer (e.g., `ProductRepository`)
- `middlewares/` — `requireAuth` (JWT), `errorHandler`
- `validators/` — Zod schemas (`OrderValidator`, `ProductValidator`)
- `lib/` — Shared utilities: `prisma` (singleton), `env` (typed env), `auth` (JWT), `mailer` (Nodemailer), `corsConfig`, `pagination`
- `jobs/` — Cron jobs (order expiry runs every 30 min; orders expire after 12 hours)
- `config/` — `shipping.ts`

**Route registration order matters**: `search.routes` is registered before `product.routes` so `/search` isn't caught by `/:idOrSlug`. The Stripe webhook route uses raw body (registered before `express.json()` middleware).

Key endpoints:
- `GET /healthz` — DB health check
- `/api/v1/products` — Catalog with filtering/pagination
- `/api/v1/orders` — Order creation with stock reservation
- `/api/v1/auth` — JWT login/register/verify
- `/api/v1/admin/*` — Admin-only (separate auth from customer)
- `/api/v1/webhooks/stripe` — Stripe events

### Frontend (`/frontend/app`)

Next.js 14 App Router. All routes are in `app/`.

**State Management:**
- `app/store/cartStore.ts` — Zustand, persisted to `localStorage` key `jerseys-raw-cart`
- `app/store/wishlistStore.ts` — Zustand, wishlisted products
- `contexts/AuthContext.tsx` — React Context for JWT auth (auto-restores session on mount)

**Theme System:**
- `ThemeProvider.tsx` wraps `next-themes` for dark/light mode
- `RouteThemeForcer.tsx` — Forces theme by route (e.g., dark theme on product pages)
- CSS custom properties map to Tailwind via `tailwind.config.ts`: `th-primary`, `th-secondary`, `accent`, `th-border`, `th-navbar`, `th-announce`, `th-sale`, `th-badge`
- Fonts: **Bebas Neue** (headings), **Inter** (body), **Jost**

**Key component patterns:**
- `app/product/[id]/ProductDetailClient.tsx` — Client component for product detail (size selection, cart)
- `components/store/ProductListing.tsx` — Product grid with filters
- `components/AdminGuard.tsx` — Wraps admin pages; redirects if not authenticated as admin
- `lib/api.ts` — Centralized fetch wrapper for all API calls

### Database Schema (Prisma)

Core models: `Product`, `ProductVariant` (size/color/audience/sleeve/stock), `ProductImage`, `Order`, `OrderItem`, `User`, `Review`, `Club`, `League`, `Season`, `Category`, `Supplier`, `PurchaseOrder`

Important enums: `Audience` (HOMBRE/MUJER/NINO/UNISEX), `JerseyStyle` (HOME/AWAY/THIRD/GK/SPECIAL), `FulfillmentType` (LOCAL/DROPSHIPPING), `OrderStatus`

Customization: `OrderItem` supports `customName`/`customNumber`; `ProductVariant.allowsNameNumber` gates this; default price `customizationPriceCents = 1990` (MXN ¢).

## Environment Variables

**Backend** (see `backend/.env.example`):
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — 32+ character secret
- `ADMIN_PASSWORD_HASH` — bcrypt hash for admin login
- `CORS_ORIGIN` — Frontend URL
- `PORT` — Defaults to 4000
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**Frontend** (see `frontend/.env.example`):
- `NEXT_PUBLIC_API_BASE_URL` — Backend URL (default `http://localhost:4000`)

## Key Conventions

- Prices are stored in **cents** (e.g., `priceCents`, `totalCents`, `unitPriceCents`). Always work in cents; display divides by 100.
- Products have two stock types: `LOCAL` (immediate) and `DROPSHIPPING`. Cart distinguishes these via `hasLocalStock`.
- Admin auth is separate from customer auth — different login flow and JWT claims.
- API routes use Zod validation via validators before reaching controllers.
- The backend uses `tsx watch` (not `ts-node`) for development hot-reload.
- Cloudinary images: use `next-cloudinary` `<CldImage>` component for images from Cloudinary; `next/image` for others.

## Sprint Progress

### Sprint 1 — Deuda técnica rápida

| Tarea | Estado |
|-------|--------|
| F7 — Limpiar deuda técnica frontend (console.error + getDeliveryDates duplicado) | ✅ Completo |
| F3 — Refactorizar raw fetch() en Register y Account | ✅ Completo |
| B1 — Password reset (forgot-password + reset-password) | ✅ Completo |
| B2 — Email notificación admin en nueva orden pagada | ✅ Completo |
| B3 — Manejar checkout.session.expired (cancelar + restaurar stock) | ✅ Completo |
| B4 — Limpiar console.log de producción | ✅ Completo |
| B5 — Rate limiting a POST /orders (10/10min) | ✅ Completo |
| B6 — Zod validation a POST /reviews | ✅ Completo |
| B8 — Completar validación de env.ts | ✅ Completo |

### Sprint 2 — Features de usuario faltantes

| Tarea | Estado |
|-------|--------|
| F1 — Conectar /app/reviews/page.tsx a la API | ✅ Completo |
| F2 — Eliminar mock data del Tracking page | ✅ Completo |

### Sprint 3 — Páginas dinámicas y SEO

| Tarea | Estado |
|-------|--------|
| F4 — Actualizar sitemap.ts con rutas dinámicas (ligas, equipos, colecciones) | ✅ Completo |
| F5 — Verificar páginas dinámicas de contenido (leagues, teams, collections) | ✅ Completo |
| F6 — Verificar Homepage (secciones dinámicas) | ✅ Completo |
| B7 — Índices de DB faltantes (categoryId en Product, productId en ProductView) | ✅ Completo |

### Sprint 4 — Admin panel completo

| Tarea | Estado |
|-------|--------|
| FS1 — Admin CRUD de Productos (new + edit) | ✅ Verificado (ya completo) |
| FS2 — Admin CRUD de Órdenes (status transitions + tracking number) | ✅ Completo |
| FS3 — Admin CRUD de Clubs, Leagues, Tags | ✅ Verificado (ya completo) |
| FS4 — Admin moderación de Reviews | ✅ Verificado (ya completo) |
| FS5 — Página de cuenta de usuario con historial de órdenes | ✅ Verificado (ya completo desde Sprint 2) |
