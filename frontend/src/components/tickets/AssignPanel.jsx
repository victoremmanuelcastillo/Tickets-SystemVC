import { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../ui/ToastContext.jsx';

// Estilos que varían según el rol que usa el panel
const VARIANT_STYLES = {
  admin: {
    ringColor:   'focus:ring-blue-400',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    buttonLabel: 'Asignar',
  },
  agent: {
    ringColor:   'focus:ring-emerald-400',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
    buttonLabel: 'Reasignar',
  },
};

/**
 * Panel para asignar o reasignar un ticket a un agente.
 *
 * @param {string}  token      — JWT del usuario autenticado
 * @param {Object}  ticket     — ticket actual (necesita id y assigned_to)
 * @param {Array}   agents     — lista completa de agentes disponibles
 * @param {Function} onAssigned — callback con el ticket actualizado tras asignar
 * @param {'admin'|'agent'} variant — admin muestra todos; agent filtra solo role=agente
 */
export function AssignPanel({ token, ticket, agents, onAssigned, variant = 'admin' }) {
  const showToast = useToast();
  const [selectedAgentId, setSelectedAgentId] = useState(
    ticket.assigned_to ? String(ticket.assigned_to) : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const styles = VARIANT_STYLES[variant];

  // Mantener el selector sincronizado si el ticket se actualiza desde afuera
  // (ej: auto-asignación al marcar in_progress)
  useEffect(() => {
    setSelectedAgentId(ticket.assigned_to ? String(ticket.assigned_to) : '');
  }, [ticket.assigned_to]);

  // Los agentes solo pueden reasignar a otros agentes, no a admins
  const assignableAgents = variant === 'agent'
    ? agents.filter(agent => agent.role === 'agente')
    : agents;

  const handleAssign = async () => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      const updatedTicket = await api.updateTicketStatus(token, ticket.id, {
        assigned_to: selectedAgentId ? parseInt(selectedAgentId) : null,
      });
      onAssigned(updatedTicket);
      const agentName = agents.find(agent => String(agent.id) === selectedAgentId)?.name;
      showToast(
        agentName ? `Ticket asignado a ${agentName}` : 'Asignación removida',
        'success'
      );
    } catch (error) {
      const message = error.message || 'Error al asignar';
      setErrorMsg(message);
      showToast(message, 'error');
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <select
          value={selectedAgentId}
          onChange={e => setSelectedAgentId(e.target.value)}
          className={`text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5
            text-slate-700 focus:outline-none focus:ring-2 ${styles.ringColor} flex-1 min-w-0`}
        >
          <option value="">Sin asignar</option>
          {assignableAgents.map(agent => (
            <option key={agent.id} value={agent.id}>
              {agent.name}{agent.specialty ? ` (${agent.specialty})` : ''}
            </option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={isSaving}
          className={`text-xs ${styles.buttonColor} disabled:opacity-50 text-white
            font-semibold px-3 py-1.5 rounded-lg transition`}
        >
          {isSaving ? '...' : styles.buttonLabel}
        </button>
      </div>
      {errorMsg && <p className="text-[11px] text-red-500">{errorMsg}</p>}
    </div>
  );
}
