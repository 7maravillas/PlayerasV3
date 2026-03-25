// src/services/coupon.service.ts
import { prisma } from '../lib/prisma.js';

interface ValidateInput {
  code: string;
  subtotalCents: number;
  email: string;
  userId?: string | null;
}

interface ValidateResult {
  valid: boolean;
  discountCents: number;
  discountPercent: number;
  description: string;
  error?: string;
  couponId?: string;
}

export async function validateCoupon(input: ValidateInput): Promise<ValidateResult> {
  const { code, subtotalCents, email } = input;
  const EMPTY: ValidateResult = { valid: false, discountCents: 0, discountPercent: 0, description: '' };

  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!coupon || !coupon.active) {
    return { ...EMPTY, error: 'Cupón inválido' };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ...EMPTY, error: 'El cupón aún no está vigente' };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { ...EMPTY, error: 'El cupón ha expirado' };
  }
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { ...EMPTY, error: 'El cupón ha alcanzado su límite de usos' };
  }
  if (subtotalCents < coupon.minPurchaseCents) {
    const minPesos = (coupon.minPurchaseCents / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    return { ...EMPTY, error: `Compra mínima requerida: ${minPesos}` };
  }

  if (coupon.firstPurchaseOnly) {
    const prevOrders = await prisma.order.count({
      where: {
        email: email.toLowerCase().trim(),
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      },
    });
    if (prevOrders > 0) {
      return { ...EMPTY, error: 'Este cupón solo aplica en la primera compra' };
    }
  }

  const discountCents = Math.floor(subtotalCents * coupon.discountPercent / 100);

  return {
    valid: true,
    discountCents,
    discountPercent: coupon.discountPercent,
    description: coupon.description || `${coupon.discountPercent}% de descuento`,
    couponId: coupon.id,
  };
}

export async function recordCouponUsage(
  couponCode: string,
  orderId: string,
  email: string,
  discountCents: number,
  userId?: string | null,
): Promise<void> {
  const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
  if (!coupon) return;

  await prisma.$transaction([
    prisma.couponUsage.create({
      data: { couponId: coupon.id, orderId, email, discountCents, userId: userId ?? null },
    }),
    prisma.coupon.update({
      where: { id: coupon.id },
      data: { usageCount: { increment: 1 } },
    }),
  ]);
}
