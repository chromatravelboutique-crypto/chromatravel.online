#!/usr/bin/env bash
# SESSION START HOOK — chromatravel.online
# Se ejecuta automáticamente al abrir Claude Code en este proyecto.
# Hace un health check rápido de los dos sitios y reporta el estado.

CHROMA_URL="https://chromatravel.online"
FENIX_URL="https://fenixtraveler.com"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  HEALTH CHECK AUTOMÁTICO — chromatravel.online       ║"
echo "╚══════════════════════════════════════════════════════╝"

check_site() {
  local name="$1"
  local url="$2"
  local t0=$(date +%s%3N)
  local status=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 8 "${url}/api/health" 2>/dev/null)
  local t1=$(date +%s%3N)
  local ms=$((t1 - t0))

  if [ "$status" = "200" ]; then
    if [ "$ms" -gt 2000 ]; then
      echo "  ⚠️  $name: OK pero lento (${ms}ms)"
    else
      echo "  ✅ $name: OK (${ms}ms)"
    fi
  elif [ "$status" = "000" ]; then
    echo "  ❌ $name: SIN RESPUESTA (timeout/caído)"
  else
    echo "  ❌ $name: HTTP $status"
  fi
}

check_site "chromatravel.online" "$CHROMA_URL"
check_site "fenixtraveler.com  " "$FENIX_URL"

# Día de la semana (1=lunes)
DOW=$(date +%u)
WEEK=$(date +%V)
if [ "$DOW" = "1" ]; then
  echo ""
  echo "  📅 HOY ES LUNES — ejecuta el mantenimiento semanal:"
  echo "     node scripts/weekly-maintenance.mjs"
  echo ""
  BRAND=$([ $((WEEK % 2)) -ne 0 ] && echo "Fénix Traveler" || echo "Chroma Travel")
  echo "  📝 Blog pendiente esta semana: $BRAND"
fi

echo ""
