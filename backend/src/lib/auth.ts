// src/lib/auth.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from './env.js';


const SALT_ROUNDS = 12;

// Generar hash de la contraseña (una sola vez)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verificar contraseña
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generar JWT con payload personalizado
export function generateToken(payload: { sub: string; role: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

// Verificar token y devolver payload decodificado
export function verifyToken(token: string): { sub: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string };
    return decoded;
  } catch {
    return null;
  }
}
