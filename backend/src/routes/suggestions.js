const express = require('express');
const { pool } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateRequiredFields } = require('../helpers/validation');

const router = express.Router();

/* GET /api/suggestions?problem_id=X */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { problem_id } = req.query;
    const params = problem_id ? [problem_id] : [];
    const where  = problem_id ? 'WHERE s.problem_id = $1' : '';
    const { rows } = await pool.query(
      `SELECT s.*, p.code AS problem_code, p.name AS problem_name,
              c.code AS category_code, c.name AS category_name
       FROM suggestions s
       JOIN problems   p ON s.problem_id  = p.id
       JOIN categories c ON p.category_id = c.id
       ${where}
       ORDER BY s.updated_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/* POST /api/suggestions  (admin) */
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { problem_id, content } = validateRequiredFields(req.body, ['problem_id', 'content']);
    const { rows } = await pool.query(
      'INSERT INTO suggestions (problem_id, content) VALUES ($1, $2) RETURNING *',
      [problem_id, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

/* PUT /api/suggestions/:id  (admin) */
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { content } = validateRequiredFields(req.body, ['content']);
    const { rows } = await pool.query(
      'UPDATE suggestions SET content=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [content, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Sugerencia no encontrada' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

/* DELETE /api/suggestions/:id  (admin) */
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM suggestions WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
