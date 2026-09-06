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

echo "Running migrations..."
docker compose exec api npx prisma migrate deploy

echo ""
echo "✓ Redéploiement terminé"
docker compose ps
