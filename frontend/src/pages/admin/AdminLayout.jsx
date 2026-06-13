import { useState } from 'react';
import { Ticket, Lightbulb, Sparkles, Users, LogOut, Menu, BarChart2, Crown, FolderOpen } from 'lucide-react';
import TicketsPage     from './TicketsPage.jsx';
import SuggestionsPage from './SuggestionsPage.jsx';
import AIPage          from './AIPage.jsx';
import UsersPage       from './UsersPage.jsx';
import ReportsPage     from './ReportsPage.jsx';
import CatalogPage     from './CatalogPage.jsx';

const TABS = [
  { id: 'tickets',     label: 'Tickets',      icon: Ticket },
  { id: 'suggestions', label: 'Sugerencias',  icon: Lightbulb },
  { id: 'reports',     label: 'Reportes',     icon: BarChart2 },
  { id: 'ai',          label: 'Asistente IA', icon: Sparkles },
  { id: 'users',       label: 'Usuarios',     icon: Users },
  { id: 'catalog',     label: 'Categorías',   icon: FolderOpen },
];

export default function AdminLayout({ session, onLogout }) {
  const [tab,              setTab]              = useState('tickets');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const TabComponent = {
    tickets:     <TicketsPage     session={session} />,
    suggestions: <SuggestionsPage session={session} />,
    reports:     <ReportsPage     session={session} />,
    ai:          <AIPage          session={session} />,
    users:       <UsersPage       session={session} />,
    catalog:     <CatalogPage     session={session} />,
  }[tab];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 bg-slate-900 flex flex-col
        transform transition-transform duration-200
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Sistema TI</p>
              <p className="text-slate-400 text-[10px] mt-0.5">Panel Administrador</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
                ${tab === id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              session.user.is_primary_admin ? 'bg-amber-400 text-white' : 'bg-amber-500 text-slate-900'
            }`}>
              {session.user.is_primary_admin
                ? <Crown className="w-4 h-4" />
                : session.user.name[0].toUpperCase()
              }
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{session.user.name}</p>
              <p className="text-slate-500 text-[10px] truncate">
                {session.user.is_primary_admin ? 'Admin Principal' : session.user.specialty || 'Administrador'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 text-slate-400 hover:text-white text-xs py-2 px-3 rounded-lg hover:bg-slate-800 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay isMobileMenuOpen */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 bg-slate-900 px-4 py-3 border-b border-slate-800">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-bold text-sm">
            {TABS.find(tabItem => tabItem.id === tab)?.label}
          </span>
        </div>

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {TabComponent}
        </main>
      </div>
    </div>
  );
}
