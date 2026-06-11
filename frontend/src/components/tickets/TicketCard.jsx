import { useState } from 'react';
import { Clock, CheckCircle, Circle, ChevronDown, Flame, ArrowUp, Minus, ArrowDown, User, Calendar, AlertTriangle } from 'lucide-react';
import { PRIORITY_STYLE, STATUS_CONFIG } from '../../lib/constants.js';
import { formatDate, timeAgo, isTicketOverdue } from '../../lib/utils.js';
import { NotesPanel } from './NotesPanel.jsx';
import { AssignPanel } from './AssignPanel.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';

// Íconos de lucide por prioridad — no viven en constants.js
const PRIORITY_ICON = {
  'Crítica':    Flame,
  'Alta':       ArrowUp,
  'Media Alta': Minus,
  'Media':      Minus,
  'Baja':       ArrowDown,
};

// Íconos de lucide por estado — no viven en constants.js
const STATUS_ICON = {
  pending:     Circle,
  in_progress: Clock,
  resolved:    CheckCircle,
};

// Diferencias visuales entre admin y agente
const VARIANT_STYLES = {
  admin: {
    assignedNameColor: 'text-blue-600',
    selectRingColor:   'focus:ring-blue-400',
    assignLabel:       'Asignar a agente',
  },
  agent: {
    assignedNameColor: 'text-emerald-600',
    selectRingColor:   'focus:ring-emerald-400',
    assignLabel:       'Reasignar a',
  },
};

/**
 * Card de ticket unificado para vistas de admin y agente.
 *
 * @param {Object}   ticket          — datos completos del ticket
 * @param {number|null} position     — posición en la cola (solo admin, null en agente)
 * @param {number|null} updatingId   — id del ticket que está siendo actualizado (spinner)
 * @param {Function} onChangeStatus  — (ticketId, newStatus) => void
 * @param {Function} onToggleExpand  — (ticketId) => void
 * @param {number|null} expandedId   — id del ticket actualmente expandido
 * @param {Object}   session         — sesión del usuario { token }
 * @param {Array}    agents          — lista de agentes disponibles para asignar
 * @param {Function} onAssigned      — (updatedTicket) => void tras asignación exitosa
 * @param {'admin'|'agent'} variant  — controla colores y funcionalidades opcionales
 */
