// src/middlewares/requireAuth.ts
import { type Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth.js';

/**
 * Middleware que verifica el JWT en el header Authorization.
 * Si es válido, inyecta el payload decodificado en `req.user`.
 * Si no hay token o es inválido, devuelve 401/403.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }

  // Inyectar usuario decodificado en req para uso en handlers
  req.user = payload;
  next();
};
