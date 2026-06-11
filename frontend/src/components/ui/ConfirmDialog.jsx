import { AlertTriangle } from 'lucide-react';

/**
 * Modal de confirmación antes de una acción destructiva o irreversible.
 *
 * @param {string}   title       — título del modal
 * @param {string}   message     — descripción de la acción a confirmar
 * @param {string}   confirmLabel — texto del botón de confirmación
 * @param {string}   [confirmStyle] — clases extra para el botón de confirmar
 * @param {Function} onConfirm   — callback al confirmar
 * @param {Function} onCancel    — callback al cancelar
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  confirmStyle = 'bg-red-600 hover:bg-red-700',
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >

        {/* ── Ícono + título ── */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <h2 className="font-bold text-slate-800 text-base">{title}</h2>
        </div>

        {/* ── Mensaje ── */}
        <p className="text-sm text-slate-600 leading-relaxed">{message}</p>

        {/* ── Acciones ── */}
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition ${confirmStyle}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
