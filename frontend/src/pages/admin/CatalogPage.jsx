import { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight,
  FolderOpen, Tag, AlertCircle, Save
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { PRIORITY_COLORS } from '../../lib/constants.js';

const PRIORITIES = ['Crítica', 'Alta', 'Media Alta', 'Media', 'Baja'];

/* ─── Modal crear / editar categoría ─────────────────────────── */
function CategoryModal({ initial, onSave, onClose, saving, error }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial ? { code: initial.code, name: initial.name } : { code: '', name: '' }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">
            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Código
            </label>
            <input
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              placeholder="ej. 1.6"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Nombre
            </label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="ej. Hardware"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end px-5 pb-5">
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-4 py-2 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.code.trim() || !form.name.trim()}
            className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl flex items-center gap-2 transition"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {isEdit ? 'Guardar cambios' : 'Crear categoría'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Fila de problema ──────────────────────────────────────── */
function ProblemRow({ problem, token, onUpdated, onDeleted }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);
  const [error,     setError]     = useState('');
  const [form,    setForm]    = useState({
    code: problem.code,
    name: problem.name,
    priority: problem.priority,
    resolution_hours: problem.resolution_hours,
    description: problem.description || '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const updated = await api.updateProblem(token, problem.id, form);
      onUpdated(updated);
      setIsEditing(false);
    } catch (err) { setError(err.message); }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el problema "${problem.name}"? También se eliminarán sus sugerencias.`)) return;
    try {
      await api.deleteProblem(token, problem.id);
      onDeleted(problem.id);
    } catch (e) { alert(e.message); }
  };

  if (isEditing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2 my-1">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Código</label>
            <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prioridad</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400">
              {PRIORITIES.map(priority => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Horas res.</label>
            <input type="number" min="1" value={form.resolution_hours}
              onChange={e => setForm(f => ({ ...f, resolution_hours: e.target.value }))}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descripción</label>
          <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={() => setIsEditing(false)}
            className="text-xs text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isSaving}
            className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-1.5 rounded-lg flex items-center gap-1 transition">
            {isSaving ? '...' : <><Check className="w-3 h-3" /> Guardar</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 py-2 px-2 rounded-xl hover:bg-slate-50 group transition">
      <Tag className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">{problem.code}</span>
          <span className="text-xs text-slate-600">{problem.name}</span>
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[problem.priority] || 'bg-gray-100 text-gray-500'}`}>
            {problem.priority}
          </span>
          <span className="text-[10px] text-slate-400">{problem.resolution_hours}h</span>
        </div>
        {problem.description && (
          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{problem.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
        <button onClick={() => setIsEditing(true)}
          className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Editar">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleDelete}
          className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Eliminar">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Formulario agregar problema ─────────────────────────────── */
function AddProblemForm({ token, categoryId, onAdded, onCancel }) {
  const [form,     setForm]     = useState({ code: '', name: '', priority: 'Media', resolution_hours: 8, description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const createdProblem = await api.createProblem(token, { ...form, category_id: categoryId });
      onAdded(createdProblem);
    } catch (err) { setError(err.message); }
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2 mt-2">
      <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Nuevo problema</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Código</label>
          <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required placeholder="1.x.x"
            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nombre del problema"
            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prioridad</label>
          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400">
            {PRIORITIES.map(priority => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Horas</label>
          <input type="number" min="1" value={form.resolution_hours}
            onChange={e => setForm(f => ({ ...f, resolution_hours: e.target.value }))}
            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descripción (opcional)</label>
        <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Descripción del problema..."
          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-green-400" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel}
          className="text-xs text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">
          Cancelar
        </button>
        <button type="submit" disabled={isSaving}
          className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-4 py-1.5 rounded-lg flex items-center gap-1 transition">
          {isSaving ? '...' : <><Plus className="w-3 h-3" /> Agregar</>}
        </button>
      </div>
    </form>
  );
}

/* ─── Tarjeta de categoría ─────────────────────────────────── */
function CategoryCard({ category, token, onCategoryUpdated, onCategoryDeleted }) {
  const [isExpanded,       setIsExpanded]       = useState(false);
  const [problems,         setProblems]         = useState(null);
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  const [isAddingProblem,  setIsAddingProblem]  = useState(false);
  const [isDeleting,       setIsDeleting]       = useState(false);

  const toggleExpand = async () => {
    setIsExpanded(v => !v);
    if (!problems) {
      setIsLoadingProblems(true);
      try {
        setProblems(await api.getProblems(token, category.id));
      } catch (err) {
        console.error('[CatalogPage] Error al cargar problemas:', err);
      }
      setIsLoadingProblems(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(
      `¿Eliminar la categoría "${category.name}"?\n\nSe eliminarán también todos sus problemas y sugerencias. Los tickets existentes de esta categoría no se eliminarán pero perderán la referencia.`
    )) return;
    setIsDeleting(true);
    try {
      await api.deleteCategory(token, category.id);
      onCategoryDeleted(category.id);
    } catch (err) {
      alert(err.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header de categoría */}
      <div className="flex items-center gap-2 p-4">
        <button onClick={toggleExpand} className="text-slate-400 hover:text-slate-600 transition shrink-0">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">{category.code}</span>
            <span className="font-semibold text-slate-800 text-sm">{category.name}</span>
          </div>
        </div>

        {/* Acciones de categoría */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onCategoryUpdated(category, 'edit')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-2.5 py-1.5 rounded-lg transition"
            title="Editar categoría"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editar</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-2.5 py-1.5 rounded-lg transition disabled:opacity-40"
            title="Eliminar categoría"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>

      {/* Lista de problemas */}
      {isExpanded && (
        <div className="border-t border-slate-100 px-4 pb-3">
          {isLoadingProblems ? (
            <p className="text-xs text-slate-400 py-3">Cargando problemas...</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {(problems || []).map(problem => (
                <ProblemRow
                  key={problem.id}
                  problem={problem}
                  token={token}
                  onUpdated={updated => setProblems(prev => prev.map(existing => existing.id === updated.id ? updated : existing))}
                  onDeleted={deletedId => setProblems(prev => prev.filter(existing => existing.id !== deletedId))}
                />
              ))}
              {(!problems || problems.length === 0) && (
                <p className="text-xs text-slate-400 italic py-2">Sin problemas en esta categoría.</p>
              )}
            </div>
          )}

          {isAddingProblem ? (
            <AddProblemForm
              token={token}
              categoryId={category.id}
              onAdded={createdProblem => { setProblems(prev => [...(prev || []), createdProblem]); setIsAddingProblem(false); }}
              onCancel={() => setIsAddingProblem(false)}
            />
          ) : (
            <button
              onClick={() => setIsAddingProblem(true)}
              className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar problema
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Página principal ──────────────────────────────────────── */
export default function CatalogPage({ session }) {
  const { token } = session;
  const [categories,    setCategories]    = useState([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [globalError,   setGlobalError]   = useState('');

  // Modal state
  const [modal,         setModal]         = useState(null); // null | { mode: 'create' } | { mode: 'edit', category }
  const [isModalSaving, setIsModalSaving] = useState(false);
  const [modalError,    setModalError]    = useState('');

  useEffect(() => {
    api.getCategories(token)
      .then(setCategories)
      .catch(() => setGlobalError('No se pudieron cargar las categorías.'))
      .finally(() => setIsLoading(false));
  }, [token]);

  const openCreate = () => { setModal({ mode: 'create' }); setModalError(''); };
  const openEdit   = (cat) => { setModal({ mode: 'edit', category: cat }); setModalError(''); };
  const closeModal = () => { setModal(null); setModalError(''); };

  const handleCategoryAction = (category, action) => {
    if (action === 'edit') openEdit(category);
  };

  const handleModalSave = async (form) => {
    setIsModalSaving(true);
    setModalError('');
    try {
      if (modal.mode === 'create') {
        const cat = await api.createCategory(token, form);
        setCategories(prev => [...prev, cat]);
      } else {
        const updated = await api.updateCategory(token, modal.category.id, form);
        setCategories(prev => prev.map(category => category.id === updated.id ? updated : category));
      }
      closeModal();
    } catch (e) { setModalError(e.message); }
    setIsModalSaving(false);
  };

  return (
    <div className="max-w-3xl">
      {/* Header con las 3 acciones principales */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Categorías y Problemas</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Gestiona las categorías y sus problemas disponibles en el sistema.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nueva categoría
          </button>
          <p className="text-[10px] text-slate-400 text-center">
            Usa <Pencil className="w-3 h-3 inline" /> / <Trash2 className="w-3 h-3 inline" /> en cada categoría
          </p>
        </div>
      </div>

      {/* Leyenda de acciones */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">¿Cómo gestionar categorías?</p>
        <ul className="space-y-0.5 text-blue-600 list-disc list-inside">
          <li><strong>Nueva categoría</strong> — botón arriba a la derecha</li>
          <li><strong>Editar categoría</strong> — botón "Editar" en cada tarjeta</li>
          <li><strong>Eliminar categoría</strong> — botón "Eliminar" en cada tarjeta (también elimina sus problemas)</li>
          <li><strong>Problemas</strong> — expande la categoría haciendo clic en la flecha</li>
        </ul>
      </div>

      {globalError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" /> {globalError}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay categorías aún</p>
          <button
            onClick={openCreate}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition"
          >
            Crear primera categoría
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              token={token}
              onCategoryUpdated={handleCategoryAction}
              onCategoryDeleted={deletedId => setCategories(prev => prev.filter(cat => cat.id !== deletedId))}
            />
          ))}
        </div>
      )}

      {/* Modal crear / editar */}
      {modal && (
        <CategoryModal
          initial={modal.mode === 'edit' ? modal.category : null}
          onSave={handleModalSave}
          onClose={closeModal}
          saving={isModalSaving}
          error={modalError}
        />
      )}
    </div>
  );
}
