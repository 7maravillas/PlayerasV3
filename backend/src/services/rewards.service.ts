// src/services/rewards.service.ts
import { prisma } from '../lib/prisma.js';

// ── Config desde DB (singleton, defaults si no existe) ──────
export async function getRewardConfig() {
  const config = await prisma.rewardConfig.upsert({
    where: { id: 1 },
    create: {},
    update: {},
  });
  return config;
}

// ── Ganar puntos al completar pago ──────────────────────────
export async function earnPoints(
  userId: string,
  orderId: string,
  orderItems: { productId: string | null; unitPriceCents: number; quantity: number }[],
  description: string,
): Promise<number> {
  const config = await getRewardConfig();
  if (!config.enabled) return 0;

  // Obtener los flags earnPoints de cada producto
  const productIds = orderItems
    .map((i) => i.productId)
    .filter(Boolean) as string[];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, earnPoints: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p.earnPoints]));

  // Solo contar items de productos con earnPoints = true
  const eligibleCents = orderItems.reduce((sum, item) => {
    if (!item.productId) return sum;
    if (productMap.get(item.productId) === false) return sum;
    return sum + item.unitPriceCents * item.quantity;
  }, 0);

  const earned = Math.floor(eligibleCents / config.centsPerPoint);
  if (earned <= 0) return 0;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { rewardPoints: { increment: earned } },
    }),
    prisma.rewardTransaction.create({
      data: { userId, type: 'EARN', points: earned, description, orderId },
    }),
  ]);

  return earned;
}

// ── Consultar balance ────────────────────────────────────────
export async function getBalance(userId: string) {
  const [user, config] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { rewardPoints: true } }),
    getRewardConfig(),
  ]);
  const points = user?.rewardPoints ?? 0;
  return {
    points,
    valueCents: points * config.pointValueCents,
    goalPoints: config.goalPoints,
    centsPerPoint: config.centsPerPoint,
    pointValueCents: config.pointValueCents,
    enabled: config.enabled,
  };
}

// ── Historial de transacciones ───────────────────────────────
export async function getHistory(userId: string) {
  return prisma.rewardTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

// ── Validar y calcular descuento por canje ───────────────────
// Devuelve cuántos centavos de descuento aplican según:
//   - saldo del usuario
//   - puntos solicitados
//   - items elegibles (redeemMaxQty por producto)
export async function calculateRedeemDiscount(
  userId: string,
  pointsToRedeem: number,
  orderItems: { productId: string | null; unitPriceCents: number; quantity: number }[],
): Promise<{ discountCents: number; pointsUsed: number; error?: string }> {
  if (pointsToRedeem <= 0) return { discountCents: 0, pointsUsed: 0 };

  const config = await getRewardConfig();
  if (!config.enabled) {
    return { discountCents: 0, pointsUsed: 0, error: 'El programa de recompensas está desactivado' };
  }

  const { points: balance } = await getBalance(userId);
  if (balance < pointsToRedeem) {
    return { discountCents: 0, pointsUsed: 0, error: 'Saldo de puntos insuficiente' };
  }

  const productIds = orderItems.map((i) => i.productId).filter(Boolean) as string[];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, redeemMaxQty: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p.redeemMaxQty]));

  // Calcular total de centavos elegibles para descuento
  const eligibleCents = orderItems.reduce((sum, item) => {
    if (!item.productId) return sum;
    const maxQty = productMap.get(item.productId);
    if (maxQty === 0) return sum; // no canjeable
    const eligibleQty = maxQty == null ? item.quantity : Math.min(item.quantity, maxQty);
    return sum + item.unitPriceCents * eligibleQty;
  }, 0);

  if (eligibleCents <= 0) {
    return { discountCents: 0, pointsUsed: 0, error: 'No hay productos elegibles para canjear puntos' };
  }

  // El descuento no puede superar ni el total elegible ni los puntos solicitados
  const maxDiscountCents = Math.min(pointsToRedeem * config.pointValueCents, eligibleCents);
  const pointsUsed = Math.ceil(maxDiscountCents / config.pointValueCents);

  return { discountCents: maxDiscountCents, pointsUsed };
}

// ── Aplicar canje (descontar puntos del saldo) ───────────────
export async function applyRedeem(
  userId: string,
  pointsUsed: number,
  orderId: string,
  description: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { rewardPoints: { decrement: pointsUsed } },
    }),
    prisma.rewardTransaction.create({
      data: { userId, type: 'REDEEM', points: -pointsUsed, description, orderId },
    }),
  ]);
}
