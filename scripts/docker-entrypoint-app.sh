#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Starting Next.js on port ${PORT:-3000}..."
exec npm run start -- -p "${PORT:-3000}" -H "${HOSTNAME:-0.0.0.0}"
