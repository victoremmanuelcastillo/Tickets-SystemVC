import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, User, Plus, Search, X } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useTickets } from '../../hooks/useTickets.js';
import { TicketCard } from '../../components/tickets/TicketCard.jsx';

/* Modal para crear ticket a nombre de un usuario */
function CreateTicketModal({ session, onClose, onCreated }) {
  const { token } = session;
  const [query,       setQuery]      = useState('');
  const [results,     setResults]    = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [targetUser,  setTargetUser] = useState(null);

  const [categories,  setCategories] = useState([]);
  const [problems,    setProblems]   = useState([]);
  const [catId,       setCatId]      = useState('');
  const [probId,      setProbId]     = useState('');
  const [info,        setInfo]       = useState('');
  const [otherDesc,   setOtherDesc]  = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg,    setErrorMsg]   = useState('');

  useEffect(() => {
    api.getCategories(token).then(setCategories)
      .catch(err => console.error('[CreateTicketModal] Error al cargar categorías:', err));
  }, [token]);

  useEffect(() => {
    if (!catId || catId === 'otro') { setProblems([]); setProbId(''); return; }
    api.getProblems(token, catId).then(setProblems)
      .catch(err => console.error('[CreateTicketModal] Error al cargar problemas:', err));
  }, [catId, token]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      setResults(await api.searchUsers(token, query));
    } catch (err) {
      console.error('[AgentTicketsPage] Error al buscar usuarios:', err);
    }
    setIsSearching(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUser) return;
    if (catId !== 'otro' && !probId) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const body = { target_user_id: targetUser.id, additional_info: info || null };
      if (catId === 'otro') {
        body.other_description = otherDesc;
      } else {
        body.category_id = parseInt(catId);
        body.problem_id  = parseInt(probId);
      }
      await api.createTicket(token, body);
      onCreated();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Crear ticket para usuario</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* ── Búsqueda de usuario ── */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Buscar usuario</p>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Nombre o correo..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl transition"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            {results.length > 0 && (
              <div className="mt-2 space-y-1">
                {results.map(user => (
                  <button
                    key={user.id}
                    onClick={() => { setTargetUser(user); setResults([]); setQuery(''); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                      targetUser?.id === user.id
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-slate-400 ml-2 text-xs">{user.email}</span>
                    {user.area && <span className="text-slate-400 ml-2 text-xs">· {user.area}</span>}
                  </button>
                ))}
              </div>
            )}
            {targetUser && (
              <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                <User className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-700 truncate">{targetUser.name}</p>
                  <p className="text-xs text-emerald-500 truncate">
                    {targetUser.email}{targetUser.area ? ` · ${targetUser.area}` : ''}
                  </p>
                </div>
                <button onClick={() => setTargetUser(null)} className="text-emerald-400 hover:text-emerald-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ── Formulario del ticket ── */}
          {targetUser && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Categoría</label>
                <select
                  value={catId}
                  onChange={e => setCatId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>Selecciona una categoría...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.code} {category.name}</option>
                  ))}
                  <option value="otro">Otro (no registrado)</option>
                </select>
              </div>

              {catId && catId !== 'otro' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Problema</label>
                  <select
                    value={probId}
                    onChange={e => setProbId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="" disabled>Selecciona el problema...</option>
                    {problems.map(problem => (
                      <option key={problem.id} value={problem.id}>{problem.code} {problem.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {catId === 'otro' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Descripción del problema
                  </label>
                  <textarea
                    rows={3}
                    value={otherDesc}
                    onChange={e => setOtherDesc(e.target.value)}
                    required
                    placeholder="Describe el problema que no está en las categorías..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Información adicional (opcional)
                </label>
                <textarea
                  rows={2}
                  value={info}
                  onChange={e => setInfo(e.target.value)}
                  placeholder="Detalles adicionales..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {errorMsg && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
              >
                {isSubmitting ? 'Creando...' : 'Crear ticket'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgentTicketsPage({ session }) {
  const [view,       setView]       = useState('active');
  const [isShowingCreateModal, setIsShowingCreateModal] = useState(false);

  const {
    agentList,
    isLoading,
    updatingTicketId,
    expandedTicketId,
    loadTicketsAndAgents,
    changeTicketStatus,
    assignTicketToAgent,
    toggleTicketExpand,
    filterAgent,   setFilterAgent,
    filterSearch,  setFilterSearch,
    hasActiveFilters,
    clearFilters,
    activeTickets,
    resolvedTickets,
    inProgressCount,
    pendingCount,
  } = useTickets(session.token);

  const displayedTickets = view === 'active' ? activeTickets : resolvedTickets;

  return (
    <div>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Mis tickets</h1>
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
        <div className="flex gap-2">
          <button
            onClick={() => setIsShowingCreateModal(true)}
            className="flex items-center gap-2 text-white bg-emerald-600 hover:bg-emerald-700 text-sm font-medium rounded-xl px-4 py-2 transition"
          >
            <Plus className="w-4 h-4" /> Crear ticket
          </button>
          <button
            onClick={loadTicketsAndAgents}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium border border-slate-200 bg-white rounded-xl px-4 py-2 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>
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
            className="pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 w-48"
          />
        </div>
        <select
          value={filterAgent}
          onChange={e => setFilterAgent(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
            Limpiar filtro
          </button>
        )}
      </div>

      {/* ── Pestañas de vista ── */}
      <div className="flex gap-2 mb-5">
        {['active', 'resolved'].map(viewOption => (
          <button
            key={viewOption}
            onClick={() => setView(viewOption)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
              view === viewOption
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {viewOption === 'active' ? 'Cola activa' : 'Resueltos'}
            <span className="ml-1.5 opacity-70">
              ({viewOption === 'active' ? activeTickets.length : resolvedTickets.length})
            </span>
          </button>
        ))}
      </div>

      {/* ── Lista de tickets ── */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
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
                  updatingId={updatingTicketId}
                  onChangeStatus={changeTicketStatus}
                  onToggleExpand={toggleTicketExpand}
                  expandedId={expandedTicketId}
                  session={session}
                  agents={agentList}
                  onAssigned={assignTicketToAgent}
                  variant="agent"
                />
              </div>
            );
          })}
        </div>
      )}

      {isShowingCreateModal && (
        <CreateTicketModal
          session={session}
          onClose={() => setIsShowingCreateModal(false)}
          onCreated={loadTicketsAndAgents}
        />
      )}
    </div>
  );
}
