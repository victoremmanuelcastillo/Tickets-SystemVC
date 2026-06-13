import { Search, X } from 'lucide-react';

export function TicketFilters({
  filterUser,
  filterProblem,
  filterAgent,
  filterSearch,
  onFilterUserChange,
  onFilterProblemChange,
  onFilterAgentChange,
  onFilterSearchChange,
  uniqueFilterUsers,
  uniqueFilterProblems,
  hasActiveFilters,
  onClearFilters,
  inProgressCount,
  pendingCount,
  variant = 'admin',
}) {
  const ringColor = variant === 'agent' ? 'focus:ring-emerald-400' : 'focus:ring-blue-400';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">

      {/* ── Búsqueda de texto libre ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={filterSearch}
          onChange={e => onFilterSearchChange(e.target.value)}
          placeholder="Buscar por usuario, problema, descripción..."
          className={`w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700
            focus:outline-none focus:ring-2 ${ringColor} placeholder-slate-400 transition`}
        />
        {filterSearch && (
          <button
            onClick={() => onFilterSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Selectores de filtro ── */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterUser}
          onChange={e => onFilterUserChange(e.target.value)}
          className={`flex-1 min-w-[140px] text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2
            text-slate-700 focus:outline-none focus:ring-2 ${ringColor} transition`}
        >
          <option value="">Todos los usuarios</option>
          {uniqueFilterUsers.map(userName => (
            <option key={userName} value={userName}>{userName}</option>
          ))}
        </select>

        <select
          value={filterProblem}
          onChange={e => onFilterProblemChange(e.target.value)}
          className={`flex-1 min-w-[140px] text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2
            text-slate-700 focus:outline-none focus:ring-2 ${ringColor} transition`}
        >
          <option value="">Todos los problemas</option>
          {uniqueFilterProblems.map(problemName => (
            <option key={problemName} value={problemName}>{problemName}</option>
          ))}
        </select>

        {variant === 'admin' && (
          <select
            value={filterAgent}
            onChange={e => onFilterAgentChange(e.target.value)}
            className={`flex-1 min-w-[140px] text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2
              text-slate-700 focus:outline-none focus:ring-2 ${ringColor} transition`}
          >
            <option value="">Todos los agentes</option>
            <option value="__unassigned__">Sin asignar</option>
          </select>
        )}

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg px-3 py-2 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Contadores rápidos ── */}
      {(inProgressCount > 0 || pendingCount > 0) && (
        <div className="flex gap-3 text-xs pt-1">
          {inProgressCount > 0 && (
            <span className="text-blue-600 font-semibold">{inProgressCount} en proceso</span>
          )}
          {pendingCount > 0 && (
            <span className="text-yellow-600 font-semibold">{pendingCount} pendientes</span>
          )}
        </div>
      )}
    </div>
  );
}
