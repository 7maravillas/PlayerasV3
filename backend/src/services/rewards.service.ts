// src/services/rewards.service.ts
import { randomBytes } from 'crypto';
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

  const earned = Math.round(eligibleCents / config.centsPerPoint);
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

// ── Canjear puntos por jersey gratis (genera cupón de $550) ─────
export async function redeemForFreeJersey(
  userId: string,
): Promise<{ couponCode: string; expiresAt: Date }> {
  const config = await getRewardConfig();
  if (!config.enabled) {
    throw new Error('El programa de recompensas está desactivado');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { rewardPoints: true },
  });
  if (!user) throw new Error('Usuario no encontrado');
  if (user.rewardPoints < config.goalPoints) {
    throw new Error(`Necesitas ${config.goalPoints} puntos. Tienes ${user.rewardPoints}.`);
  }

  // Generar código único
  const code = `JERSEY-FREE-${randomBytes(4).toString('hex').toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 días

  await prisma.$transaction(async (tx) => {
    // Crear cupón de $550 fijo
    await tx.coupon.create({
      data: {
        code,
        description: '¡Jersey gratis! Descuento de $550 por acumular puntos',
        discountPercent: 0,
        discountCents: 55000, // $550 MXN en centavos
        usageLimit: 1,
        expiresAt,
        active: true,
      },
    });

    // Crear registro de canje
    await tx.rewardRedemption.create({
      data: { userId, couponCode: code, pointsUsed: config.goalPoints, expiresAt },
    });

    // Descontar puntos
    await tx.user.update({
      where: { id: userId },
      data: { rewardPoints: { decrement: config.goalPoints } },
    });

    // Registrar transacción
    await tx.rewardTransaction.create({
      data: {
        userId,
        type: 'REDEEM',
        points: -config.goalPoints,
        description: 'Canje por jersey gratis',
      },
    });
  });

  return { couponCode: code, expiresAt };
}

// ── Listar canjes (admin) ─────────────────────────────────────
export async function getRedemptions() {
  return prisma.rewardRedemption.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
