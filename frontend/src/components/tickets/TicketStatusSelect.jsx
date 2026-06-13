// Selector de estado de ticket reutilizable. Intercepta 'resolved' para pedir confirmación.
export function TicketStatusSelect({ currentStatus, isUpdating, onChangeStatus, ringColorClass = 'focus:ring-blue-400' }) {
  return (
    <select
      value={currentStatus}
      onChange={e => onChangeStatus(e.target.value)}
      disabled={isUpdating}
      className={`text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5
        text-slate-700 focus:outline-none focus:ring-2 ${ringColorClass} disabled:opacity-50 transition`}
    >
      <option value="pending">Pendiente</option>
      <option value="in_progress">En proceso</option>
      <option value="resolved">Resuelto</option>
    </select>
  );
}
