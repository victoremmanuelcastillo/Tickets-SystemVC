const express = require('express');
const { pool } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateRequiredFields } = require('../helpers/validation');

// --- Categorías ---

const categoriesRouter = express.Router();

categoriesRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY id');
    res.json(rows);
  } catch (err) { next(err); }
});

categoriesRouter.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { code, name } = validateRequiredFields(req.body, ['code', 'name']);
    const { rows } = await pool.query(
      'INSERT INTO categories (code, name) VALUES ($1, $2) RETURNING *',
      [code, name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Ese código ya existe' });
    next(err);
  }
});

categoriesRouter.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { code, name } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;
    if (code !== undefined) { fields.push(`code=$${idx++}`); values.push(code.trim()); }
    if (name !== undefined) { fields.push(`name=$${idx++}`); values.push(name.trim()); }
    if (fields.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`,
      values
    );
    if (!rows[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

categoriesRouter.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM suggestions WHERE problem_id IN (SELECT id FROM problems WHERE category_id=$1)`,
      [req.params.id]
    );
    await client.query(
      `DELETE FROM ticket_notes WHERE ticket_id IN (SELECT id FROM tickets WHERE category_id=$1)`,
      [req.params.id]
    );
    // Nullificar tickets de esta categoría en lugar de eliminarlos
    await client.query(
      `UPDATE tickets SET category_id=NULL, problem_id=NULL WHERE category_id=$1`,
      [req.params.id]
    );
    await client.query('DELETE FROM problems WHERE category_id=$1', [req.params.id]);
    await client.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// --- Problemas ---

const problemsRouter = express.Router();

problemsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { category_id } = req.query;
    const params = category_id ? [category_id] : [];
    const where  = category_id ? 'WHERE p.category_id = $1' : '';
    const { rows } = await pool.query(
      `SELECT p.*, c.code AS category_code, c.name AS category_name
       FROM problems p JOIN categories c ON p.category_id = c.id
       ${where} ORDER BY p.id`,
      params
    );
    res.json(rows);
  } catch (err) { next(err); }
});

problemsRouter.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = validateRequiredFields(req.body, ['category_id', 'code', 'name', 'priority', 'resolution_hours']);
    const { category_id, code, name, priority, resolution_hours, description } = body;
    const { rows } = await pool.query(
      `INSERT INTO problems (category_id, code, name, priority, resolution_hours, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [category_id, code, name, priority, parseInt(resolution_hours), description || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Ese código ya existe' });
    next(err);
  }
});

problemsRouter.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { code, name, priority, resolution_hours, description } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;
    if (code !== undefined)             { fields.push(`code=$${idx++}`);             values.push(code.trim()); }
    if (name !== undefined)             { fields.push(`name=$${idx++}`);             values.push(name.trim()); }
    if (priority !== undefined)         { fields.push(`priority=$${idx++}`);         values.push(priority); }
    if (resolution_hours !== undefined) { fields.push(`resolution_hours=$${idx++}`); values.push(parseInt(resolution_hours)); }
    if (description !== undefined)      { fields.push(`description=$${idx++}`);      values.push(description); }
    if (fields.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE problems SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`,
      values
    );
    if (!rows[0]) return res.status(404).json({ error: 'Problema no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

problemsRouter.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM problems WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = { categoriesRouter, problemsRouter };
