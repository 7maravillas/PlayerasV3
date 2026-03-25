// backend/src/lib/period.ts
// Helper para convertir un string de período a Date de inicio.
// '7d' → hace 7 días, '30d' → hace 30 días, 'all' → null (sin filtro)

export type Period = '7d' | '30d' | '90d' | '12m' | 'all';

export function periodToDate(period: string): Date | null {
  const now = Date.now();
  switch (period) {
    case '7d':  return new Date(now - 7   * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now - 30  * 24 * 60 * 60 * 1000);
    case '90d': return new Date(now - 90  * 24 * 60 * 60 * 1000);
    case '12m': return new Date(now - 365 * 24 * 60 * 60 * 1000);
    default:    return null; // 'all' o cualquier otro valor = sin filtro
  }
}

/** Granularidad por defecto según el período */
export function defaultGranularity(period: string): string {
  if (period === '7d' || period === '30d') return 'day';
  if (period === '90d') return 'week';
  return 'month';
}
