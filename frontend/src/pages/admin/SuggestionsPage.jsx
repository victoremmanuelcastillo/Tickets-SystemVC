import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';
import { api } from '../../lib/api.js';

export default function SuggestionsPage({ session }) {
  const { token } = session;

  const [categories,   setCategories]   = useState([]);
  const [problems,     setProblems]     = useState([]);
  const [suggestions,  setSuggestions]  = useState([]);
  const [selectedCat,  setSelectedCat]  = useState(null);
  const [selectedProb, setSelectedProb] = useState(null);

  // Form state
  const [isAdding,  setIsAdding]  = useState(false);
  const [newText,   setNewText]   = useState('');
  const [editId,    setEditId]    = useState(null);
  const [editText,  setEditText]  = useState('');
  const [isSaving,  setIsSaving]  = useState(false);
  // Mobile step: 'categories' | 'problems' | 'suggestions'
  const [mobileStep, setMobileStep] = useState('categories');

  useEffect(() => {
    api.getCategories(token)
      .then(setCategories)
      .catch(err => console.error('[SuggestionsPage] Error al cargar categorías:', err));
  }, [token]);

  const handleSelectCategory = (category) => {
    setSelectedCat(category);
    setSelectedProb(null);
    setSuggestions([]);
    api.getProblems(token, category.id)
      .then(setProblems)
      .catch(err => console.error('[SuggestionsPage] Error al cargar problemas:', err));
    setMobileStep('problems');
  };

  const handleSelectProblem = async (problem) => {
    setSelectedProb(problem);
    setIsAdding(false);
    setEditId(null);
    try {
      const fetchedSuggestions = await api.getSuggestions(token, problem.id);
      setSuggestions(fetchedSuggestions);
    } catch (err) {
      console.error('[SuggestionsPage] Error al cargar sugerencias:', err);
    }
    setMobileStep('suggestions');
  };

  const handleAdd = async () => {
    if (!newText.trim() || !selectedProb) return;
    setIsSaving(true);
    try {
      const createdSuggestion = await api.createSuggestion(token, { problem_id: selectedProb.id, content: newText.trim() });
      setSuggestions(prev => [createdSuggestion, ...prev]);
      setNewText('');
      setIsAdding(false);
    } catch (err) {
      console.error('[SuggestionsPage] Error al crear sugerencia:', err);
    }
    setIsSaving(false);
  };

  const handleEdit = async (id) => {
    if (!editText.trim()) return;
    setIsSaving(true);
    try {
      const updatedSuggestion = await api.updateSuggestion(token, id, editText.trim());
      setSuggestions(prev => prev.map(suggestion => suggestion.id === id ? updatedSuggestion : suggestion));
      setEditId(null);
    } catch (err) {
      console.error('[SuggestionsPage] Error al editar sugerencia:', err);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta sugerencia?')) return;
    await api.deleteSuggestion(token, id);
    setSuggestions(prev => prev.filter(suggestion => suggestion.id !== id));
  };

  const CategoriesPanel = (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categorías</p>
      </div>
      <div className="divide-y divide-slate-100">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => handleSelectCategory(category)}
            className={`w-full flex items-center justify-between px-4 py-3 text-left transition text-sm
              ${selectedCat?.id === category.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <span>{category.code} {category.name}</span>
            <ChevronRight className="w-4 h-4 shrink-0 opacity-50" />
          </button>
        ))}
      </div>
    </div>
  );

  const ProblemsPanel = (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <button onClick={() => setMobileStep('categories')} className="lg:hidden text-slate-400 hover:text-slate-700 transition">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Problemas</p>
        {selectedCat && <span className="text-xs text-slate-400 truncate">— {selectedCat.name}</span>}
      </div>
      {!selectedCat ? (
        <p className="text-slate-400 text-sm text-center py-12 italic">Selecciona una categoría</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {problems.map(problem => (
            <button
              key={problem.id}
              onClick={() => handleSelectProblem(problem)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition text-sm
                ${selectedProb?.id === problem.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <span>{problem.code} {problem.name}</span>
              <ChevronRight className="w-4 h-4 shrink-0 opacity-50" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const SuggestionsPanel = (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => setMobileStep('problems')} className="lg:hidden text-slate-400 hover:text-slate-700 transition shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Sugerencias</p>
          {selectedProb && <span className="text-xs text-slate-400 truncate">— {selectedProb.name}</span>}
        </div>
        {selectedProb && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {!selectedProb ? (
          <p className="text-slate-400 text-sm text-center py-12 italic">Selecciona un problema</p>
        ) : (
          <>
            {selectedProb.description && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Descripción del caso</p>
                <p className="text-xs text-blue-800 leading-relaxed">{selectedProb.description}</p>
              </div>
            )}

            {isAdding && (
              <div className="border border-blue-200 rounded-xl p-3 bg-blue-50/50">
                <textarea
                  autoFocus
                  rows={3}
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  placeholder="Escribe la sugerencia... (puedes usar el Asistente IA para generarla)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-400"
                />
                <div className="flex gap-2 mt-2 justify-end">
                  <button onClick={() => { setIsAdding(false); setNewText(''); }} className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={handleAdd} disabled={isSaving || !newText.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition">
                    <Check className="w-3.5 h-3.5" /> Guardar
                  </button>
                </div>
              </div>
            )}

            {suggestions.length === 0 && !isAdding && (
              <div className="text-center py-10">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-slate-400 text-sm">Sin sugerencias aún.</p>
                <p className="text-slate-400 text-xs mt-1">Agrégalas manualmente o usa el Asistente IA.</p>
              </div>
            )}

            {suggestions.map(suggestion => (
              <div key={suggestion.id} className="border border-slate-200 rounded-xl p-3 bg-white">
                {editId === suggestion.id ? (
                  <>
                    <textarea
                      autoFocus
                      rows={3}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                      <button onClick={() => setEditId(null)} className="text-slate-500 p-1.5 rounded-lg hover:bg-slate-100 transition"><X className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(suggestion.id)} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition">
                        <Check className="w-3.5 h-3.5" /> Guardar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: suggestion.content }} />
                    <div className="flex gap-1.5 mt-2 justify-end">
                      <button onClick={() => { setEditId(suggestion.id); setEditText(suggestion.content); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(suggestion.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-slate-900 text-xl font-bold">Gestión de sugerencias</h1>
        <p className="text-slate-500 text-sm mt-0.5">Crea y edita las sugerencias de solución rápida que verán los usuarios.</p>
      </div>

      {/* Desktop: 3 columns always visible */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-5">
        {CategoriesPanel}
        {ProblemsPanel}
        {SuggestionsPanel}
      </div>

      {/* Mobile: step-by-step navigation */}
      <div className="lg:hidden">
        {mobileStep === 'categories' && CategoriesPanel}
        {mobileStep === 'problems' && ProblemsPanel}
        {mobileStep === 'suggestions' && SuggestionsPanel}
      </div>
    </div>
  );
}
