# AgentOS - Deployment Guide

## Local Development

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Quick Start

```bash
# 1. Clone and install
pnpm install

# 2. Start infrastructure
docker compose up -d postgres redis

# 3. Set up environment
cp .env.example .env
# Edit .env with your values

# 4. Generate Prisma client and run migrations
pnpm db:generate
pnpm db:migrate

# 5. Seed the database
pnpm db:seed

# 6. Start development servers
pnpm dev
```

The web app runs on http://localhost:3000 and the API on http://localhost:4000.

### Default Credentials (from seed)
- Email: founder@agentos.ai
- Password: admin123!

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `ENCRYPTION_KEY` | AES encryption key for API keys (min 16 chars) |

### OAuth (per platform)
| Variable | Description |
|----------|-------------|
| `META_CLIENT_ID` | Meta app client ID |
| `META_CLIENT_SECRET` | Meta app client secret |
| `LINKEDIN_CLIENT_ID` | LinkedIn app client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn app client secret |
| ... | Similar pattern for YouTube, TikTok, X |

### Optional
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API port | 4000 |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |
| `JWT_EXPIRES_IN` | JWT token expiry | 7d |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | http://localhost:4000 |

## Production Deployment (AWS EC2 + Docker)

### 1. Server Setup

```bash
# Ubuntu 22.04+ on EC2
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
```

### 2. Clone and Configure

```bash
git clone <your-repo-url> /opt/agentos
cd /opt/agentos
cp .env.example .env
# Edit .env with production values:
# - Strong JWT_SECRET (openssl rand -hex 32)
# - Strong ENCRYPTION_KEY (openssl rand -hex 16)
# - Real DATABASE_URL pointing to your PostgreSQL
# - Real REDIS_URL
# - OAuth credentials for each platform
```

### 3. Deploy with Docker Compose

```bash
docker compose up -d
docker compose exec api npx prisma migrate deploy
docker compose exec api npx ts-node prisma/seed.ts
```

### 4. Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Database Management

```bash
# Run migrations
pnpm db:migrate

# Deploy migrations (production, no prompts)
pnpm db:deploy

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

## Architecture

```
agentos/
├── apps/
│   ├── api/          # NestJS backend (port 4000)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   └── shared/       # Shared types, enums, validation
├── docker-compose.yml
└── turbo.json
```

## Security Notes

- API keys are encrypted at rest using AES-256-GCM
- JWT tokens are used for authentication (stored in memory/localStorage)
- OAuth tokens are encrypted before database storage
- Rate limiting is applied to auth endpoints
- CORS is restricted to configured origins
- Helmet middleware adds security headers
- All secrets must be changed from defaults in production
