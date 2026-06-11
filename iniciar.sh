#!/bin/bash
# =============================================================
#  iniciar.sh — arranca el sistema completo de tickets
#  Requisitos: Docker Desktop corriendo, Node.js instalado
# =============================================================

set -e

echo ""
echo "============================================"
echo "   Sistema de Tickets — Iniciando..."
echo "============================================"
echo ""

# --- 1. Backend (Docker) ---
echo "[1/3] Levantando backend con Docker..."

if ! docker info > /dev/null 2>&1; then
  echo ""
  echo "ERROR: Docker Desktop no está corriendo."
  echo "Ábrelo y vuelve a ejecutar este script."
  exit 1
fi

docker-compose up -d --build
echo "Contenedores levantados."

# --- 2. Esperar que la API responda (máx 60 segundos) ---
echo ""
echo "[2/3] Esperando que la API esté lista..."

MAX_WAIT=60
ELAPSED=0
until curl -s http://localhost:3000/api/health > /dev/null 2>&1; do
  if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo ""
    echo "ERROR: La API no respondió en ${MAX_WAIT}s."
    echo "Revisa los logs con:  docker-compose logs api"
    exit 1
  fi
  printf "."
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done
echo ""
echo "API lista en ${ELAPSED}s."

# --- 3. Frontend ---
echo ""
echo "[3/3] Preparando frontend..."

cd frontend

if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias (solo la primera vez)..."
  npm install
fi

# Obtener IP local para compartir con otros
IP=$(powershell.exe -Command \
  "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \
    \$_.IPAddress -notlike '127.*' -and \
    \$_.IPAddress -notlike '172.*' -and \
    \$_.IPAddress -notlike '169.*' \
  } | Select-Object -First 1).IPAddress" 2>/dev/null | tr -d '\r')

echo ""
echo "============================================"
echo " Backend:  http://localhost:3000"
echo " Frontend: http://localhost:5173"
if [ -n "$IP" ]; then
echo ""
echo " Para que otros en tu red accedan:"
echo " http://$IP:5173"
fi
echo "============================================"
echo ""
echo "Presiona Ctrl+C para detener el frontend."
echo "(El backend seguirá corriendo en Docker)"
echo ""

npm run dev -- --host
