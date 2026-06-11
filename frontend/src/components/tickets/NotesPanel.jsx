import { useState, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { api } from '../../lib/api.js';
import { formatDate } from '../../lib/utils.js';
import { useToast } from '../ui/ToastContext.jsx';

// Estilos que varían según el rol que usa el panel
const VARIANT_STYLES = {
  admin: {
    dotColor:    'bg-blue-400',
    ringColor:   'focus:ring-blue-400',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
  },
  agent: {
    dotColor:    'bg-emerald-400',
    ringColor:   'focus:ring-emerald-400',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
  },
};

/**
 * Panel de notas internas de un ticket.
 * Muestra el historial de notas y permite agregar nuevas (si el ticket no está resuelto).
 *
 * @param {string}  token      — JWT del usuario autenticado
 * @param {number}  ticketId   — ID del ticket
 * @param {boolean} isResolved — si true, oculta el formulario de nueva nota
 * @param {'admin'|'agent'} variant — controla colores del panel
 */
export function NotesPanel({ token, ticketId, isResolved, variant = 'admin' }) {
  const showToast = useToast();
  const [noteList,   setNoteList]   = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [noteText,   setNoteText]   = useState('');
  const [isSaving,   setIsSaving]   = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');

  const styles = VARIANT_STYLES[variant];

  useEffect(() => {
    api.getTicketNotes(token, ticketId)
      .then(notes => { setNoteList(notes); setIsLoading(false); })
      .catch(() => {
        setIsLoading(false);
        showToast('No se pudieron cargar las notas', 'error');
      });
  }, [token, ticketId]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setIsSaving(true);
    setErrorMsg('');
    try {
      const newNote = await api.addTicketNote(token, ticketId, noteText.trim());
      setNoteList(currentNotes => [...currentNotes, newNote]);
      setNoteText('');
      showToast('Nota agregada', 'success');
    } catch (error) {
      const message = error.message || 'Error al agregar la nota';
      setErrorMsg(message);
      showToast(message, 'error');
    }
    setIsSaving(false);
  };

  return (
    <div className="border-t border-slate-100 bg-slate-50 px-4 pt-3 pb-4 space-y-3">

      {/* ── Título ── */}
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" /> Seguimiento / Notas internas
      </p>

      {/* ── Lista de notas ── */}
      {isLoading ? (
        <p className="text-xs text-slate-400">Cargando...</p>
      ) : noteList.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Sin notas aún.</p>
      ) : (
        <div className="space-y-2">
          {noteList.map((note, index) => (
            <div key={note.id} className="flex gap-2">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full ${styles.dotColor} mt-1 shrink-0`} />
                {index < noteList.length - 1 && (
                  <div className="w-0.5 flex-1 bg-slate-200 mt-1" />
                )}
              </div>
              <div className="flex-1 pb-1">
                <p className="text-xs text-slate-700 leading-relaxed">{note.note}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {note.admin_name} · {formatDate(note.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Formulario nueva nota / mensaje de resuelto ── */}
      {isResolved ? (
        <p className="text-xs text-slate-400 italic bg-slate-100 rounded-lg px-3 py-2">
          Ticket resuelto — no se pueden agregar más notas.
        </p>
      ) : (
        <>
          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isSaving && handleAddNote()}
              placeholder="Agregar nota de seguimiento..."
              className={`flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs
                text-slate-700 focus:outline-none focus:ring-2 ${styles.ringColor} placeholder-slate-400`}
            />
            <button
              onClick={handleAddNote}
              disabled={isSaving || !noteText.trim()}
              className={`${styles.buttonColor} disabled:opacity-40 text-white px-3 py-2
                rounded-lg transition flex items-center gap-1 text-xs font-semibold`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
