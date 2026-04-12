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

## Production OAuth Setup

Your customers will still click `Connect` from the frontend, but the OAuth flow must complete through your deployed API. In this project:

- the frontend starts the flow using `NEXT_PUBLIC_API_URL`
- the provider redirects back to your API callback URL
- the API exchanges the code for tokens and stores the connected account
- the API redirects the user back to the frontend using `CORS_ORIGIN`

### 1. Choose your production domains

Example:

- Frontend: `https://app.agentos.ai`
- API: `https://api.agentos.ai`

### 2. Set frontend environment variables

In `apps/web`:

```env
NEXT_PUBLIC_API_URL=https://api.agentos.ai
```

### 3. Set backend environment variables

In `apps/api`:

```env
CORS_ORIGIN=https://app.agentos.ai

META_CLIENT_ID=your-meta-client-id
META_CLIENT_SECRET=your-meta-client-secret
META_REDIRECT_URI=https://api.agentos.ai/integrations/oauth/meta/callback

LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_REDIRECT_URI=https://api.agentos.ai/integrations/oauth/linkedin/callback

YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
YOUTUBE_REDIRECT_URI=https://api.agentos.ai/integrations/oauth/youtube/callback

TIKTOK_CLIENT_ID=your-tiktok-client-id
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
TIKTOK_REDIRECT_URI=https://api.agentos.ai/integrations/oauth/tiktok/callback

X_CLIENT_ID=your-x-client-id
X_CLIENT_SECRET=your-x-client-secret
X_REDIRECT_URI=https://api.agentos.ai/integrations/oauth/x/callback
```

### 4. Register these callback URLs with each provider

Use these exact callback patterns in the provider dashboards:

- Meta: `https://api.agentos.ai/integrations/oauth/meta/callback`
- LinkedIn: `https://api.agentos.ai/integrations/oauth/linkedin/callback`
- YouTube: `https://api.agentos.ai/integrations/oauth/youtube/callback`
- TikTok: `https://api.agentos.ai/integrations/oauth/tiktok/callback`
- X: `https://api.agentos.ai/integrations/oauth/x/callback`

Replace `api.agentos.ai` with your real API domain.

### 5. What the customer experiences

From the user's perspective, this still feels like a frontend connection flow:

1. The customer clicks `Connect` in the web app.
2. The browser is redirected to your API OAuth route.
3. The API redirects to the provider login screen.
4. The provider redirects back to your API callback URL.
5. The API saves the tokens and redirects the customer back to the frontend.

### 6. Why this cannot be browser-only

Do not try to complete LinkedIn or other social OAuth connections entirely in frontend code:

- client secrets must stay on the server
- token exchange should happen on the server
- access tokens should be stored securely on the server
- this project saves connected accounts in the database during the callback flow

### 7. Production checklist

- `NEXT_PUBLIC_API_URL` points to the public API domain
- `CORS_ORIGIN` points to the public frontend domain
- each provider app has the matching callback URL registered
- each `*_CLIENT_ID` and `*_CLIENT_SECRET` is set on the API
- the API domain is reachable publicly over HTTPS
- the frontend and API domains match the exact values configured in provider dashboards

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
