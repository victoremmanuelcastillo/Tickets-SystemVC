const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token requerido' });

  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  next();
};

// Admins y agentes pueden pasar
const requireAgent = (req, res, next) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'agente')
    return res.status(403).json({ error: 'Acceso solo para agentes y administradores' });
  next();
};

module.exports = { authenticate, requireAdmin, requireAgent };
