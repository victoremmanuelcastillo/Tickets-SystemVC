import { useState, useEffect } from 'react';
import { BarChart2, Users, Wrench, UserCheck, RefreshCw, TrendingUp, ArrowLeft, Clock, CheckCircle, Circle } from 'lucide-react';
import { api } from '../../lib/api.js';
import { STATUS_LABEL, STATUS_COLOR, STATUS_FILTER_LABELS, STATUS_FILTER_COLORS, PRIORITY_ORDER } from '../../lib/constants.js';

// Íconos de lucide por estado — no viven en constants.js
const STATUS_ICON = {
  pending:     Circle,
  in_progress: Clock,
  resolved:    CheckCircle,
};

function StatCard({ label, value, color = 'text-slate-900', onClick, active, onViewTickets }) {
  const ringColor = color.includes('yellow') ? 'ring-yellow-400' :
                    color.includes('blue')   ? 'ring-blue-400'   :
                    color.includes('green')  ? 'ring-green-400'  : 'ring-slate-400';
  return (
    <div className={`bg-white border rounded-2xl shadow-sm transition flex flex-col
      ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}
      ${active ? `ring-2 ring-offset-1 border-transparent ${ringColor}` : 'border-slate-200'}
    `}>
      <div className="p-4 text-center flex-1" onClick={onClick}>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
        {onClick && (
          <p className="text-[10px] text-slate-400 mt-1">{active ? 'Clic para quitar filtro' : 'Clic para filtrar'}</p>
        )}
      </div>
      {onViewTickets && (
        <button
          onClick={e => { e.stopPropagation(); onViewTickets(); }}
          className={`w-full text-[11px] font-semibold py-1.5 rounded-b-2xl border-t transition
            ${color.includes('yellow') ? 'text-yellow-700 border-yellow-100 bg-yellow-50 hover:bg-yellow-100' :
              color.includes('blue')   ? 'text-blue-700 border-blue-100 bg-blue-50 hover:bg-blue-100'         :
              color.includes('green')  ? 'text-green-700 border-green-100 bg-green-50 hover:bg-green-100'     : ''}
          `}
        >
          Ver tickets →
        </button>
      )}
    </div>
  );
}

function BarRow({ label, value, max, color = 'bg-blue-500' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-slate-700 w-36 shrink-0 truncate" title={label}>{label}</p>
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-600 w-6 text-right shrink-0">{value}</span>
    </div>
  );
}

function TicketCard({ t }) {
  const Icon = STATUS_ICON[t.status] || Circle;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400">T-{t.id}</span>
            {t.category_name
              ? <span className="text-xs text-slate-500">{t.category_code} {t.category_name}</span>
              : <span className="text-xs text-amber-600 font-semibold">Otro</span>
            }
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
            {t.problem_name || 'Sin problema definido'}
          </p>
          {t.other_description && (
            <p className="text-xs text-amber-700 mt-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
              {t.other_description}
            </p>
          )}
          {t.additional_info && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.additional_info}</p>
          )}
        </div>
        <span className={`shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${STATUS_COLOR[t.status]}`}>
          <Icon className="w-3 h-3" />
          {STATUS_LABEL[t.status]}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex-wrap">
        <span>{new Date(t.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        {t.priority && <span className="font-semibold text-slate-500">{t.priority}</span>}
        {t.assigned_name && <span>Asignado: <span className="font-semibold text-blue-600">{t.assigned_name}</span></span>}
        {t.user_name && <span>Usuario: <span className="font-semibold text-slate-600">{t.user_name}</span></span>}
      </div>
    </div>
  );
}

