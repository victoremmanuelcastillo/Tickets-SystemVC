import { useState, useEffect } from 'react';
import Login       from './components/Login.jsx';
import UsuarioPage from './pages/UsuarioPage.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AgentLayout from './pages/agent/AgentLayout.jsx';
import { ToastProvider } from './components/ui/ToastContext.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('st_session');
      if (saved) setSession(JSON.parse(saved));
    } catch {}
    setLoading(false);
  }, []);

  const handleLogin = (user, token) => {
    const newSession = { user, token };
    setSession(newSession);
    localStorage.setItem('st_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('st_session');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!session) return <ToastProvider><Login onLogin={handleLogin} /></ToastProvider>;

  if (session.user.role === 'admin')
    return <ToastProvider><AdminLayout session={session} onLogout={handleLogout} /></ToastProvider>;

  if (session.user.role === 'agente')
    return <ToastProvider><AgentLayout session={session} onLogout={handleLogout} /></ToastProvider>;

  return <ToastProvider><UsuarioPage session={session} onLogout={handleLogout} /></ToastProvider>;
}
