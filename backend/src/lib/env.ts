// backend/src/lib/env.ts
import { z } from 'zod';

// Definición del esquema
const envSchema = z.object({
  // Base de datos
  DATABASE_URL: z.string().url().nonempty('DATABASE_URL es obligatoria'),

  // Clave para firmar JWTs (seguridad)
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET debe tener al menos 32 caracteres')
    .nonempty(),

  // Hash bcrypt del password de admin (generado con: node -e "require('bcrypt').hash('TU_PASSWORD',12).then(h=>console.log(h))")
  ADMIN_PASSWORD_HASH: z
    .string()
    .min(50, 'ADMIN_PASSWORD_HASH debe ser un hash bcrypt válido'),

  // Puerto del servidor
  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT debe ser un número válido')
    .optional()
    .default('4000')
    .transform((val) => Number(val)),

  // Entorno (desarrollo, producción, etc.)
  NODE_ENV: z
    .enum(['development', 'production', 'test'] as const)
    .default('development'),

  // Dominios permitidos para CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});


export const env = envSchema.parse(process.env);
