const express   = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { pool }  = require('../db');
const { authenticate, requireAdmin }    = require('../middleware/auth');
const { validateRequiredFields }        = require('../helpers/validation');

const router = express.Router();

// Máx 10 intentos de login por IP en 15 minutos para dificultar fuerza bruta
const loginRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

/* POST /api/auth/login */
router.post('/login', loginRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = validateRequiredFields(req.body, ['email', 'password']);
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, area: user.area, specialty: user.specialty, is_primary_admin: user.is_primary_admin },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, area: user.area, specialty: user.specialty, is_primary_admin: user.is_primary_admin }
    });
  } catch (err) {
    next(err);
  }
});

/* POST /api/auth/register  – solo admin puede crear usuarios */
router.post('/register', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = validateRequiredFields(req.body, ['email', 'password', 'name']);
    const { email, password, name, role = 'usuario', area, specialty } = body;

    if (!['usuario', 'agente', 'admin'].includes(role))
      return res.status(400).json({ error: 'Rol inválido' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, area, specialty)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, role, area, specialty, is_primary_admin, created_at`,
      [email, hash, name, role, area, specialty || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Ese email ya está registrado' });
    next(err);
  }
});

/* PATCH /api/auth/users/:id  – actualizar specialty/role */
router.patch('/users/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id);
    const { specialty, role, is_primary_admin } = req.body;

    if ((role !== undefined || is_primary_admin !== undefined) && !req.user.is_primary_admin)
      return res.status(403).json({ error: 'Solo el admin principal puede cambiar roles' });

    if (targetId === req.user.id && role && role !== 'admin')
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });

    if (role !== undefined && !['usuario', 'agente', 'admin'].includes(role))
      return res.status(400).json({ error: 'Rol inválido' });

    const fields = [];
    const values = [];
    let idx = 1;

    if (specialty !== undefined) { fields.push(`specialty=$${idx++}`); values.push(specialty || null); }
    if (role !== undefined)      { fields.push(`role=$${idx++}`);      values.push(role); }
    if (is_primary_admin !== undefined && req.user.is_primary_admin) {
      fields.push(`is_primary_admin=$${idx++}`);
      values.push(is_primary_admin);
    }

    if (fields.length === 0)
      return res.status(400).json({ error: 'Nada que actualizar' });

    values.push(targetId);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id=$${idx} RETURNING id, email, name, role, area, specialty, is_primary_admin, created_at`,
      values
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/* GET /api/auth/users  – listar usuarios (admin) */
router.get('/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, area, specialty, is_primary_admin, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/* GET /api/auth/users/search?q= — buscar usuarios por nombre/email (admin+agente para crear tickets) */
router.get('/users/search', authenticate, async (req, res, next) => {
  const role = req.user.role;
  if (role !== 'admin' && role !== 'agente')
    return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const q = `%${(req.query.q || '').toLowerCase()}%`;
    const { rows } = await pool.query(
      `SELECT id, name, email, area FROM users WHERE role = 'usuario' AND (LOWER(name) LIKE $1 OR LOWER(email) LIKE $1) LIMIT 10`,
      [q]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/* DELETE /api/auth/users/:id  – eliminar usuario (admin, no puede eliminarse a sí mismo) */
router.delete('/users/:id', authenticate, requireAdmin, async (req, res, next) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
