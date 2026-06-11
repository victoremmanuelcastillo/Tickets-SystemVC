const express = require('express');
const { pool } = require('../db');
const { authenticate, requireAdmin, requireAgent } = require('../middleware/auth');

const router = express.Router();

/* GET /api/tickets/reports/summary — DEBE ir ANTES de /:id para evitar conflicto */
router.get('/reports/summary', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const [byStatus, byProblem, byUser, byAdmin, byCategory] = await Promise.all([
      pool.query(`SELECT status, COUNT(*) as count FROM tickets GROUP BY status`),
      pool.query(`
        SELECT p.name as problem_name, c.name as category_name, t.status, COUNT(t.id) as count
        FROM tickets t
        JOIN problems p ON t.problem_id = p.id
        JOIN categories c ON t.category_id = c.id
        WHERE t.problem_id IS NOT NULL
        GROUP BY p.name, c.name, t.status ORDER BY count DESC
      `),
      pool.query(`
        SELECT t.user_id, t.user_name, t.area, COUNT(t.id) as total,
               SUM(CASE WHEN t.status = 'resolved'    THEN 1 ELSE 0 END) as resolved,
               SUM(CASE WHEN t.status = 'pending'     THEN 1 ELSE 0 END) as pending,
               SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
        FROM tickets t
        GROUP BY t.user_id, t.user_name, t.area ORDER BY total DESC LIMIT 20
      `),
      pool.query(`
        SELECT assigned_to, assigned_name, status, COUNT(*) as count
        FROM tickets
        WHERE assigned_to IS NOT NULL
        GROUP BY assigned_to, assigned_name, status ORDER BY assigned_name, status
      `),
      pool.query(`
        SELECT c.name as category_name, t.status, COUNT(t.id) as count
        FROM tickets t JOIN categories c ON t.category_id = c.id
        GROUP BY c.name, t.status ORDER BY count DESC
      `),
    ]);

    res.json({
      by_status:   byStatus.rows,
      by_problem:  byProblem.rows,
      by_user:     byUser.rows,
      by_admin:    byAdmin.rows,
      by_category: byCategory.rows,
    });
  } catch (err) {
    next(err);
  }
});

