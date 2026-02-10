#!/bin/bash
set -e

# ============================================
# AgentOS — Hostinger VPS Deployment Script
# ============================================
# Usage: ssh root@your-vps "bash -s" < deploy.sh
# Or:    scp deploy.sh root@your-vps:~ && ssh root@your-vps "bash deploy.sh"
#
# Prerequisites:
#   - Ubuntu 22.04 or 24.04 on Hostinger VPS
#   - Root or sudo access
#   - Domain pointed to VPS IP (optional, for SSL)
# ============================================

REPO_URL="${REPO_URL:-https://github.com/YOUR_USERNAME/agentos.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="/opt/agentos"
DOMAIN="${DOMAIN:-your-domain.com}"
DB_NAME="agentos"
DB_USER="agentos"
DB_PASS="${DB_PASS:-$(openssl rand -hex 16)}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-$(openssl rand -hex 16)}"

echo "========================================="
echo "  AgentOS — Hostinger VPS Deployment"
echo "========================================="

# --- System Updates ---
echo "[1/10] Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

# --- Node.js 20 ---
echo "[2/10] Installing Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "Node.js $(node -v)"

# --- pnpm ---
echo "[3/10] Installing pnpm..."
npm install -g pnpm@latest
echo "pnpm $(pnpm -v)"

# --- PM2 ---
echo "[4/10] Installing PM2..."
npm install -g pm2

# --- PostgreSQL ---
echo "[5/10] Setting up PostgreSQL..."
if ! command -v psql &> /dev/null; then
  apt-get install -y postgresql postgresql-contrib
  systemctl enable postgresql
  systemctl start postgresql
fi

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
echo "PostgreSQL ready"

# --- Redis ---
echo "[6/10] Setting up Redis..."
if ! command -v redis-server &> /dev/null; then
  apt-get install -y redis-server
  systemctl enable redis-server
  systemctl start redis-server
fi
echo "Redis ready"

# --- Clone / Pull Repository ---
echo "[7/10] Setting up application code..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# --- Environment File ---
echo "[8/10] Configuring environment..."
cat > "$APP_DIR/.env" <<EOL
# Database
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=${JWT_SECRET}

# Encryption
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Server
PORT=4000
NODE_ENV=production

# Frontend
NEXT_PUBLIC_API_URL=https://${DOMAIN}/api

# Poe.com API (add your key after deployment)
# POE_API_KEY=your-poe-api-key-here
EOL

# Copy env for both apps
cp "$APP_DIR/.env" "$APP_DIR/apps/api/.env"
cp "$APP_DIR/.env" "$APP_DIR/apps/web/.env.local"

# --- Build ---
echo "[9/10] Installing dependencies and building..."
cd "$APP_DIR"
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate
pnpm build

# Seed database (only first time)
if [ ! -f "$APP_DIR/.seeded" ]; then
  pnpm db:seed
  touch "$APP_DIR/.seeded"
fi

# --- PM2 Processes ---
echo "[10/10] Starting services with PM2..."
pm2 delete agentos-api 2>/dev/null || true
pm2 delete agentos-web 2>/dev/null || true

pm2 start "$APP_DIR/apps/api/dist/main.js" \
  --name agentos-api \
  --cwd "$APP_DIR/apps/api" \
  --env production \
  -i 2

pm2 start "npx next start -p 3000" \
  --name agentos-web \
  --cwd "$APP_DIR/apps/web" \
  --env production

pm2 save
pm2 startup

# --- Nginx ---
echo "Configuring nginx..."
cat > /etc/nginx/sites-available/agentos <<EOL
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # API proxy
    location /api/ {
        rewrite ^/api/(.*) /\$1 break;
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 50M;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:4000/health;
    }

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

ln -sf /etc/nginx/sites-available/agentos /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# --- Firewall ---
echo "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "  App URL:  http://${DOMAIN}"
echo "  API URL:  http://${DOMAIN}/api"
echo "  Health:   http://${DOMAIN}/health"
echo ""
echo "  Database: ${DB_NAME} (user: ${DB_USER})"
echo "  DB Pass:  ${DB_PASS}"
echo ""
echo "  JWT Secret:     ${JWT_SECRET}"
echo "  Encryption Key: ${ENCRYPTION_KEY}"
echo ""
echo "  Next steps:"
echo "    1. Point your domain DNS to this server's IP"
echo "    2. Run: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "    3. Add your Poe API key in the Integrations Hub"
echo ""
echo "  Useful commands:"
echo "    pm2 logs              # View logs"
echo "    pm2 restart all       # Restart services"
echo "    pm2 monit             # Monitor processes"
echo "========================================="
