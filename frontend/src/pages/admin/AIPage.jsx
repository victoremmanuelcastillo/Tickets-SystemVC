import { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, Send, Plus, Copy, Check, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api.js';

export default function AIPage({ session }) {
  const { token } = session;

  const [categories,   setCategories]   = useState([]);
  const [problems,     setProblems]     = useState([]);
  const [catId,        setCatId]        = useState('');
  const [probId,       setProbId]       = useState('');
  const [currentSug,   setCurrentSug]   = useState('');
  const [generated,    setGenerated]    = useState('');
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [error,        setError]        = useState('');
  const [saved,        setSaved]        = useState(false);

  const selectedProb = problems.find(p => p.id === parseInt(probId));

  useEffect(() => { api.getCategories(token).then(setCategories); }, [token]);

  useEffect(() => {
    if (!catId) return;
    setProbId('');
    setCurrentSug('');
    setGenerated('');
    api.getProblems(token, catId).then(setProblems);
  }, [catId, token]);

  useEffect(() => {
    if (!probId) { setCurrentSug(''); setGenerated(''); return; }
    setSaved(false);
    api.getSuggestions(token, probId).then(sug => setCurrentSug(sug[0]?.content || ''));
  }, [probId, token]);

  const handleGenerate = async () => {
    if (!selectedProb) return;
    setLoading(true);
    setError('');
    setGenerated('');
    setSaved(false);
    try {
      const { suggestion } = await api.aiSuggest(token, selectedProb.name, currentSug);
      setGenerated(suggestion);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!generated || !probId) return;
    setSaving(true);
    try {
      await api.createSuggestion(token, { problem_id: parseInt(probId), content: generated });
      setSaved(true);
      setCurrentSug(generated);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-slate-900 text-xl font-bold">Asistente IA</h1>
          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Claude</span>
        </div>
        <p className="text-slate-500 text-sm">
          Selecciona un problema y pídele a Claude que genere o mejore la sugerencia. Tú decides si la agregas.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">

        {/* Category selector */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoría</label>
          <div className="relative">
            <select
              value={catId}
              onChange={e => setCatId(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="">Selecciona una categoría...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.code} {c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Problem selector */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Problema</label>
          <div className="relative">
            <select
              value={probId}
              onChange={e => setProbId(e.target.value)}
              disabled={!catId}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
            >
              <option value="">{catId ? 'Selecciona el problema...' : 'Primero elige una categoría...'}</option>
              {problems.map(p => <option key={p.id} value={p.id}>{p.code} {p.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Current suggestion */}
        {probId && (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sugerencia actual</label>
            <div className={`rounded-xl px-4 py-3 text-sm border ${currentSug ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-50 text-slate-400 border-slate-200 italic'}`}>
              {currentSug || 'Sin sugerencia registrada — Claude generará una nueva.'}
            </div>
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !probId}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> {currentSug ? 'Mejorar sugerencia con IA' : 'Generar sugerencia con IA'}</>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Generated result */}
        {generated && (
          <div className="border border-emerald-200 rounded-xl overflow-hidden">
            <div className="bg-emerald-50 px-4 py-2 flex items-center justify-between border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Propuesta de Claude</span>
              </div>
              <button onClick={handleCopy} className="text-emerald-600 hover:text-emerald-800 transition">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="p-4 bg-white">
              <p className="text-sm text-slate-700 leading-relaxed">{generated}</p>
            </div>
            <div className="px-4 pb-4 bg-white">
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className={`w-full font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition ${
                  saved
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50'
                }`}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saved ? (
                  <><Check className="w-4 h-4" /> Guardado como sugerencia</>
                ) : (
                  <><Plus className="w-4 h-4" /> Agregar como sugerencia</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
