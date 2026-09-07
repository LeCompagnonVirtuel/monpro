#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════
# MONPRO — Script de setup VPS (Ubuntu 22/24)
# Exécuter en root: bash setup-vps.sh
# ═══════════════════════════════════════════════════════════

DOMAIN="srv1288413.hstgr.cloud"
EMAIL="${1:-}"

if [ -z "$EMAIL" ]; then
  echo "Usage: bash setup-vps.sh your-email@example.com"
  echo "L'email est requis pour Let's Encrypt SSL"
  exit 1
fi

echo "══════════════════════════════════════"
echo "  MONPRO VPS Setup — $DOMAIN"
echo "══════════════════════════════════════"

# 1. System updates
echo "[1/6] Mise à jour système..."
apt-get update && apt-get upgrade -y

# 2. Install Docker
echo "[2/6] Installation Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# 3. Install Docker Compose plugin
echo "[3/6] Installation Docker Compose..."
if ! docker compose version &> /dev/null; then
  apt-get install -y docker-compose-plugin
fi

# 4. Firewall
echo "[4/6] Configuration firewall..."
apt-get install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 5. Clone repo & setup
echo "[5/6] Clonage du projet..."
mkdir -p /opt/monpro
cd /opt/monpro

if [ ! -d ".git" ]; then
  git clone https://github.com/LeCompagnonVirtuel/monpro.git .
else
  git pull origin main
fi

# Copy env template if .env doesn't exist yet
cd /opt/monpro/deploy
if [ ! -f ".env" ]; then
  cp .env.production .env
  # Generate secrets automatically
  POSTGRES_PW=$(openssl rand -hex 32)
  JWT_SEC=$(openssl rand -hex 32)
  sed -i "s/POSTGRES_PASSWORD=CHANGE_ME_USE_openssl_rand_hex_32/POSTGRES_PASSWORD=$POSTGRES_PW/" .env
  sed -i "s/JWT_SECRET=CHANGE_ME_USE_openssl_rand_hex_32/JWT_SECRET=$JWT_SEC/" .env
  echo ""
  echo "══════════════════════════════════════"
  echo "  .env créé avec secrets auto-générés"
  echo "  ÉDITE /opt/monpro/deploy/.env pour"
  echo "  ajouter Cloudinary, AT, OpenAI, etc."
  echo "══════════════════════════════════════"
fi

# 6. SSL Certificate (before starting with HTTPS)
echo "[6/6] Obtention certificat SSL..."

# Start nginx temporarily with HTTP only for certbot challenge
cat > /opt/monpro/deploy/nginx/conf.d/default.conf.tmp <<'TMPCONF'
server {
    listen 80;
    server_name srv1288413.hstgr.cloud;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 'MONPRO setup in progress';
        add_header Content-Type text/plain;
    }
}
TMPCONF

# Temporarily use HTTP-only config for certbot
mv /opt/monpro/deploy/nginx/conf.d/default.conf /opt/monpro/deploy/nginx/conf.d/default.conf.bak
mv /opt/monpro/deploy/nginx/conf.d/default.conf.tmp /opt/monpro/deploy/nginx/conf.d/default.conf

docker compose up -d nginx

# Get SSL cert (--entrypoint override required)
docker compose run --rm --entrypoint "certbot" certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

# Restore full HTTPS config
docker compose down
mv /opt/monpro/deploy/nginx/conf.d/default.conf.bak /opt/monpro/deploy/nginx/conf.d/default.conf

# Start everything
echo ""
echo "Démarrage de la stack complète..."
docker compose up -d --build

echo ""
echo "══════════════════════════════════════"
echo "  ✓ MONPRO déployé avec succès !"
echo ""
echo "  API:    https://$DOMAIN/api/v1"
echo "  Health: https://$DOMAIN/api/v1/health"
echo ""
echo "  Commandes utiles:"
echo "    cd /opt/monpro/deploy"
echo "    docker compose logs -f api    # Logs API"
echo "    docker compose logs -f db     # Logs DB"
echo "    docker compose ps             # Status"
echo "    docker compose down           # Arrêter"
echo "    docker compose up -d --build  # Redéployer"
echo "══════════════════════════════════════"
