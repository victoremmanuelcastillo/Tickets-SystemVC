import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, User, X, Check, AlertCircle, Crown, Pencil } from 'lucide-react';
import { api } from '../../lib/api.js';

const SPECIALTIES = [
  '',
  'Infraestructura',
  'Soporte Técnico',
  'Accesos',
  'Correo Electrónico',
  'Consulta General',
];

const SPECIALTY_COLOR = {
  'Infraestructura':    'bg-purple-100 text-purple-700 border-purple-200',
  'Soporte Técnico':    'bg-blue-100 text-blue-700 border-blue-200',
  'Accesos':            'bg-orange-100 text-orange-700 border-orange-200',
  'Correo Electrónico': 'bg-pink-100 text-pink-700 border-pink-200',
  'Consulta General':   'bg-teal-100 text-teal-700 border-teal-200',
};

export default function UsersPage({ session }) {
  const { token, user: me } = session;
  const isPrimary = me.is_primary_admin === true;

  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'usuario', area: '', specialty: '' });
  const [formSaving, setFormSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setUsers(await api.getUsers(token)); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormSaving(true);
    setError('');
    try {
      await api.register(token, form);
      setSuccess(`Usuario "${form.name}" creado correctamente.`);
      setForm({ name: '', email: '', password: '', role: 'usuario', area: '', specialty: '' });
      setShowForm(false);
      load();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
    setFormSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Eliminar al usuario "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.deleteUser(token, id);
      setUsers(prev => prev.filter(existingUser => existingUser.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditSpecialty(u.specialty || '');
    setEditRole(u.role);
  };

  const cancelEdit = () => { setEditingId(null); };

  const handleSaveEdit = async (u) => {
    setSaving(true);
    setError('');
    try {
      const body = { specialty: editSpecialty || null };
      if (isPrimary && u.id !== me.id) body.role = editRole;
      const updated = await api.updateUserProfile(token, u.id, body);
      setUsers(prev => prev.map(existingUser => existingUser.id === u.id ? { ...existingUser, ...updated } : existingUser));
      setEditingId(null);
      setSuccess('Usuario actualizado.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Usuarios</h1>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} cuentas registradas</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          {showForm ? <><X className="w-4 h-4" /> Cancelar</> : <><UserPlus className="w-4 h-4" /> Nuevo usuario</>}
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
          <Check className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-5">
          <h2 className="font-bold text-slate-800 mb-4">Crear nuevo usuario</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { field: 'name',     label: 'Nombre completo',     type: 'text',     required: true,  placeholder: 'Juan Pérez' },
              { field: 'email',    label: 'Correo electrónico',  type: 'email',    required: true,  placeholder: 'juan@empresa.com' },
              { field: 'password', label: 'Contraseña',          type: 'password', required: true,  placeholder: '••••••••' },
              { field: 'area',     label: 'Área / Departamento', type: 'text',     required: false, placeholder: 'Finanzas — Segundo Piso' },
            ].map(({ field, label, type, required, placeholder }) => (
              <div key={field}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                <input
                  type={type}
                  required={required}
                  placeholder={placeholder}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rol</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="usuario">Usuario</option>
                {isPrimary && <option value="agente">Agente</option>}
                {isPrimary && <option value="admin">Administrador</option>}
              </select>
            </div>

            {(form.role === 'admin' || form.role === 'agente') && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Especialidad del admin</label>
                <select
                  value={form.specialty}
                  onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">Sin especialidad (ve todos)</option>
                  {SPECIALTIES.filter(Boolean).map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={formSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition"
              >
                {formSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Crear usuario
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <div key={user.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                {/* Avatar + info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    user.is_primary_admin ? 'bg-amber-400 text-white' :
                    user.role === 'admin'  ? 'bg-amber-100 text-amber-700' :
                                            'bg-blue-100 text-blue-700'
                  }`}>
                    {user.is_primary_admin ? <Crown className="w-4 h-4" /> : user.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                      {user.is_primary_admin && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold uppercase">Admin Principal</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    {user.area && <p className="text-xs text-slate-400 mt-0.5">{user.area}</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {user.id !== me.id && !user.is_primary_admin && (
                    <button
                      onClick={() => editingId === user.id ? cancelEdit() : startEdit(user)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {user.id !== me.id && !user.is_primary_admin && (
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Badges row */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  user.role === 'admin'  ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  user.role === 'agente' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                          'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {user.role === 'admin' || user.role === 'agente' ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                  {user.role === 'admin' ? 'Administrador' : user.role === 'agente' ? 'Agente' : 'Usuario'}
                </span>

                {user.specialty && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${SPECIALTY_COLOR[user.specialty] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {user.specialty}
                  </span>
                )}

                {(user.role === 'admin' || user.role === 'agente') && !user.specialty && (
                  <span className="text-[10px] text-slate-400 italic">Ve todos los tickets</span>
                )}
              </div>

              {/* Edit panel */}
              {editingId === user.id && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                  {/* Specialty */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Especialidad {user.role === 'usuario' ? '(solo para agentes/admins)' : ''}
                    </label>
                    <select
                      value={editSpecialty}
                      onChange={e => setEditSpecialty(e.target.value)}
                      disabled={user.role !== 'admin' && user.role !== 'agente'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 transition"
                    >
                      <option value="">Sin especialidad (ve todos)</option>
                      {SPECIALTIES.filter(Boolean).map(specialty => (
                        <option key={specialty} value={specialty}>{specialty}</option>
                      ))}
                    </select>
                  </div>

                  {/* Role — only primary admin */}
                  {isPrimary && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rol</label>
                      <select
                        value={editRole}
                        onChange={e => setEditRole(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      >
                        <option value="usuario">Usuario</option>
                        <option value="agente">Agente</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button onClick={cancelEdit} className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg transition">
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveEdit(user)}
                      disabled={saving}
                      className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                    >
                      {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Guardar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
