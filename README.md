# Playeras E‑commerce — Fundaciones (Frontend + Backend)

Tecnologías:
- **Frontend**: Next.js 14 + TypeScript + Tailwind + (shadcn/ui se agrega después con CLI)
- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL (Neon)
- **CDN/Imágenes**: Cloudflare R2 (solo guardamos URLs en la BD)
- **CI**: GitHub Actions (lint + build)
- **Hosting sugerido**: Frontend en Vercel (Hobby), Backend en Render/Railway, BD en Neon (Free)

> Esta base deja **todo listo** para empezar diseño/UX y luego el catálogo. Incluye seguridad mínima: Helmet, CORS, rate limiting y validación con Zod en el backend.

## Requisitos previos
- Node.js 18+ y npm
- Cuenta en Neon (PostgreSQL) para obtener `DATABASE_URL`
- (Opcional) Cuenta en Cloudflare R2 para subir imágenes (luego)
- Git

---

## Pasos rápidos

### 1) Instalar dependencias
```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2) Crear base de datos (Neon) y configurar .env
En **backend**, copia `.env.example` a `.env` y reemplaza valores:
```bash
cp backend/.env.example backend/.env
```
- `DATABASE_URL` (Neon - connection string)
- `CORS_ORIGIN` (tu dominio front, p. ej. http://localhost:3000)
- (Más adelante) variables de R2/MercadoPago se agregarán aquí.

### 3) Migraciones de Prisma
```bash
cd backend
npm run prisma:migrate -- --name init
```

### 4) Ejecutar en local
En **dos terminales**:
```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev
```
- Frontend: http://localhost:3000
- Backend:  http://localhost:4000 (healthcheck en `/healthz`)

### 5) Lint y typecheck
```bash
cd frontend && npm run lint && npm run typecheck
cd ../backend && npm run lint
```

### 6) Deploy (resumen)
- **Frontend (Vercel)**: Importa carpeta `frontend/`. Configura env `NEXT_PUBLIC_API_BASE_URL` apuntando a tu backend.
- **Backend (Render/Railway)**: Crea servicio web desde `backend/`, comando `npm run start`, port `4000`. Configura env `DATABASE_URL`, `NODE_ENV=production`, `CORS_ORIGIN=https://tu-dominio.vercel.app`.
- **BD (Neon)**: ya configurada al usar `DATABASE_URL`.

---

## Estructura

```
playeras-stack/
  frontend/           # Next.js + TS + Tailwind
    app/
    public/
    styles/
  backend/            # Express + TS + Prisma
    prisma/
    src/
  .github/workflows/
  README.md
  .gitignore
```

---

## Próximos pasos sugeridos
1) Fase 1: pulir UI (paleta, tipografías, layout y componentes base con shadcn/ui).
2) Fase 2: modelos de datos reales (productos/variantes/imágenes) y seed con Prisma.
3) Fase 3: auth + RBAC (admin/cliente) y seguridad (rate limits, headers, validación completa con Zod).
4) Fase 4: catálogo SSR/ISR, filtros y búsqueda básica.
5) Fase 5: carrito y checkout (Mercado Pago sandbox + webhooks).

¡Listo para construir! 💪
