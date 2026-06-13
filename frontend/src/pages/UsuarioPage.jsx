import { useState, useEffect, useCallback, useRef } from 'react';
import { LogOut, Ticket, Send, CheckCircle, ChevronDown, User, ClipboardList, Plus, RefreshCw, Clock, Loader2, ArrowLeft, MessageSquare, ChevronUp } from 'lucide-react';
import { api } from '../lib/api.js';
import { PRIORITY_COLOR, STATUS_COLOR } from '../lib/constants.js';

// Mapa local de status para la vista usuario: combina STATUS_CONFIG de constants.js
// con un label alternativo ('En espera' en lugar de 'Pendiente').
const STATUS_LABEL_USUARIO = {
  pending:     { label: 'En espera',  colorClass: STATUS_COLOR.pending },
  in_progress: { label: 'En proceso', colorClass: STATUS_COLOR.in_progress },
  resolved:    { label: 'Resuelto',   colorClass: STATUS_COLOR.resolved },
};

function QueueBadge({ token, ticketId, status }) {
  const [pos,      setPos]      = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setPos(null);
    setHasError(false);
    if (status === 'resolved') { setPos({ status: 'resolved' }); return; }
    api.getTicketPosition(token, ticketId)
      .then(setPos)
      .catch(() => setHasError(true));
  }, [token, ticketId, status]);

  if (hasError) return null;
  if (!pos)  return <span className="text-xs text-slate-400 animate-pulse">Calculando posición...</span>;
  if (pos.status === 'resolved') return null;

  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3" /> En atención ahora
      </span>
    );
  }

  if (pos.ahead === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
        ¡Es tu turno!
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" />
      {pos.ahead === 1
        ? '1 ticket antes que el tuyo'
        : `${pos.ahead} tickets antes que el tuyo`}
    </span>
  );
}

