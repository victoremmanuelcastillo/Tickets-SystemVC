// Componente genérico de badge. No conoce nada de tickets ni de lógica de negocio.
export function Badge({ label, colorClass, icon: Icon }) {
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${colorClass}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}
