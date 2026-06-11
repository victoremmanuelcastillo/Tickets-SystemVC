# Sistema de Tickets — TI

Stack: **PostgreSQL + Node.js/Express** (Docker) + **React + Tailwind** (Vite)

---

## Requisitos

- Docker Desktop corriendo
- Node.js 20+ (para el frontend)
- Una API Key de Anthropic (para el Asistente IA)

---

## Configuración inicial

### 1. Crea el archivo de variables de entorno

```bash
# En la raíz del proyecto
cp .env.example .env
```

Edita `.env` y pon tu API Key de Anthropic:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```

### 2. Levanta el backend con Docker

```bash
docker-compose up -d
```

Esto arranca:
- **PostgreSQL** en `localhost:5432`
- **API Express** en `localhost:3000`

La base de datos se inicializa automáticamente con:
- Categorías y problemas predefinidos
- Usuario admin por defecto: `admin@empresa.com` / `admin123`

### 3. Instala y arranca el frontend

```bash
cd frontend
npm install
npm run dev
```

Abre → **http://localhost:5173**

---

## Flujo del sistema

### Vista Usuario
1. Login con sus credenciales
2. Selecciona categoría → problema
3. Ve la sugerencia de solución rápida
4. Agrega información adicional y envía

### Vista Administrador
- **Tickets**: Ve todos los tickets, cambia estados (Pendiente / En proceso / Resuelto)
- **Sugerencias**: Crea, edita y elimina sugerencias por problema
- **Asistente IA**: Selecciona un problema → Claude genera texto de sugerencia → el admin lo aprueba y guarda
- **Usuarios**: Crea nuevas cuentas de usuario o administrador

---

## Comandos útiles

```bash
# Ver logs de la API
docker-compose logs -f api

# Reiniciar solo la API
docker-compose restart api

# Bajar todo (conserva los datos de la DB)
docker-compose down

# Bajar y eliminar la base de datos (reset total)
docker-compose down -v
```

---

## Estructura del proyecto

```
tickets-system/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js          ← Entry point Express
│       ├── db/index.js       ← Pool PostgreSQL + schema + seed
│       ├── middleware/auth.js ← JWT middleware
│       └── routes/
│           ├── auth.js        ← Login + gestión de usuarios
│           ├── catalog.js     ← Categorías y problemas
│           ├── suggestions.js ← CRUD sugerencias
│           ├── tickets.js     ← CRUD tickets
│           └── ai.js          ← Proxy a Claude API
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── lib/api.js         ← Cliente HTTP
        ├── components/Login.jsx
        └── pages/
            ├── UsuarioPage.jsx
            └── admin/
                ├── AdminLayout.jsx
                ├── TicketsPage.jsx
                ├── SuggestionsPage.jsx
                ├── AIPage.jsx
                └── UsersPage.jsx
```