function TicketNotes({ token, ticketId }) {
  const [notes, setNotes] = useState(null);

  useEffect(() => {
    api.getTicketNotes(token, ticketId)
      .then(setNotes)
      .catch(() => setNotes([]));
  }, [token, ticketId]);

  if (!notes) return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400 py-1">
      <Loader2 className="w-3 h-3 animate-spin" /> Cargando seguimiento...
    </div>
  );

  if (notes.length === 0) return (
    <p className="text-xs text-slate-400 italic py-1">Sin actualizaciones por parte del equipo de TI aún.</p>
  );

  return (
    <div className="space-y-2">
      {notes.map((note, noteIndex) => (
        <div key={note.id} className="flex gap-2">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-1 shrink-0" />
            {noteIndex < notes.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
          </div>
          <div className="flex-1 pb-1">
            <p className="text-xs text-slate-700 leading-relaxed">{note.note}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {note.admin_name} · {new Date(note.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TicketCard({ ticket, token }) {
  const statusConfig = STATUS_LABEL_USUARIO[ticket.status] || STATUS_LABEL_USUARIO.pending;
  const date = new Date(ticket.created_at).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const [isShowingNotes, setIsShowingNotes] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Status color bar */}
      <div className={`h-1 w-full ${
        ticket.status === 'resolved'    ? 'bg-green-400' :
        ticket.status === 'in_progress' ? 'bg-blue-400'  : 'bg-yellow-400'
      }`} />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold text-slate-400">#{ticket.id}</span>
              <span className="text-[10px] text-slate-400">·</span>
              <p className="text-xs text-slate-400 truncate">{ticket.category_name}</p>
            </div>
            <p className="text-sm font-semibold text-slate-800 truncate">{ticket.problem_name}</p>
          </div>
          <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusConfig.colorClass}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Priority + date */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${PRIORITY_COLOR[ticket.priority] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {ticket.priority}
          </span>
          <span>{date}</span>
        </div>

        {/* Additional info */}
        {ticket.additional_info && (
          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed line-clamp-2">
            {ticket.additional_info}
          </p>
        )}

        {/* Queue position */}
        {ticket.status !== 'resolved' && (
          <div className="pt-1 border-t border-slate-100">
            <QueueBadge token={token} ticketId={ticket.id} status={ticket.status} />
          </div>
        )}

        {ticket.status === 'resolved' && (
          <div className="pt-1 border-t border-slate-100">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
              <CheckCircle className="w-3.5 h-3.5" /> Solicitud completada
            </span>
          </div>
        )}

        {/* Toggle seguimiento */}
        <button
          onClick={() => setIsShowingNotes(v => !v)}
          className="w-full flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
        >
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Seguimiento del equipo TI
          </span>
          {isShowingNotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isShowingNotes && (
          <div className="pt-1">
            <TicketNotes token={token} ticketId={ticket.id} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsuarioPage({ session, onLogout }) {
  const { user, token } = session;
  const [tab, setTab] = useState('new'); // 'new' | 'history'
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // --- Form state ---
  const [categories, setCategories] = useState([]);
  const [problems,   setProblems]   = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [catId,      setCatId]     = useState('');
  const [probId,     setProbId]    = useState('');
  const [info,       setInfo]      = useState('');
  const [otherDesc,  setOtherDesc] = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error,     setError]    = useState('');
  const isOther = catId === 'otro';
  const selectedProblem = problems.find(problem => problem.id === parseInt(probId));

  // --- History state ---
  const [tickets,          setTickets]          = useState([]);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);

  const loadTickets = useCallback(() => {
    setIsTicketsLoading(true);
    api.getTickets(token).then(data => {
      setTickets(data);
      setIsTicketsLoading(false);
    }).catch(err => {
      console.error('[UsuarioPage] Error al cargar tickets:', err);
      setIsTicketsLoading(false);
    });
  }, [token]);

  useEffect(() => {
    api.getCategories(token).then(setCategories).catch(err => console.error('[UsuarioPage] Error al cargar categorías:', err));
  }, [token]);

  useEffect(() => {
    if (tab === 'history') loadTickets();
  }, [tab, loadTickets]);

  useEffect(() => {
    if (!catId || catId === 'otro') {
      setProblems([]);
      setProbId('');
      setSuggestions([]);
      return;
    }
    setProbId('');
    setSuggestions([]);
    api.getProblems(token, catId).then(setProblems).catch(err => console.error('[UsuarioPage] Error al cargar problemas:', err));
  }, [catId, token]);

  useEffect(() => {
    if (!probId) { setSuggestions([]); return; }
    api.getSuggestions(token, probId).then(setSuggestions).catch(err => console.error('[UsuarioPage] Error al cargar sugerencias:', err));
  }, [probId, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!catId) return;
    if (!isOther && !probId) return;
    if (isOther && !otherDesc.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const body = { additional_info: info || null };
      if (isOther) {
        body.other_description = otherDesc.trim();
      } else {
        body.category_id = parseInt(catId);
        body.problem_id  = parseInt(probId);
      }
      await api.createTicket(token, body);
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setIsSubmitted(false);
    setCatId(''); setProbId(''); setInfo(''); setOtherDesc(''); setSuggestions([]);
    setProblems([]);
  };

  // --- Submitted screen ---
  if (isSubmitted) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Ticket enviado!</h2>
        <p className="text-slate-500 mb-8 text-sm">El equipo de TI atenderá tu solicitud según la prioridad asignada.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition">
            Nuevo ticket
          </button>
          <button onClick={() => { handleNew(); setTab('history'); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl transition">
            Ver mis tickets
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Ticket className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-wide truncate">Sistema de Tickets</span>
        </div>

        {/* Avatar con dropdown */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(o => !o)}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-white text-xs font-semibold leading-none">{user.name}</p>
              {user.area && <p className="text-slate-400 text-[10px] mt-0.5">{user.area}</p>}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-700 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => { setTab('history'); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                <ClipboardList className="w-4 h-4 text-slate-400" />
                Mis tickets
                {tickets.length > 0 && (
                  <span className="ml-auto bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {tickets.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setTab('new'); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                <Plus className="w-4 h-4 text-slate-400" />
                Nuevo ticket
              </button>
              <div className="border-t border-slate-100 mt-1">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 sm:px-6">

        {/* ── NEW TICKET TAB ── */}
        {tab === 'new' && (
          <>
            <div className="mb-6">
              <h1 className="text-slate-900 text-xl font-bold">Reportar incidencia</h1>
              <p className="text-slate-500 text-sm mt-1">Completa los campos para abrir un ticket de soporte.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <form onSubmit={handleSubmit} className="p-6 space-y-5">

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoría</label>
                  <div className="relative">
                    <select
                      value={catId}
                      onChange={e => setCatId(e.target.value)}
                      required
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="" disabled>Selecciona una categoría...</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.code} {category.name}</option>
                      ))}
                      <option value="otro">Otro (no está en la lista)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Problem (solo si no es "Otro") */}
                {!isOther && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Problema específico</label>
                    <div className="relative">
                      <select
                        value={probId}
                        onChange={e => setProbId(e.target.value)}
                        required
                        disabled={!catId}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <option value="" disabled>
                          {catId ? 'Selecciona el problema...' : 'Primero elige una categoría...'}
                        </option>
                        {problems.map(problem => (
                          <option key={problem.id} value={problem.id}>{problem.code} {problem.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Campo libre para "Otro" */}
                {isOther && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Describe tu problema
                    </label>
                    <textarea
                      rows={4}
                      value={otherDesc}
                      onChange={e => setOtherDesc(e.target.value)}
                      required
                      placeholder="Describe detalladamente el problema que tienes y que no encontraste en las categorías anteriores..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-slate-400 transition"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      El equipo de TI revisará tu solicitud y la atenderá lo antes posible.
                    </p>
                  </div>
                )}

                {/* Priority + description (solo si no es Otro) */}
                {!isOther && selectedProblem && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Prioridad</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${PRIORITY_COLOR[selectedProblem.priority] || 'bg-gray-100 text-gray-600'}`}>
                          {selectedProblem.priority}
                        </span>
                      </div>
                      <div className="w-px h-8 bg-slate-200" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Tiempo de resolución</p>
                        <p className="text-sm font-bold text-slate-700 mt-0.5">{selectedProblem.resolution_hours} hrs</p>
                      </div>
                    </div>
                    {selectedProblem.description && (
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">¿Qué incluye este tipo de caso?</p>
                        <p className="text-xs text-blue-800 leading-relaxed">{selectedProblem.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Suggestions (solo si no es Otro) */}
                {!isOther && probId && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Sugerencias de solución rápida
                    </label>
                    {suggestions.length > 0 ? (
                      <div className="space-y-2">
                        {suggestions.map((suggestion, suggestionIndex) => (
                          <div key={suggestion.id} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            {suggestions.length > 1 && (
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                                Sugerencia {suggestionIndex + 1}
                              </p>
                            )}
                            <p className="text-sm leading-relaxed text-emerald-900">{suggestion.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-400 italic text-center text-sm">
                        Sin sugerencias disponibles para este problema aún.
                      </div>
                    )}
                  </div>
                )}

                {/* Additional info */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Información adicional
                  </label>
                  <textarea
                    rows={3}
                    value={info}
                    onChange={e => setInfo(e.target.value)}
                    placeholder="Describe detalladamente tu problema, qué intentaste hacer y qué mensaje de error ves..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-slate-400 transition"
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !catId || (!isOther && !probId) || (isOther && !otherDesc.trim())}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
                >
                  {isLoading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Send className="w-4 h-4" /> Enviar ticket</>
                  }
                </button>
              </form>
            </div>
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTab('new')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-slate-900 text-xl font-bold">Mis tickets</h1>
                  <p className="text-slate-500 text-sm mt-0.5">Historial y estado de tus solicitudes.</p>
                </div>
              </div>
              <button
                onClick={loadTickets}
                disabled={isTicketsLoading}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isTicketsLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>

            {isTicketsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 font-medium">No tienes tickets aún</p>
                <p className="text-slate-400 text-sm mt-1">Crea tu primera solicitud desde "Nuevo ticket"</p>
                <button
                  onClick={() => setTab('new')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition"
                >
                  Crear ticket
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary bar */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'pending',     label: 'En espera',  color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
                    { key: 'in_progress', label: 'En proceso', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                    { key: 'resolved',    label: 'Resueltos',  color: 'text-green-700 bg-green-50 border-green-200' },
                  ].map(({ key, label, color }) => (
                    <div key={key} className={`rounded-xl border p-3 text-center ${color}`}>
                      <p className="text-xl font-bold">{tickets.filter(ticket => ticket.status === key).length}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Ticket list */}
                {tickets.map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket} token={token} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
