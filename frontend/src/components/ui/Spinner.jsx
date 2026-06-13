// Spinner de carga reutilizable. Size: 'sm' | 'md' | 'lg'
const SIZE_CLASS = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-12 h-12 border-4',
};

export function Spinner({ size = 'md', colorClass = 'border-blue-600' }) {
  return (
    <div className={`${SIZE_CLASS[size]} ${colorClass} border-t-transparent rounded-full animate-spin`} />
  );
}
