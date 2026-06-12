#!/usr/bin/env bash
# Deploy Panini Tracker → /home/projects/panini-tracker (VPS GCB)
# Uso: ./scripts/deploy-vps.sh
set -euo pipefail

VPS_HOST="${VPS_HOST:-root@62.169.23.24}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/vps_estacionamiento}"
REMOTE_DIR="${REMOTE_DIR:-/home/projects/panini-tracker}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Crear directorio ${REMOTE_DIR} en VPS"
ssh -i "${SSH_KEY}" "${VPS_HOST}" "mkdir -p ${REMOTE_DIR}"

echo "==> Sincronizar código"
if command -v rsync >/dev/null 2>&1; then
  rsync -avz \
    --exclude node_modules \
    --exclude .next \
    --exclude .git \
    --exclude .env \
    --exclude 'terminals' \
    --exclude '.cursor' \
    -e "ssh -i ${SSH_KEY}" \
    "${ROOT}/" "${VPS_HOST}:${REMOTE_DIR}/"
else
  echo "(rsync no disponible — usando tar+ssh)"
  tar -C "${ROOT}" -czf - \
    --exclude node_modules \
    --exclude .next \
    --exclude .git \
    --exclude .env \
    --exclude terminals \
    --exclude .cursor \
    . | ssh -i "${SSH_KEY}" "${VPS_HOST}" "tar -xzf - -C ${REMOTE_DIR}"
fi

echo "==> .env inicial (si no existe)"
ssh -i "${SSH_KEY}" "${VPS_HOST}" bash -s <<EOF
set -euo pipefail
cd ${REMOTE_DIR}
if [ ! -f .env ]; then
  PG_PASS=\$(openssl rand -hex 16)
  AUTH=\$(openssl rand -base64 32 | tr -d '\n')
  NOTIFY=\$(openssl rand -hex 24)
  cat > .env <<ENV
# Generado automáticamente — completa ADMIN_EMAILS, RESEND, etc.
POSTGRES_USER=panini
POSTGRES_PASSWORD=\${PG_PASS}
POSTGRES_DB=panini_tracker
DATABASE_URL=postgresql://panini:\${PG_PASS}@panini_db:5432/panini_tracker?schema=public
AUTH_SECRET=\${AUTH}
NEXTAUTH_URL=https://panini.gcbprojects.site
ADMIN_EMAILS=tu@email.com
RESEND_API_KEY=
EMAIL_FROM="Panini Tracker <onboarding@resend.dev>"
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
WS_PORT=3002
NEXT_PUBLIC_WS_URL=wss://ws.panini.gcbprojects.site
WS_NOTIFY_URL=http://panini_ws:3002/internal/market-changed
WS_NOTIFY_SECRET=\${NOTIFY}
NODE_ENV=production
ENV
  echo "Creado .env con POSTGRES_PASSWORD y AUTH_SECRET generados."
  echo "Edita ADMIN_EMAILS, RESEND_API_KEY y EMAIL_FROM:"
  echo "  nano ${REMOTE_DIR}/.env"
else
  echo ".env ya existe — no se sobrescribe."
  if ! grep -q '^WS_NOTIFY_SECRET=' .env 2>/dev/null; then
    NOTIFY=\$(openssl rand -hex 24)
    cat >> .env <<ENV

WS_NOTIFY_URL=http://panini_ws:3002/internal/market-changed
WS_NOTIFY_SECRET=\${NOTIFY}
ENV
    echo "Añadido WS_NOTIFY_SECRET al .env existente."
  fi
  if ! grep -q '^NEXT_PUBLIC_WS_URL=' .env 2>/dev/null; then
    echo 'NEXT_PUBLIC_WS_URL=wss://ws.panini.gcbprojects.site' >> .env
  fi
fi
EOF

echo "==> Build y arranque Docker"
ssh -i "${SSH_KEY}" "${VPS_HOST}" bash -s <<EOF
set -euo pipefail
cd ${REMOTE_DIR}
docker compose build app ws
docker compose up -d
sleep 5
docker compose ps
docker compose exec -T app wget -qO- http://127.0.0.1:3000/api/health 2>/dev/null || echo "(health pendiente — revisa logs)"
EOF

echo ""
echo "==> Deploy en ${REMOTE_DIR} completado."
echo "    Siguiente: DNS + nginx (deploy/nginx-panini.conf.snippet) + certbot"
echo "    https://panini.gcbprojects.site/api/health"