/* GET /api/tickets/reports/user/:userId — tickets detallados de un usuario (admin) */
router.get('/reports/user/:userId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*,
              c.code AS category_code, c.name AS category_name,
              p.code AS problem_code,  p.name AS problem_name,
              p.priority, p.resolution_hours
       FROM tickets t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN problems   p ON t.problem_id  = p.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/* GET /api/tickets/reports/agent/:agentName — tickets detallados de un agente por nombre */
router.get('/reports/agent/:agentName', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const agentName = decodeURIComponent(req.params.agentName);
    const { rows } = await pool.query(
      `SELECT t.*,
              c.code AS category_code, c.name AS category_name,
              p.code AS problem_code,  p.name AS problem_name,
              p.priority, p.resolution_hours
       FROM tickets t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN problems   p ON t.problem_id  = p.id
       WHERE t.assigned_name = $1
          OR (t.assigned_to IS NOT NULL AND t.assigned_to = (
                SELECT id FROM users WHERE name = $1 LIMIT 1
              ))
       ORDER BY t.created_at DESC`,
      [agentName]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/* GET /api/tickets/agents — lista agentes disponibles para reasignar (admin+agente) */
router.get('/agents', authenticate, requireAgent, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, specialty, role FROM users WHERE role IN ('admin','agente') ORDER BY name`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/* GET /api/tickets
   - Admin/Agente: todos (filtrados por specialty si tienen una)
   - Usuario: solo los propios */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const role    = req.user.role;
    const isStaff = role === 'admin' || role === 'agente';

    if (!isStaff) {
      const { rows } = await pool.query(
        `SELECT t.*,
                c.code AS category_code, c.name AS category_name,
                p.code AS problem_code,  p.name AS problem_name,
                p.priority, p.resolution_hours
         FROM tickets t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN problems   p ON t.problem_id  = p.id
         WHERE t.user_id = $1
         ORDER BY t.created_at DESC`,
        [req.user.id]
      );
      return res.json(rows);
    }

    // El filtro SPECIALTY_CAT mapea por código de categoría porque la tabla
    // no tiene foreign key directa entre users.specialty y categories.
    const SPECIALTY_CAT = {
      'Infraestructura':    '1.1',
      'Soporte Técnico':    '1.2',
      'Accesos':            '1.3',
      'Correo Electrónico': '1.4',
      'Consulta General':   '1.5',
    };

    const forceAll  = req.query.all === '1';
    const specialty = req.user.specialty;
    const { user_id, problem_id, status, assigned_to } = req.query;

    const conditions = [];
    const params     = [];

    if (specialty && !forceAll && SPECIALTY_CAT[specialty]) {
      params.push(SPECIALTY_CAT[specialty]);
      conditions.push(`c.code = $${params.length}`);
    }
    if (user_id)     { params.push(user_id);     conditions.push(`t.user_id = $${params.length}`); }
    if (problem_id)  { params.push(problem_id);  conditions.push(`t.problem_id = $${params.length}`); }
    if (status)      { params.push(status);      conditions.push(`t.status = $${params.length}`); }
    if (assigned_to) { params.push(assigned_to); conditions.push(`t.assigned_to = $${params.length}`); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT t.*,
              c.code AS category_code, c.name AS category_name,
              p.code AS problem_code,  p.name AS problem_name,
              p.priority, p.resolution_hours,
              CASE p.priority
                WHEN 'Crítica'    THEN 1
                WHEN 'Alta'       THEN 2
                WHEN 'Media Alta' THEN 3
                WHEN 'Media'      THEN 4
                WHEN 'Baja'       THEN 5
                ELSE 6
              END AS priority_order,
              CASE t.status
                WHEN 'in_progress' THEN 1
                WHEN 'pending'     THEN 2
                WHEN 'resolved'    THEN 3
                ELSE 4
              END AS status_order
       FROM tickets t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN problems   p ON t.problem_id  = p.id
       ${where}
       ORDER BY status_order ASC, priority_order ASC, t.created_at ASC`,
      params
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/* POST /api/tickets
   - Usuarios: crean ticket propio
   - Admin/Agente: pueden especificar target_user_id para crear ticket a nombre de otro usuario */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { category_id, problem_id, additional_info, other_description, target_user_id } = req.body;
    const role    = req.user.role;
    const isStaff = role === 'admin' || role === 'agente';

    let userId   = req.user.id;
    let userName = req.user.name;
    let userArea = req.user.area;

    if (isStaff && target_user_id) {
      const { rows: targetUserRows } = await pool.query(
        'SELECT id, name, area FROM users WHERE id=$1',
        [target_user_id]
      );
      if (targetUserRows.length === 0) return res.status(400).json({ error: 'Usuario no encontrado' });
      userId   = targetUserRows[0].id;
      userName = targetUserRows[0].name;
      userArea = targetUserRows[0].area;
    }

    const { rows } = await pool.query(
      `INSERT INTO tickets (user_id, user_name, area, category_id, problem_id, additional_info, other_description)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, userName, userArea, category_id || null, problem_id || null, additional_info || null, other_description || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

/* GET /api/tickets/:id/position */
router.get('/:id/position', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.status, t.created_at, p.priority
       FROM tickets t LEFT JOIN problems p ON t.problem_id = p.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    const ticket = rows[0];
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (ticket.status === 'resolved')
      return res.json({ position: 0, ahead: 0, status: 'resolved' });

    const PRIORITY_ORDER = { 'Crítica': 1, 'Alta': 2, 'Media Alta': 3, 'Media': 4, 'Baja': 5 };
    const myPriority = PRIORITY_ORDER[ticket.priority] || 5;

    const { rows: otherTickets } = await pool.query(
      `SELECT t.id, p.priority, t.created_at, t.status
       FROM tickets t LEFT JOIN problems p ON t.problem_id = p.id
       WHERE t.status IN ('pending','in_progress') AND t.id != $1`,
      [req.params.id]
    );

    const aheadCount = otherTickets.filter(otherTicket => {
      if (otherTicket.status === 'in_progress') return true;
      const theirPriority = PRIORITY_ORDER[otherTicket.priority] || 5;
      if (theirPriority < myPriority) return true;
      if (theirPriority === myPriority && new Date(otherTicket.created_at) < new Date(ticket.created_at)) return true;
      return false;
    }).length;

    res.json({ position: aheadCount + 1, ahead: aheadCount, status: ticket.status });
  } catch (err) { next(err); }
});

/* PATCH /api/tickets/:id/status  (admin + agente) */
router.patch('/:id/status', authenticate, requireAgent, async (req, res, next) => {
  try {
    let { status, assigned_to } = req.body;
    const updates = [];
    const params  = [];
    let idx = 1;

    if (status !== undefined) {
      updates.push(`status=$${idx++}`);
      params.push(status);

      // Auto-asignar al agente que marca in_progress si no viene assigned_to explícito
      if (status === 'in_progress' && assigned_to === undefined) {
        assigned_to = req.user.id;
      }
    }

    if (assigned_to !== undefined) {
      if (assigned_to === null) {
        updates.push('assigned_to=NULL', 'assigned_name=NULL');
      } else {
        const { rows: agentRows } = await pool.query(
          `SELECT name FROM users WHERE id=$1 AND role IN ('admin','agente')`,
          [assigned_to]
        );
        if (agentRows.length === 0) return res.status(400).json({ error: 'Agente no encontrado' });
        // Guardamos assigned_name además de assigned_to para preservar el nombre
        // si el agente es eliminado del sistema en el futuro.
        updates.push(`assigned_to=$${idx++}`, `assigned_name=$${idx++}`);
        params.push(assigned_to, agentRows[0].name);
      }
    }

    if (updates.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });

    params.push(req.params.id);
    await pool.query(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id=$${idx}`,
      params
    );

    const { rows } = await pool.query(
      `SELECT t.*,
              c.code AS category_code, c.name AS category_name,
              p.code AS problem_code,  p.name AS problem_name,
              p.priority, p.resolution_hours
       FROM tickets t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN problems   p ON t.problem_id  = p.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

/* GET /api/tickets/:id/notes */
router.get('/:id/notes', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ticket_notes WHERE ticket_id=$1 ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/* POST /api/tickets/:id/notes (admin + agente, solo si ticket no está resuelto) */
router.post('/:id/notes', authenticate, requireAgent, async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note?.trim()) return res.status(400).json({ error: 'La nota no puede estar vacía' });

    const { rows: ticketRows } = await pool.query(
      'SELECT status FROM tickets WHERE id=$1',
      [req.params.id]
    );
    if (!ticketRows[0]) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (ticketRows[0].status === 'resolved')
      return res.status(400).json({ error: 'No se pueden agregar notas a tickets resueltos' });

    const { rows } = await pool.query(
      `INSERT INTO ticket_notes (ticket_id, admin_id, admin_name, note)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, req.user.id, req.user.name, note.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
