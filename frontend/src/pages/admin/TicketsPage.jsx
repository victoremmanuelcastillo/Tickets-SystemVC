import { useState } from 'react';
import { RefreshCw, CheckCircle, Search } from 'lucide-react';
import { useTickets } from '../../hooks/useTickets.js';
import { TicketCard } from '../../components/tickets/TicketCard.jsx';

const VIEWS = ['active', 'resolved'];
const VIEW_LABELS = { active: 'Cola activa', resolved: 'Resueltos' };

export default function TicketsPage({ session }) {
  const [view, setView] = useState('active');

  const {
    agentList,
    isLoading,
    updatingTicketId,
    expandedTicketId,
    loadTicketsAndAgents,
    changeTicketStatus,
    assignTicketToAgent,
    toggleTicketExpand,
    filterUser,    setFilterUser,
    filterProblem, setFilterProblem,
    filterAgent,   setFilterAgent,
    filterSearch,  setFilterSearch,
    hasActiveFilters,
    clearFilters,
    activeTickets,
    resolvedTickets,
    uniqueFilterUsers,
    uniqueFilterProblems,
    inProgressCount,
    pendingCount,
  } = useTickets(session.token);

  const displayedTickets = view === 'active' ? activeTickets : resolvedTickets;

  return (
    <div>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Gestión de tickets</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-blue-600 font-semibold bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
              {inProgressCount} en proceso
            </span>
            <span className="text-xs text-yellow-700 font-semibold bg-yellow-50 border border-yellow-100 rounded-full px-2 py-0.5">
              {pendingCount} pendientes
            </span>
            <span className="text-xs text-green-700 font-semibold bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
              {resolvedTickets.length} resueltos
            </span>
          </div>
        </div>
        <button
          onClick={loadTicketsAndAgents}
          className="self-start sm:self-auto flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium border border-slate-200 bg-white rounded-xl px-4 py-2 hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            placeholder="Buscar en tickets..."
            className="pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
          />
        </div>
        <select
          value={filterUser}
          onChange={e => setFilterUser(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Todos los usuarios</option>
          {uniqueFilterUsers.map(user => (
            <option key={user.name} value={user.name}>
              {user.name}{user.area ? ` (${user.area})` : ''}
            </option>
          ))}
        </select>

        <select
          value={filterProblem}
          onChange={e => setFilterProblem(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Todos los problemas</option>
          {uniqueFilterProblems.map(problem => (
            <option key={problem.id} value={String(problem.id)}>{problem.name}</option>
          ))}
        </select>

        <select
          value={filterAgent}
          onChange={e => setFilterAgent(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Todos los agentes</option>
          {agentList.map(agent => (
            <option key={agent.id} value={String(agent.id)}>
              {agent.name}{agent.specialty ? ` (${agent.specialty})` : ''}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-red-500 hover:text-red-700 border border-red-200 bg-red-50 rounded-lg px-3 py-1.5 transition"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Pestañas de vista ── */}
      <div className="flex gap-2 mb-5">
        {VIEWS.map(viewOption => (
          <button
            key={viewOption}
            onClick={() => setView(viewOption)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
              view === viewOption
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {VIEW_LABELS[viewOption]}
            <span className="ml-1.5 opacity-70">
              ({viewOption === 'active' ? activeTickets.length : resolvedTickets.length})
            </span>
          </button>
        ))}
      </div>

      {/* ── Lista de tickets ── */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayedTickets.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">
            {view === 'active' ? 'No hay tickets activos' : 'No hay tickets resueltos'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {view === 'active' && inProgressCount > 0 && (
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              En proceso — {inProgressCount}
            </p>
          )}
          {displayedTickets.map((ticket, idx) => {
            const previousTicket = displayedTickets[idx - 1];
            const shouldShowPendingLabel =
              view === 'active' &&
              ticket.status === 'pending' &&
              (idx === 0 || previousTicket?.status !== 'pending');

            return (
              <div key={ticket.id}>
                {shouldShowPendingLabel && (
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 mt-4 mb-2">
                    Pendientes — {pendingCount}
                  </p>
                )}
                <TicketCard
                  ticket={ticket}
                  position={view === 'active' ? idx + 1 : null}
                  updatingId={updatingTicketId}
                  onChangeStatus={changeTicketStatus}
                  onToggleExpand={toggleTicketExpand}
                  expandedId={expandedTicketId}
                  session={session}
                  agents={agentList}
                  onAssigned={assignTicketToAgent}
                  variant="admin"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
