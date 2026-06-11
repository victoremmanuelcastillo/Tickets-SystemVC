import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ui/ToastContext.jsx';
import { api } from '../lib/api.js';
import { PRIORITY_ORDER } from '../lib/constants.js';

const STATUS_TOAST_LABEL = {
  pending:     'Pendiente',
  in_progress: 'En proceso',
  resolved:    'Resuelto',
};

/**
 * Centraliza toda la lógica de tickets: carga, cambio de estado,
 * asignación de agente, filtros y control del ticket expandido.
 *
 * @param {string} token — JWT del usuario autenticado
 * @returns {Object} — estado + funciones para manipular tickets
 */
export function useTickets(token) {
  const showToast = useToast();
  const [ticketList,       setTicketList]       = useState([]);
  const [agentList,        setAgentList]        = useState([]);
  const [isLoading,        setIsLoading]        = useState(true);
  const [updatingTicketId, setUpdatingTicketId] = useState(null);
  const [expandedTicketId, setExpandedTicketId] = useState(null);

  // --- Filtros ---
  const [filterUser,    setFilterUser]    = useState('');
  const [filterProblem, setFilterProblem] = useState('');
  const [filterAgent,   setFilterAgent]   = useState('');
  const [filterSearch,  setFilterSearch]  = useState('');

  const loadTicketsAndAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tickets, agents] = await Promise.all([
        api.getTickets(token),
        api.getAgents(token),
      ]);
      setTicketList(tickets);
      setAgentList(agents);
    } catch (error) {
      console.error('[useTickets] Error al cargar tickets:', error);
      showToast('No se pudieron cargar los tickets', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTicketsAndAgents();
  }, [loadTicketsAndAgents]);

  const changeTicketStatus = async (ticketId, newStatus) => {
    setUpdatingTicketId(ticketId);
    try {
      const updatedTicket = await api.updateTicketStatus(token, ticketId, { status: newStatus });
      setTicketList(currentTickets =>
        currentTickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, ...updatedTicket } : ticket
        )
      );
      showToast(`Ticket actualizado a "${STATUS_TOAST_LABEL[newStatus] || newStatus}"`, 'success');
      return updatedTicket;
    } catch (error) {
      showToast(error.message || 'Error al actualizar el estado', 'error');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const assignTicketToAgent = (updatedTicket) => {
    setTicketList(currentTickets =>
      currentTickets.map(ticket =>
        ticket.id === updatedTicket.id ? { ...ticket, ...updatedTicket } : ticket
      )
    );
  };

  const toggleTicketExpand = (ticketId) => {
    setExpandedTicketId(currentId => currentId === ticketId ? null : ticketId);
  };

  const clearFilters = () => {
    setFilterUser('');
    setFilterProblem('');
    setFilterAgent('');
    setFilterSearch('');
  };

  // --- Listas derivadas ---

  const searchQuery = filterSearch.toLowerCase().trim();

  const filteredTickets = ticketList.filter(ticket => {
    if (filterUser    && ticket.user_name           !== filterUser)    return false;
    if (filterProblem && String(ticket.problem_id)  !== filterProblem) return false;
    if (filterAgent   && String(ticket.assigned_to) !== filterAgent)   return false;
    if (searchQuery) {
      const searchableText = [
        ticket.user_name,
        ticket.problem_name,
        ticket.additional_info,
        ticket.other_description,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!searchableText.includes(searchQuery)) return false;
    }
    return true;
  });

  const activeTickets   = filteredTickets.filter(ticket => ticket.status !== 'resolved');
  const resolvedTickets = filteredTickets.filter(ticket => ticket.status === 'resolved');

  const sortedActiveTickets = [...activeTickets].sort((ticketA, ticketB) => {
    const inProgressA = ticketA.status === 'in_progress' ? 0 : 1;
    const inProgressB = ticketB.status === 'in_progress' ? 0 : 1;
    if (inProgressA !== inProgressB) return inProgressA - inProgressB;
    const priorityA = PRIORITY_ORDER[ticketA.priority] || 6;
    const priorityB = PRIORITY_ORDER[ticketB.priority] || 6;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return new Date(ticketA.created_at) - new Date(ticketB.created_at);
  });

  const sortedResolvedTickets = [...resolvedTickets].sort((ticketA, ticketB) =>
    new Date(ticketB.created_at) - new Date(ticketA.created_at)
  );

  // Opciones únicas para los dropdowns de filtro
  const uniqueFilterUsers = [
    ...new Map(ticketList.map(ticket => [ticket.user_name, { name: ticket.user_name, area: ticket.area }])).values()
  ];
  const uniqueFilterProblems = [
    ...new Map(ticketList.map(ticket => [ticket.problem_id, { id: ticket.problem_id, name: ticket.problem_name }])).values()
  ];

  const inProgressCount = activeTickets.filter(ticket => ticket.status === 'in_progress').length;
  const pendingCount    = activeTickets.filter(ticket => ticket.status === 'pending').length;

  const hasActiveFilters = !!(filterUser || filterProblem || filterAgent || filterSearch);

  return {
    // Estado base
    ticketList,
    agentList,
    isLoading,
    updatingTicketId,
    expandedTicketId,

    // Acciones
    loadTicketsAndAgents,
    changeTicketStatus,
    assignTicketToAgent,
    toggleTicketExpand,

    // Filtros
    filterUser,    setFilterUser,
    filterProblem, setFilterProblem,
    filterAgent,   setFilterAgent,
    filterSearch,  setFilterSearch,
    hasActiveFilters,
    clearFilters,

    // Listas derivadas (ya filtradas y ordenadas)
    activeTickets:          sortedActiveTickets,
    resolvedTickets:        sortedResolvedTickets,
    uniqueFilterUsers,
    uniqueFilterProblems,

    // Contadores
    inProgressCount,
    pendingCount,
  };
}
