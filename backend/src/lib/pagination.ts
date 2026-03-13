// backend/src/lib/pagination.ts
export type Cursor = { createdAt: string; id: string };

export function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c), 'utf8').toString('base64url');
}

export function decodeCursor(s?: string | null): Cursor | null {
  if (!s) return null;
  try {
    const obj = JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
    if (typeof obj?.createdAt === 'string' && typeof obj?.id === 'string') return obj;
    return null;
  } catch {
    return null;
  }
}
