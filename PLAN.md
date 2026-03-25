# PLAN.md — Plan de Desarrollo PLayera v2

**Última actualización:** 2026-03-24

## 📋 Sprints Completados

### Sprint 1 — Deuda técnica rápida ✅
- F7 — Limpiar deuda técnica frontend (console.error + getDeliveryDates duplicado)
- F3 — Refactorizar raw fetch() en Register y Account
- B1 — Password reset (forgot-password + reset-password)
- B2 — Email notificación admin en nueva orden pagada
- B3 — Manejar checkout.session.expired (cancelar + restaurar stock)
- B4 — Limpiar console.log de producción
- B5 — Rate limiting a POST /orders (10/10min)
- B6 — Zod validation a POST /reviews
- B8 — Completar validación de env.ts

### Sprint 2 — Features de usuario faltantes ✅
- F1 — Conectar /app/reviews/page.tsx a la API
- F2 — Eliminar mock data del Tracking page

### Sprint 3 — Páginas dinámicas y SEO ✅
- F4 — Actualizar sitemap.ts con rutas dinámicas (ligas, equipos, colecciones)
- F5 — Verificar páginas dinámicas de contenido (leagues, teams, collections)
- F6 — Verificar Homepage (secciones dinámicas)
- B7 — Índices de DB faltantes (categoryId en Product, productId en ProductView)

### Sprint 4 — Admin panel completo ✅
- FS1 — Admin CRUD de Productos (new + edit)
- FS2 — Admin CRUD de Órdenes (status transitions + tracking number)
- FS3 — Admin CRUD de Clubs, Leagues, Tags
- FS4 — Admin moderación de Reviews
- FS5 — Página de cuenta de usuario con historial de órdenes

### Sprint 5 — Rewards + Coupons + Stock Management (Actual) 🔄
- EX8 Fase 3 — Admin configuration panel para rewards (RewardConfig, endpoints, frontend UI)
- EX9 Fase 1 — Sistema de cupones (admin CRUD, validación, checkout integration)
- EX10 — Panel de inventario (admin/stock)
- Admin orders fulfillment display fix (usar `isDropshippable` en lugar de `product.fulfillmentType`)
- ReviewsSection.tsx bug fix (`!stats.total` guard)

---

## 🚨 Tareas Pendientes CRÍTICAS

### **INVENTORY BUG** ⚠️ BLOCKER
**Status:** 🔴 Abierto
**Impacto:** Alto
**Descripción:**
El panel `/admin/stock` no muestra correctamente el stock de las variantes. Cuando se crea un producto con variantes (ej: stock = 50), el inventario muestra:
- Stock actual: 0 (debería ser 50)
- Stock inicial: 0 (debería ser 50)
- Stock vendido: 0 (correcto)

**Causa probable:**
- Las variantes se crean pero el campo `stock` no se guarda correctamente en la BD
- O el query del endpoint `/admin/stock` no está fetching el stock correctamente

**Cómo reproducir:**
1. Crear producto nuevo con 50 unidades en cada variante
2. Ir a `/admin/stock`
3. Ver que muestra 0 unidades

**Próximos pasos:**
1. Verificar en Neon: `SELECT id, stock FROM "ProductVariant" LIMIT 5;`
2. Revisar si el admin está enviando `stock` correctamente
3. Revisar si el backend está guardando el stock
4. Revisar si el query del GET /admin/stock está correctamente fetchando el stock

---

### **CRM Interno** 🔵 PENDIENTE
**Status:** 📋 Planificación
**Complejidad:** Media
**Descripción:**
Sistema interno de gestión de clientes (CRM). Seguimiento de compras, interacciones, contacto, notas internas.

**Tareas sub:**
- [ ] Diseño de data model (Customer contact info, purchase history, internal notes)
- [ ] Admin CRUD de clientes
- [ ] Historial de interacciones
- [ ] Búsqueda y filtros

---

## ✅ Tareas Recientes (Sprint 5)

| Tarea | Estado | Fecha |
|-------|--------|-------|
| Desactivar seed.ts automático | ✅ | 2026-03-24 |
| Implementar panel de inventario (/admin/stock) | ✅ | 2026-03-24 |
| Endpoint POST /admin/stock/:variantId/restock | ✅ | 2026-03-24 |
| Endpoint GET /admin/stock/report/pdf | ✅ | 2026-03-24 |
| StockMovement table + migration SQL | ✅ | 2026-03-24 |
| Fix ProductDetailClient hasLocalStock logic | ✅ | 2026-03-24 |
| Fix ReviewsSection stats guard | ✅ | 2026-03-24 |
| Fix admin/orders fulfillment badge (usar isDropshippable) | ✅ | 2026-03-24 |
| Agregar Inventario a sidebar | ✅ | 2026-03-24 |
| Sistema de cupones (validation + admin CRUD + checkout) | ✅ | 2026-03-24 |
| Admin rewards configuration | ✅ | 2026-03-24 |

---

## 🔄 Estado de Fases Post-Sprint 4

### ✅ Fase 1 — Quick Wins (Completada)
- ✅ EX1 — Dropdown navbar theme-aware
- ✅ EX2 — Recuperar contraseña (forgot-password + reset-password)

### ✅ Fase 2 — Core Admin + Usuario (Completada)
- ✅ EX3-B — Admin Clientes (GET /admin/customers endpoints)
- ✅ EX3-F — Admin Clientes (frontend customers page con búsqueda)
- ✅ EX4-B — Settings usuario (PUT /auth/me endpoint)
- ✅ EX4-F — Settings usuario (frontend settings page)

### 🔄 Fase 3 — Mejoras de Experiencia (En progreso)
- ✅ EX5-B — Buscador optimizado (búsqueda por palabras individuales) — **COMPLETO**
- ✅ EX5-F — Buscador optimizado (frontend search history + highlighting) — **COMPLETO**
- ✅ EX6 — PDF de orden — **COMPLETO** (botón en Account descartado por decisión de diseño)

### ⏳ Fase 4 — Features Avanzados (Pendiente)
- ✅ EX8 — Sistema de recompensas (COMPLETO)
- [ ] EX9 — CRM interno (notas cliente, tags, segmentación)

## 🎯 Next Steps

1. **EX5-B — Buscador optimizado** (EN PROGRESO)
   - Splitear query en palabras y buscar con OR por cada palabra
   - Afecta: search.routes.ts (instant-search) y product.repository.ts (catálogo)

2. **CRM interno** (EX9) — después de EX5-B

3. **Deploy to production** (cuando todo esté estable)
   - Frontend → Vercel
   - Backend → Render/Railway
   - DB → Neon (ya en uso)

---

## 📊 Métricas

- **Funcionalidades completadas:** 95%
- **Bugs conocidos:** 1 (Inventory stock not saving)
- **Blockers:** 1 (Inventory bug)
- **Deuda técnica:** Baja

---

## 🔗 Referencias

- `.claude/PLAN.md` — Este archivo (siempre consultar primero)
- `CLAUDE.md` — Arquitectura y convenciones del proyecto
- `backend/.env.example` — Variables de entorno backend
- `frontend/.env.example` — Variables de entorno frontend
