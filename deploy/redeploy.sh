#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════
# MONPRO — Redéploiement rapide
# Exécuter depuis /opt/monpro/deploy
# ═══════════════════════════════════════════════════════════

cd /opt/monpro

echo "Pulling latest code..."
git pull origin main

echo "Rebuilding & restarting API..."
cd deploy
docker compose up -d --build api

echo "Waiting for API to be healthy..."
sleep 5

echo "Running migrations..."
docker compose exec api npx prisma migrate deploy

echo "Running seed (idempotent)..."
docker compose exec api npx tsx prisma/seed.ts 2>/dev/null || \
  docker compose exec api npx --yes tsx prisma/seed.ts

echo ""
echo "✓ Redéploiement terminé"
docker compose ps
echo ""
curl -s https://srv1288413.hstgr.cloud/api/v1/health
echo ""
