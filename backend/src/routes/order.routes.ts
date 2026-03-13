// src/routes/order.routes.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { CreateOrderSchema, UpdateOrderStatusSchema } from '../validators/order.validator.js';

const router = Router();

/* ─── Constantes de envío (centavos) ─── */
const SHIPPING_STANDARD_CENTS = 9900;   // $99 MXN
const SHIPPING_EXPRESS_CENTS = 19900;    // $199 MXN
const ORDER_EXPIRY_HOURS = 12;

/* ─── Generar número de orden único ─── */
function generateOrderNumber(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `JR-${date}-${rand}`;
}

/* ─── POST /orders — Crear orden (público) ─── */
router.post('/orders', async (req: Request, res: Response) => {
    // 1. Validar input
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const messages = Object.entries(fieldErrors)
            .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
            .join('; ');
        return res.status(400).json({
            error: messages || 'Datos inválidos',
            details: fieldErrors,
        });
    }

    const data = parsed.data;

    try {
        // 2. Consultar precios REALES de cada variante en la base de datos
        const variantIds = data.items.map(item => item.variantId);
        const variants = await prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        images: { take: 1, orderBy: { sortOrder: 'asc' } },
                    },
                },
            },
        });

        // 3. Verificar que todas las variantes existen
        const variantMap = new Map(variants.map(v => [v.id, v]));
        for (const item of data.items) {
            if (!variantMap.has(item.variantId)) {
                return res.status(400).json({
                    error: `Variante ${item.variantId} no encontrada`,
                });
            }
        }

        // 4. Verificar stock suficiente (solo para variantes con stock local)
        for (const item of data.items) {
            const variant = variantMap.get(item.variantId)!;
            if (!variant.isDropshippable && variant.stock < item.quantity) {
                return res.status(400).json({
                    error: `Stock insuficiente para "${variant.product.name}" talla ${variant.size || 'N/A'}. Disponible: ${variant.stock}`,
                });
            }
        }

        // 5. Calcular subtotal con precios REALES del backend
        let subtotalCents = 0;
        const allDropshippable = data.items.every(item => {
            const variant = variantMap.get(item.variantId)!;
            return variant.isDropshippable;
        });

        const orderItems = data.items.map(item => {
            const variant = variantMap.get(item.variantId)!;
            const unitPrice = variant.priceCents;

            // Agregar costo de personalización si aplica
            let itemTotal = unitPrice * item.quantity;
            if (item.isPersonalized && variant.allowsNameNumber) {
                itemTotal += variant.customizationPrice * item.quantity;
            }

            subtotalCents += itemTotal;

            return {
                productId: variant.product.id,
                variantId: variant.id,
                productName: variant.product.name,
                productSlug: variant.product.slug,
                productImageUrl: variant.product.images[0]?.url || null,
                variantSize: variant.size,
                variantColor: variant.color,
                quantity: item.quantity,
                unitPriceCents: unitPrice,
                totalCents: itemTotal,
                isDropshippable: variant.isDropshippable,
                isPersonalized: item.isPersonalized,
                customName: item.isPersonalized ? item.customName : null,
                customNumber: item.isPersonalized ? item.customNumber : null,
            };
        });

        // 6. Calcular envío
        let shippingCents: number;
        const shippingMethod = data.shippingMethod;

        switch (shippingMethod) {
            case 'FREE_PROMO':
                shippingCents = 0;
                break;
            case 'EXPRESS':
                shippingCents = SHIPPING_EXPRESS_CENTS;
                break;
            case 'STANDARD':
            default:
                shippingCents = allDropshippable ? 0 : SHIPPING_STANDARD_CENTS;
                break;
        }

        const totalCents = subtotalCents + shippingCents;
        const orderNumber = generateOrderNumber();
        const expiresAt = new Date(Date.now() + ORDER_EXPIRY_HOURS * 60 * 60 * 1000);

        // 7. Crear orden + descontar stock en UNA SOLA transacción
        const order = await prisma.$transaction(async (tx) => {
            // Crear la orden
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    zipCode: data.zipCode,
                    country: data.country,
                    reference: data.reference || null,
                    shippingMethod,
                    shippingCents,
                    subtotalCents,
                    totalCents,
                    currency: 'MXN',
                    expiresAt,
                    items: {
                        create: orderItems,
                    },
                },
                include: {
                    items: true,
                },
            });

            // Descontar stock (solo variantes con stock local, no dropshipping)
            for (const item of data.items) {
                const variant = variantMap.get(item.variantId)!;
                if (!variant.isDropshippable) {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { stock: { decrement: item.quantity } },
                    });
                }
            }

            return newOrder;
        });

        // TODO: Enviar email de notificación al admin (Resend/SendGrid en fase futura)

        res.status(201).json({
            orderNumber: order.orderNumber,
            status: order.status,
            totalCents: order.totalCents,
            shippingCents: order.shippingCents,
            expiresAt: order.expiresAt,
            itemCount: order.items.length,
        });
    } catch (error) {
        console.error('Error al crear orden:', error);
        res.status(500).json({ error: 'Error interno al procesar la orden' });
    }
});

