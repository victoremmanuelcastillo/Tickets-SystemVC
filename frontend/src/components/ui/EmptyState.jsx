// Pantalla vacía genérica con ícono, mensaje y acción opcional.
export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-16">
      {Icon && <Icon className="w-12 h-12 mx-auto mb-3 text-slate-300" />}
      <p className="text-slate-500 font-medium">{title}</p>
      {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
