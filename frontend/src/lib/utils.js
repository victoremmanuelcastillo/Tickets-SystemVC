// Funciones puras reutilizables.
// Sin estado, sin side effects — mismo input siempre produce mismo output.

/**
 * Formatea una fecha ISO a texto legible en español mexicano.
 * Ejemplo: "15 jun 2024, 10:30"
 *
 * @param {string} isoString — fecha en formato ISO 8601
 * @returns {string}
 */
export const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/**
 * Devuelve el tiempo transcurrido desde una fecha de forma legible.
 * Ejemplos: "ahora mismo", "hace 5 min", "hace 2h", "hace 3 días"
 * Para fechas muy antiguas (> 30 días) devuelve la fecha formateada.
 *
 * @param {string} isoString
 * @returns {string}
 */
export const timeAgo = (isoString) => {
  const elapsedMs      = Date.now() - new Date(isoString).getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);
  const elapsedHours   = Math.floor(elapsedMs / 3_600_000);
  const elapsedDays    = Math.floor(elapsedMs / 86_400_000);

  if (elapsedMinutes < 1)  return 'ahora mismo';
  if (elapsedMinutes < 60) return `hace ${elapsedMinutes} min`;
  if (elapsedHours   < 24) return `hace ${elapsedHours}h`;
  if (elapsedDays    < 30) return `hace ${elapsedDays} día${elapsedDays === 1 ? '' : 's'}`;
  return formatDate(isoString);
};

/**
 * Determina si un ticket está vencido.
 * Un ticket se considera vencido cuando lleva más del doble de su
 * tiempo de resolución esperado sin haber sido resuelto.
 *
 * @param {Object} ticket — debe tener status, created_at y resolution_hours
 * @returns {boolean}
 */
export const isTicketOverdue = (ticket) => {
  if (ticket.status === 'resolved' || !ticket.resolution_hours) return false;

  const expectedMs = ticket.resolution_hours * 3_600_000;
  const elapsedMs  = Date.now() - new Date(ticket.created_at).getTime();

  return elapsedMs > expectedMs * 2;
};