/* ─── GET /orders/:orderNumber — Ver orden por número (público) ─── */
router.get('/orders/:orderNumber', async (req: Request, res: Response) => {
    const { orderNumber } = req.params;

    const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
            items: {
                include: {
                    product: { select: { fulfillmentType: true } },
                },
            },
        },
    });

    if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json(order);
});

/* ─── GET /orders — Listar órdenes (admin) ─── */
router.get('/orders', requireAuth, async (req: Request, res: Response) => {
    const { status, page = '1' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = 20;

    const where = status ? { status: status as any } : {};

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: { select: { fulfillmentType: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (pageNum - 1) * pageSize,
            take: pageSize,
        }),
        prisma.order.count({ where }),
    ]);

    res.json({
        items: orders,
        pagination: {
            total,
            page: pageNum,
            totalPages: Math.ceil(total / pageSize),
        },
    });
});

/* ─── PUT /orders/:id/status — Cambiar status (admin) ─── */
router.put('/orders/:id/status', requireAuth, async (req: Request, res: Response) => {
    const parsed = UpdateOrderStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Status inválido',
            details: parsed.error.flatten().fieldErrors,
        });
    }

    try {
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { status: parsed.data.status },
            include: { items: true },
        });

        res.json(order);
    } catch {
        res.status(404).json({ error: 'Orden no encontrada' });
    }
});

/* ─── POST /orders/:orderNumber/stripe-session — Crear sesión Stripe Checkout ─── */
// El flujo es:
//   1. Frontend crea la orden → recibe orderNumber
//   2. Frontend llama este endpoint → recibe stripeUrl
//   3. Frontend redirige al usuario a stripeUrl (página de pago de Stripe)
//   4. Stripe, al completar el pago, llama al webhook → orden pasa a PAID
router.post('/orders/:orderNumber/stripe-session', async (req: Request, res: Response) => {
    const { orderNumber } = req.params;

    // Verificar configuración de Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!stripeSecretKey) {
        return res.status(503).json({ error: 'Pasarela de pago no configurada.' });
    }

    try {
        // Buscar la orden
        const order = await prisma.order.findUnique({
            where: { orderNumber },
            include: {
                items: {
                    include: {
                        product: { select: { fulfillmentType: true } },
                    },
                },
            },
        });

        if (!order) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        if (order.status !== 'PENDING_PAYMENT') {
            return res.status(400).json({ error: 'Esta orden ya fue pagada o cancelada.' });
        }

        // Importación dinámica de Stripe para no romper si la clave no está
        const { default: Stripe } = await import('stripe');
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2026-02-25.clover' });

        // Construir line_items desde los items de la orden
        // IMPORTANTE: usamos totalCents/quantity como unit_amount para incluir
        // el costo de personalización (si aplica) en el precio unitario real.
        const lineItems: any[] = order.items.map((item) => ({
            price_data: {
                currency: 'mxn',
                product_data: {
                    name: item.productName + (item.isPersonalized ? ` (✨ ${item.customName} #${item.customNumber})` : ''),
                    images: item.productImageUrl ? [item.productImageUrl] : [],
                },
                // ✅ FIX: totalCents ya incluye personalización × cantidad
                unit_amount: Math.round(item.totalCents / item.quantity),
            },
            quantity: item.quantity,
        }));

        // Agregar envío como line_item adicional si no es gratis
        if (order.shippingCents > 0) {
            lineItems.push({
                price_data: {
                    currency: 'mxn',
                    product_data: {
                        name: order.shippingMethod === 'EXPRESS' ? 'Envío Express (DHL)' : 'Envío Estándar',
                    },
                    unit_amount: order.shippingCents,
                },
                quantity: 1,
            });
        }

        // Log de verificación para debug
        const stripeTotal = lineItems.reduce((sum: number, li: any) =>
            sum + (li.price_data.unit_amount * li.quantity), 0);
        console.log(`💳 Stripe session para orden ${order.orderNumber}: ` +
            `total BD=${order.totalCents} vs total Stripe=${stripeTotal} ` +
            `(match: ${order.totalCents === stripeTotal})`);


        // Crear la sesión de Checkout en Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: lineItems,
            // ✅ Los metadatos permiten al webhook saber qué orden actualizar
            metadata: {
                orderNumber: order.orderNumber,
                orderId:     order.id,
            },
            customer_email: order.email,
            success_url: `${frontendUrl}/confirmation/${order.orderNumber}?paid=1`,
            cancel_url:  `${frontendUrl}/checkout?cancelled=1`,
            expires_at:  Math.floor(Date.now() / 1000) + (30 * 60), // Expira en 30 min
        });

        return res.json({ stripeUrl: session.url });
    } catch (error) {
        console.error('Error creando sesión de Stripe:', error);
        return res.status(500).json({ error: 'Error al conectar con la pasarela de pago.' });
    }
});

export default router;

