// src/routes/admin.routes.ts
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { generateToken } from '../lib/auth.js';
import { env } from '../lib/env.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Contraseña requerida' });
  }

  try {
    const isValid = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);

    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = generateToken({ sub: 'admin', role: 'admin' });
    res.json({ token, message: 'Login exitoso' });
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
