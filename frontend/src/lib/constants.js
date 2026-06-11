// Fuente única de verdad para constantes de UI.
// Todos los archivos deben importar desde aquí — nunca redefinir localmente.

// --- Prioridades ---

// Orden numérico para ordenar tickets (menor número = más urgente)
export const PRIORITY_ORDER = {
  'Crítica':    1,
  'Alta':       2,
  'Media Alta': 3,
  'Media':      4,
  'Baja':       5,
};

// Estilos visuales por prioridad: badge (texto), barra de color superior
export const PRIORITY_STYLE = {
  'Crítica':    { badge: 'bg-red-100 text-red-700 border-red-200',          bar: 'bg-red-500' },
  'Alta':       { badge: 'bg-orange-100 text-orange-700 border-orange-200', bar: 'bg-orange-400' },
  'Media Alta': { badge: 'bg-amber-100 text-amber-700 border-amber-200',    bar: 'bg-amber-400' },
  'Media':      { badge: 'bg-blue-100 text-blue-700 border-blue-200',       bar: 'bg-blue-400' },
  'Baja':       { badge: 'bg-gray-100 text-gray-500 border-gray-200',       bar: 'bg-gray-300' },
};

// Alias usado en UsuarioPage donde solo se necesita el color del badge
export const PRIORITY_COLOR = {
  'Crítica':    'bg-red-100 text-red-700 border-red-200',
  'Alta':       'bg-orange-100 text-orange-700 border-orange-200',
  'Media Alta': 'bg-amber-100 text-amber-700 border-amber-200',
  'Media':      'bg-blue-100 text-blue-700 border-blue-200',
  'Baja':       'bg-gray-100 text-gray-600 border-gray-200',
};

// Colores para la barra de colores del CatalogPage
export const PRIORITY_COLORS = {
  'Crítica':    'bg-red-100 text-red-700',
  'Alta':       'bg-orange-100 text-orange-700',
  'Media Alta': 'bg-amber-100 text-amber-700',
  'Media':      'bg-blue-100 text-blue-700',
  'Baja':       'bg-gray-100 text-gray-600',
};

// --- Estados de ticket ---

// Configuración completa de estado: label visible + clases de color para badge
// Nota: los íconos (Circle, Clock, CheckCircle) se importan en cada componente
// que los necesite ya que son de lucide-react y no deben vivir en constants.js
export const STATUS_CONFIG = {
  pending:     { label: 'Pendiente',  style: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  in_progress: { label: 'En proceso', style: 'bg-blue-100 text-blue-700 border-blue-200' },
  resolved:    { label: 'Resuelto',   style: 'bg-green-100 text-green-700 border-green-200' },
};

// Alias de solo labels, para tablas y textos simples
export const STATUS_LABEL = {
  pending:     'Pendiente',
  in_progress: 'En proceso',
  resolved:    'Resuelto',
};

// Alias de solo clases de color, para badges de estado
export const STATUS_COLOR = {
  pending:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved:    'bg-green-100 text-green-700 border-green-200',
};

// Labels de filtro (forma plural, para botones de filtro en ReportsPage)
export const STATUS_FILTER_LABELS = {
  pending:     'Pendientes',
  in_progress: 'En proceso',
  resolved:    'Resueltos',
};

// Clases de color para botones de filtro de estado (incluye ring para active)
export const STATUS_FILTER_COLORS = {
  pending:     'bg-yellow-100 text-yellow-700 border-yellow-300 ring-yellow-400',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300 ring-blue-400',
  resolved:    'bg-green-100 text-green-700 border-green-300 ring-green-400',
};