function TicketsDetailView({ token, title, subtitle, fetchFn, initialFilter, hideFilters, onBack }) {
  const [tickets,   setTickets]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter,    setFilter]    = useState(initialFilter || null);
  const [apiError,  setApiError]  = useState(null);

  useEffect(() => {
    setTickets(null);
    setIsLoading(true);
    setApiError(null);
    fetchFn(token)
      .then(data => {
        if (!Array.isArray(data)) {
          setApiError(`Respuesta inesperada: ${JSON.stringify(data)}`);
          setIsLoading(false);
          return;
        }
        setTickets(data);
        setIsLoading(false);
      })
      .catch(err => {
        setApiError(err.message || 'Error al cargar tickets');
        setIsLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = tickets
    ? (filter ? tickets.filter(ticket => ticket.status === filter) : tickets)
        .slice()
        .sort((ticketA, ticketB) => (PRIORITY_ORDER[ticketA.priority] ?? 9) - (PRIORITY_ORDER[ticketB.priority] ?? 9))
    : [];

  const counts = tickets
    ? {
        pending:     tickets.filter(ticket => ticket.status === 'pending').length,
        in_progress: tickets.filter(ticket => ticket.status === 'in_progress').length,
        resolved:    tickets.filter(ticket => ticket.status === 'resolved').length,
      }
    : {};

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">{title}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
        </div>
      </div>

      {!isLoading && tickets && !hideFilters && (
        <div className="flex gap-2 flex-wrap">
          {['pending', 'in_progress', 'resolved'].map(st => (
            <button
              key={st}
              onClick={() => setFilter(filter === st ? null : st)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition
                ${STATUS_FILTER_COLORS[st]}
                ${filter === st ? 'ring-2 ring-offset-1' : 'opacity-70 hover:opacity-100'}
              `}
            >
              {STATUS_FILTER_LABELS[st]}
              <span className="font-bold">{counts[st]}</span>
            </button>
          ))}
          {filter && (
            <button
              onClick={() => setFilter(null)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition"
            >
              Ver todos
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : apiError ? (
        <div className="text-center py-16 text-red-500 text-sm font-mono bg-red-50 rounded-xl p-4">{apiError}</div>
      ) : !tickets || tickets.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Sin tickets registrados.</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No hay tickets con ese estado.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ticket => <TicketCard key={ticket.id} t={ticket} />)}
        </div>
      )}
    </div>
  );
}

function UserTicketsDetail({ token, userName, userId, initialFilter, onBack }) {
  return (
    <TicketsDetailView
      token={token}
      title={`Tickets de ${userName}`}
      subtitle="Historial de solicitudes del usuario."
      fetchFn={(tk) => api.getUserTickets(tk, userId)}
      initialFilter={initialFilter}
      onBack={onBack}
    />
  );
}

export default function ReportsPage({ session }) {
  const { token } = session;
  const [data,          setData]         = useState(null);
  const [isLoading,     setIsLoading]    = useState(true);
  const [detailUser,    setDetailUser]   = useState(null);
  const [detailAgent,   setDetailAgent]  = useState(null);
  const [detailStatus,  setDetailStatus] = useState(null);
  const [statusFilter,  setStatusFilter] = useState(null);

  const load = async () => {
    setIsLoading(true);
    try {
      setData(await api.getReports(token));
    } catch (err) {
      console.error('[ReportsPage] Error al cargar reportes:', err);
    }
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [token]);

  if (detailUser) {
    return (
      <UserTicketsDetail
        token={token}
        userName={detailUser.user_name}
        userId={detailUser.user_id}
        initialFilter={detailUser.initialFilter}
        onBack={() => setDetailUser(null)}
      />
    );
  }

  if (detailAgent) {
    return (
      <TicketsDetailView
        token={token}
        title={`Tickets de ${detailAgent.agent_name}`}
        subtitle="Tickets asignados a este agente / administrador."
        fetchFn={(tk) => api.getAgentTickets(tk, detailAgent.agent_name)}
        initialFilter={detailAgent.initialFilter}
        onBack={() => setDetailAgent(null)}
      />
    );
  }

  if (detailStatus) {
    const STATUS_TITLES = { pending: 'Tickets Pendientes', in_progress: 'Tickets En Proceso', resolved: 'Tickets Resueltos' };
    return (
      <TicketsDetailView
        token={token}
        title={STATUS_TITLES[detailStatus]}
        subtitle="Lista de tickets filtrados por estado."
        fetchFn={(tk) => api.getTicketsByStatus(tk, detailStatus)}
        initialFilter={detailStatus}
        hideFilters
        onBack={() => setDetailStatus(null)}
      />
    );
  }

  if (isLoading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-24 text-slate-400">Error al cargar reportes.</div>
  );

  const totalTickets = data.by_status.reduce((sum, row) => sum + parseInt(row.count), 0);
  const getCount = statusKey => parseInt(data.by_status.find(row => row.status === statusKey)?.count || 0);

  const adminMap = {};
  for (const row of data.by_admin) {
    const agentName = row.assigned_name;
    if (!agentName) continue;
    if (!adminMap[agentName]) adminMap[agentName] = { name: agentName, pending: 0, in_progress: 0, resolved: 0 };
    adminMap[agentName][row.status] = parseInt(row.count);
  }
  const adminEntries = Object.values(adminMap).map(agentEntry => ({
    ...agentEntry,
    total: agentEntry.pending + agentEntry.in_progress + agentEntry.resolved,
  })).sort((entryA, entryB) => entryB.total - entryA.total);

  // Filtrar categorías y problemas según estado seleccionado
  const filteredCategories = statusFilter
    ? (() => {
        const map = {};
        for (const r of data.by_category) {
          if (r.status !== statusFilter) continue;
          map[r.category_name] = (map[r.category_name] || 0) + parseInt(r.count);
        }
        return Object.entries(map).map(([category_name, count]) => ({ category_name, count }))
          .sort((a, b) => b.count - a.count);
      })()
    : (() => {
        const map = {};
        for (const r of data.by_category) {
          map[r.category_name] = (map[r.category_name] || 0) + parseInt(r.count);
        }
        return Object.entries(map).map(([category_name, count]) => ({ category_name, count }))
          .sort((a, b) => b.count - a.count);
      })();

  const filteredProblems = statusFilter
    ? (() => {
        const map = {};
        for (const r of data.by_problem) {
          if (r.status !== statusFilter) continue;
          map[r.problem_name] = (map[r.problem_name] || 0) + parseInt(r.count);
        }
        return Object.entries(map).map(([problem_name, count]) => ({ problem_name, count }))
          .sort((a, b) => b.count - a.count).slice(0, 10);
      })()
    : (() => {
        const map = {};
        for (const r of data.by_problem) {
          map[r.problem_name] = (map[r.problem_name] || 0) + parseInt(r.count);
        }
        return Object.entries(map).map(([problem_name, count]) => ({ problem_name, count }))
          .sort((a, b) => b.count - a.count).slice(0, 10);
      })();

  const maxProblem  = Math.max(...filteredProblems.map(row => row.count), 1);
  const maxCategory = Math.max(...filteredCategories.map(row => row.count), 1);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Reportes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Resumen general del sistema de tickets.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium border border-slate-200 bg-white rounded-xl px-4 py-2 hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total tickets" value={totalTickets} color="text-slate-900" />
        <StatCard label="Pendientes"    value={getCount('pending')}     color="text-yellow-600"
          onClick={() => setStatusFilter(statusFilter === 'pending' ? null : 'pending')}
          active={statusFilter === 'pending'}
          onViewTickets={() => setDetailStatus('pending')} />
        <StatCard label="En proceso"    value={getCount('in_progress')} color="text-blue-600"
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? null : 'in_progress')}
          active={statusFilter === 'in_progress'}
          onViewTickets={() => setDetailStatus('in_progress')} />
        <StatCard label="Resueltos"     value={getCount('resolved')}    color="text-green-600"
          onClick={() => setStatusFilter(statusFilter === 'resolved' ? null : 'resolved')}
          active={statusFilter === 'resolved'}
          onViewTickets={() => setDetailStatus('resolved')} />
      </div>
      {statusFilter && (
        <p className="text-xs text-slate-500">
          Gráficas mostrando solo <span className="font-semibold">{STATUS_FILTER_LABELS[statusFilter]}</span>.
          <button onClick={() => setStatusFilter(null)} className="ml-2 text-blue-500 underline hover:text-blue-700">Ver todo</button>
        </p>
      )}

      {/* By category */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-800 text-sm">Tickets por categoría</h2>
          {statusFilter && (
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[statusFilter]}`}>
              {STATUS_FILTER_LABELS[statusFilter]}
            </span>
          )}
        </div>
        <div className="space-y-3">
          {filteredCategories.length === 0
            ? <p className="text-xs text-slate-400 text-center py-4">Sin datos para este estado.</p>
            : filteredCategories.map(row => (
                <BarRow key={row.category_name} label={row.category_name} value={row.count} max={maxCategory} color="bg-blue-500" />
              ))
          }
        </div>
      </div>

      {/* By problem */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-800 text-sm">Problemas más frecuentes</h2>
          {statusFilter && (
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[statusFilter]}`}>
              {STATUS_FILTER_LABELS[statusFilter]}
            </span>
          )}
        </div>
        <div className="space-y-3">
          {filteredProblems.length === 0
            ? <p className="text-xs text-slate-400 text-center py-4">Sin datos para este estado.</p>
            : filteredProblems.map(row => (
            <BarRow
              key={row.problem_name}
              label={row.problem_name}
              value={row.count}
              max={maxProblem}
              color="bg-amber-400"
            />
          ))}
        </div>
      </div>

      {/* By user — clic para ver detalle */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-800 text-sm">Tickets por usuario</h2>
          <span className="text-[10px] text-slate-400 ml-auto">Haz clic en un número para ver esos tickets</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 pr-3 font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="text-left py-2 pr-3 font-bold text-slate-500 uppercase tracking-wider">Área</th>
                <th className="text-center py-2 px-2 font-bold text-yellow-600 uppercase tracking-wider">Pend.</th>
                <th className="text-center py-2 px-2 font-bold text-blue-600 uppercase tracking-wider">Proc.</th>
                <th className="text-center py-2 px-2 font-bold text-green-600 uppercase tracking-wider">Resuel.</th>
                <th className="text-center py-2 pl-2 font-bold text-slate-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.by_user
                .filter(userRow => !statusFilter || parseInt(userRow[statusFilter === 'in_progress' ? 'in_progress' : statusFilter]) > 0)
                .map(userRow => (
                <tr key={userRow.user_name} className="hover:bg-blue-50 transition">
                  <td
                    className="py-2 pr-3 font-medium text-blue-600 underline underline-offset-2 cursor-pointer"
                    onClick={() => setDetailUser({ user_name: userRow.user_name, user_id: userRow.user_id, initialFilter: statusFilter })}
                    title="Ver todos los tickets"
                  >{userRow.user_name}</td>
                  <td className="py-2 pr-3 text-slate-500">{userRow.area || '—'}</td>
                  <td className="py-2 px-2 text-center">
                    <span
                      onClick={() => setDetailUser({ user_name: userRow.user_name, user_id: userRow.user_id, initialFilter: 'pending' })}
                      className="inline-block w-6 h-6 leading-6 rounded-full bg-yellow-50 text-yellow-700 font-bold text-center cursor-pointer hover:ring-2 hover:ring-yellow-400 transition"
                      title="Ver pendientes"
                    >{userRow.pending}</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span
                      onClick={() => setDetailUser({ user_name: userRow.user_name, user_id: userRow.user_id, initialFilter: 'in_progress' })}
                      className="inline-block w-6 h-6 leading-6 rounded-full bg-blue-50 text-blue-700 font-bold text-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
                      title="Ver en proceso"
                    >{userRow.in_progress}</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span
                      onClick={() => setDetailUser({ user_name: userRow.user_name, user_id: userRow.user_id, initialFilter: 'resolved' })}
                      className="inline-block w-6 h-6 leading-6 rounded-full bg-green-50 text-green-700 font-bold text-center cursor-pointer hover:ring-2 hover:ring-green-400 transition"
                      title="Ver resueltos"
                    >{userRow.resolved}</span>
                  </td>
                  <td className="py-2 pl-2 text-center font-bold text-slate-700">{userRow.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By admin */}
      {adminEntries.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-4 h-4 text-slate-500" />
            <h2 className="font-bold text-slate-800 text-sm">Actividad por agente / administrador</h2>
            <span className="text-[10px] text-slate-400 ml-auto">Haz clic en un número para ver esos tickets</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 pr-3 font-bold text-slate-500 uppercase tracking-wider">Agente</th>
                  <th className="text-center py-2 px-2 font-bold text-yellow-600 uppercase tracking-wider">Pend.</th>
                  <th className="text-center py-2 px-2 font-bold text-blue-600 uppercase tracking-wider">Proc.</th>
                  <th className="text-center py-2 px-2 font-bold text-green-600 uppercase tracking-wider">Resuel.</th>
                  <th className="text-center py-2 pl-2 font-bold text-slate-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {adminEntries
                  .filter(agentEntry => !statusFilter || agentEntry[statusFilter] > 0)
                  .map(agentEntry => (
                  <tr key={agentEntry.name} className="hover:bg-slate-50 transition">
                    <td
                      className="py-2 pr-3 font-medium text-blue-600 underline underline-offset-2 cursor-pointer"
                      onClick={() => setDetailAgent({ agent_id: agentEntry.id, agent_name: agentEntry.name, initialFilter: statusFilter })}
                      title="Ver todos los tickets de este agente"
                    >{agentEntry.name}</td>
                    <td className="py-2 px-2 text-center">
                      <span
                        onClick={() => setDetailAgent({ agent_id: agentEntry.id, agent_name: agentEntry.name, initialFilter: 'pending' })}
                        className="inline-block w-6 h-6 leading-6 rounded-full bg-yellow-50 text-yellow-700 font-bold text-center cursor-pointer hover:ring-2 hover:ring-yellow-400 transition"
                        title="Ver pendientes"
                      >{agentEntry.pending}</span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        onClick={() => setDetailAgent({ agent_id: agentEntry.id, agent_name: agentEntry.name, initialFilter: 'in_progress' })}
                        className="inline-block w-6 h-6 leading-6 rounded-full bg-blue-50 text-blue-700 font-bold text-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
                        title="Ver en proceso"
                      >{agentEntry.in_progress}</span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        onClick={() => setDetailAgent({ agent_id: agentEntry.id, agent_name: agentEntry.name, initialFilter: 'resolved' })}
                        className="inline-block w-6 h-6 leading-6 rounded-full bg-green-50 text-green-700 font-bold text-center cursor-pointer hover:ring-2 hover:ring-green-400 transition"
                        title="Ver resueltos"
                      >{agentEntry.resolved}</span>
                    </td>
                    <td className="py-2 pl-2 text-center font-bold text-slate-700">{agentEntry.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