export function TicketCard({
  ticket,
  position = null,
  updatingId,
  onChangeStatus,
  onToggleExpand,
  expandedId,
  session,
  agents,
  onAssigned,
  variant = 'admin',
}) {
  const [pendingStatus, setPendingStatus] = useState(null);

  const isExpanded  = expandedId === ticket.id;
  const isResolved  = ticket.status === 'resolved';
  const isUpdating  = updatingId === ticket.id;
  const isOverdue   = isTicketOverdue(ticket);

  const statusCfg  = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.pending;
  const StatusIcon = STATUS_ICON[ticket.status]   || STATUS_ICON.pending;
  const priCfg     = PRIORITY_STYLE[ticket.priority] || PRIORITY_STYLE['Baja'];
  const PriorityIconComponent = PRIORITY_ICON[ticket.priority];
  const styles     = VARIANT_STYLES[variant];

  const isAdmin = variant === 'admin';

  const handleStatusSelectChange = (newStatus) => {
    if (newStatus === 'resolved') {
      setPendingStatus('resolved');
    } else {
      onChangeStatus(ticket.id, newStatus);
    }
  };

  const handleConfirmResolve = () => {
    onChangeStatus(ticket.id, 'resolved');
    setPendingStatus(null);
  };

  return (
    <>
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
      isOverdue ? 'border-orange-400 shadow-orange-100' : 'border-slate-200'
    }`}>

      {/* ── Barra de color por prioridad ── */}
      <div className={`h-1 w-full ${priCfg.bar}`} />

      <div className="p-4">

        {/* ── Fila superior: posición/ID + info + botón expandir ── */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            {position != null && (
              <span className="text-[10px] font-bold text-slate-400 uppercase">#{position}</span>
            )}
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
              T-{ticket.id}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{ticket.user_name}</p>
            <p className="text-slate-400 text-xs truncate">{ticket.area || '—'}</p>
            {ticket.category_name ? (
              <>
                <p className="text-xs text-slate-500 truncate mt-1">
                  {ticket.category_code} {ticket.category_name}
                </p>
                <p className="text-sm font-medium text-slate-700 truncate">
                  {ticket.problem_code} {ticket.problem_name}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-amber-700 truncate mt-1">Categoría: Otro</p>
            )}
          </div>

          <button
            onClick={() => onToggleExpand(ticket.id)}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition shrink-0"
          >
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* ── Fila de fecha, timeAgo, agente asignado e indicador de urgencia ── */}
        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 flex-wrap">
          <Calendar className="w-3 h-3" />
          {formatDate(ticket.created_at)}
          <span className="text-slate-300">·</span>
          <span className="font-medium">{timeAgo(ticket.created_at)}</span>
          {ticket.assigned_name && (
            <>
              <span className="text-slate-300">·</span>
              <User className="w-3 h-3" />
              <span className={`${styles.assignedNameColor} font-semibold`}>
                {ticket.assigned_name}
              </span>
            </>
          )}
          {isOverdue && (
            <>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-0.5 text-orange-600 font-bold">
                <AlertTriangle className="w-3 h-3" /> Vencido
              </span>
            </>
          )}
        </div>

        {/* ── Badges de prioridad/estado + selector de estado ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {ticket.priority && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${priCfg.badge}`}>
                {isAdmin && PriorityIconComponent && (
                  <PriorityIconComponent className="w-3 h-3" />
                )}
                {ticket.priority}
              </span>
            )}
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${statusCfg.style}`}>
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </span>
            {isAdmin && ticket.resolution_hours && (
              <span className="text-xs text-slate-400 flex items-center gap-0.5">
                <Clock className="w-3 h-3" />{ticket.resolution_hours}h
              </span>
            )}
          </div>

          <select
            value={ticket.status}
            onChange={e => handleStatusSelectChange(e.target.value)}
            disabled={isUpdating}
            className={`text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5
              text-slate-700 focus:outline-none focus:ring-2 ${styles.selectRingColor} disabled:opacity-50`}
          >
            <option value="pending">Pendiente</option>
            <option value="in_progress">En proceso</option>
            <option value="resolved">Resuelto</option>
          </select>
        </div>
      </div>

      {/* ── Panel expandido: descripción + asignación + notas ── */}
      {isExpanded && (
        <>
          <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-2">

            {/* Descripción del usuario */}
            {ticket.additional_info && (
              <>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Descripción del usuario
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{ticket.additional_info}</p>
              </>
            )}

            {/* Descripción libre para categoría Otro */}
            {ticket.other_description && (
              <>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Descripción libre (categoría Otro)
                </p>
                <p className="text-sm text-amber-800 leading-relaxed bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {ticket.other_description}
                </p>
              </>
            )}

            {!ticket.additional_info && !ticket.other_description && (
              <p className="text-sm italic text-slate-400">Sin información adicional</p>
            )}

            {/* Panel de asignación */}
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {styles.assignLabel}
              </p>
              <AssignPanel
                token={session.token}
                ticket={ticket}
                agents={agents}
                onAssigned={onAssigned}
                variant={variant}
              />
            </div>
          </div>

          {/* Panel de notas internas */}
          <NotesPanel
            token={session.token}
            ticketId={ticket.id}
            isResolved={isResolved}
            variant={variant}
          />
        </>
      )}
    </div>

    {/* ── Confirmación al resolver ── */}
    {pendingStatus === 'resolved' && (
      <ConfirmDialog
        title="¿Marcar como resuelto?"
        message={`El ticket T-${ticket.id} de ${ticket.user_name} se marcará como resuelto. Esta acción cierra el seguimiento activo.`}
        confirmLabel="Sí, resolver"
        confirmStyle="bg-green-600 hover:bg-green-700"
        onConfirm={handleConfirmResolve}
        onCancel={() => setPendingStatus(null)}
      />
    )}
    </>
  );
}
