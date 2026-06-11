require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { initDb } = require('./db');

const authRoutes        = require('./routes/auth');
const { categoriesRouter, problemsRouter } = require('./routes/catalog');
const suggestionsRoutes = require('./routes/suggestions');
const ticketsRoutes     = require('./routes/tickets');
const aiRoutes          = require('./routes/ai');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',        authRoutes);
app.use('/api/categories',  categoriesRouter);
app.use('/api/problems',    problemsRouter);
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/tickets',     ticketsRoutes);
app.use('/api/ai',          aiRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Captura cualquier error no manejado y responde con formato consistente.
// Solo loguea el stack en errores 500 — las validaciones (4xx) no ensucian los logs.
function globalErrorHandler(error, req, res, next) {
  const statusCode   = error.statusCode || 500;
  const errorMessage = statusCode === 500 ? 'Error interno del servidor' : error.message;
  if (statusCode === 500) console.error('[ERROR]', error);
  res.status(statusCode).json({ error: errorMessage });
}

app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => app.listen(PORT, () => console.log(`🚀 API en http://localhost:${PORT}`)))
  .catch(err => { console.error('Error DB:', err); process.exit(1); });
