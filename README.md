# AgentOS — AI Freedom Studios

> AI-powered social media & content management platform with autonomous agent teams, powered by 600+ AI models via the Poe.com API.

AgentOS is a full-stack SaaS platform that orchestrates AI agents across content creation, social media management, and campaign production. It uses **Poe.com as its primary AI provider**, giving access to 600+ models (GPT-4o, Claude, Gemini, Sora 2, Veo 3, Kling, DALL-E 3, and more) through a single API key. It also features a plug-and-play provider architecture, OAuth-connected social platforms, and a BullMQ-powered job scheduler.

---

## Screenshots

| Dashboard | Teams & Agents |
|-----------|---------------|
| Metric cards, gradient hub tiles, AI Chat & Video Studio | Agent teams with orchestrator cards, live activity feed |

---

## Features

- **Poe.com API Integration** — 600+ AI models through a single API key (LLM, Video, Image, Audio)
- **AI Chat** — Chat with GPT-4o, Claude, Gemini, Llama, DeepSeek, Qwen, and more
- **AI Video Studio** — Generate videos with Sora 2, Veo 3, Kling 1.6, Runway Gen-3, Pika 2.0, and more
- **AI Agent Framework** — 10 agents across 3 teams (Executive, Engineering, Campaign) with ARIA as orchestrator
- **Provider Hub** — Plug-and-play API key management for OpenAI, Anthropic, Google, Mistral, Cohere, Runway, Replicate, Stability, ElevenLabs, Poe, and more
- **Social Media Management** — OAuth connect flows for Meta, LinkedIn, YouTube, TikTok, X with multi-account support
- **Post Composer** — Draft, schedule, and publish across platforms with BullMQ background jobs
- **Ads Manager** — Scaffolded for Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads, X Ads (Phase 2)
- **Dark Mode** — Full dark theme with localStorage persistence
- **Encrypted Secrets** — API keys and OAuth tokens encrypted at rest (AES-256-GCM)
- **Audit Logging** — Every sensitive action is logged with user, action, and IP

## Poe.com API — Primary AI Provider

AgentOS uses Poe.com as its primary AI model aggregator. With a single Poe API key, you get access to:

| Category | Models |
|----------|--------|
| **LLM** | GPT-4o, GPT-4o Mini, Claude 3.5 Sonnet, Claude 3 Opus, Gemini 2.0 Flash, Gemini 1.5 Pro, Llama 3.1 405B, Mixtral 8x22B, DeepSeek V3, Qwen 2.5, Command R+ |
| **Video** | Sora 2, Veo 3, Kling 1.6, Runway Gen-3, MiniMax Video, Pika 2.0, Luma Dream Machine, Stable Video |
| **Image** | DALL-E 3, Midjourney v6, Stable Diffusion XL, Flux 1.1 Pro, Ideogram v2 |
| **Audio** | ElevenLabs Turbo, Bark, MusicGen |

**Get your API key:** [poe.com/api_key](https://poe.com/api_key)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Radix UI, TanStack Query, Zustand |
| Backend | NestJS, TypeScript, Passport JWT, BullMQ |
| Database | PostgreSQL + Prisma ORM |
| Queue | Redis + BullMQ |
| AI Provider | Poe.com API (600+ models) |
| Auth | JWT + bcrypt, RBAC (Owner/Admin/Member) |
| Encryption | AES-256-GCM with scrypt key derivation |
| Monorepo | pnpm workspaces + Turborepo |
| CI | GitHub Actions (lint, typecheck, test, build) |
| Infra | Docker Compose, Hostinger VPS, PM2, nginx |

## Project Structure

```
agentos/
├── apps/
│   ├── api/                # NestJS backend (port 4000)
│   │   ├── prisma/         # Schema, migrations, seed
│   │   └── src/
│   │       ├── auth/       # JWT register/login, RBAC
│   │       ├── poe/        # Poe.com API integration (chat, video, image)
│   │       ├── providers/  # API key vault + provider registry
│   │       ├── integrations/ # OAuth flows (Meta, LinkedIn, etc.)
│   │       ├── posts/      # Post CRUD + BullMQ publisher
│   │       ├── agents/     # Agent CRUD + delegation
│   │       ├── tasks/      # Task management
│   │       ├── audit/      # Audit log
│   │       └── jobs/       # Job monitoring
│   └── web/                # Next.js frontend (port 3000)
│       └── src/
│           ├── app/        # Pages (dashboard, ai-chat, video-studio, teams, etc.)
│           ├── components/ # UI components (shadcn/ui) + layout
│           └── lib/        # API client, auth store, theme
├── packages/
│   └── shared/             # Shared types, enums, Zod schemas
├── hostinger/              # Hostinger VPS deployment scripts
├── docker-compose.yml
├── turbo.json
└── DEPLOYMENT.md
```

## Quick Start

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9 (`corepack enable`)
- **Docker** & Docker Compose (for Postgres + Redis)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d postgres redis
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET and ENCRYPTION_KEY
```

### 4. Set up the database

```bash
pnpm db:generate    # Generate Prisma client
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed teams + agents + demo user
```

### 5. Start development servers

```bash
pnpm dev
```

- **Web**: http://localhost:3000
- **API**: http://localhost:4000
- **API Health**: http://localhost:4000/health

### Default login

| Field | Value |
|-------|-------|
| Email | `founder@agentos.ai` |
| Password | `admin123!` |

### 6. Add Poe.com API key

1. Log in to AgentOS
2. Go to **Integrations Hub** > **Add API Key**
3. Select **Poe by Quora** and paste your API key from [poe.com/api_key](https://poe.com/api_key)
4. Now you can use AI Chat and Video Studio with 600+ models

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Login, get JWT |
| GET | `/auth/me` | Yes | Current user |
| GET | `/poe/models` | No | List all Poe AI models |
| GET | `/poe/models?category=video` | No | List models by category |
| POST | `/poe/chat` | Yes | Chat with any LLM model via Poe |
| POST | `/poe/video/generate` | Yes | Generate video via Poe |
| POST | `/poe/image/generate` | Yes | Generate image via Poe |
| GET | `/providers/registry` | No | List all providers |
| GET | `/providers/keys` | Yes | List user's API keys |
| POST | `/providers/keys` | Yes | Add encrypted API key |
| POST | `/providers/keys/:id/test` | Yes | Test provider connection |
| GET | `/integrations/oauth/:platform/connect` | Yes | Start OAuth flow |
| GET | `/social/accounts` | Yes | List connected accounts |
| POST | `/posts` | Yes | Create/schedule post |
| POST | `/posts/:id/publish` | Yes | Publish post now |
| GET | `/agents` | Yes | List all agents |
| GET | `/agents/teams` | Yes | List teams with agents |
| POST | `/agents/:id/delegate` | Yes | Delegate task via orchestrator |
| POST | `/tasks` | Yes | Create task |
| GET | `/audit` | Yes | View audit log |

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | JWT signing key (min 32 chars) |
| `ENCRYPTION_KEY` | Yes | AES key for secret encryption (min 16 chars) |
| `POE_API_KEY` | Recommended | Poe.com API key (or add via UI) |
| `META_CLIENT_ID` | For OAuth | Meta developer app credentials |
| `LINKEDIN_CLIENT_ID` | For OAuth | LinkedIn developer app credentials |

## Deployment

### Hostinger VPS (Recommended)

See [`hostinger/README.md`](hostinger/README.md) for the full Hostinger deployment guide.

```bash
# Quick deploy to Hostinger VPS
ssh root@your-vps "bash -s" < hostinger/deploy.sh
```

### Other Options

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for additional deployment options:

- Docker Compose production setup
- AWS EC2 deployment
- nginx reverse proxy + SSL
- Railway / Render one-click deploy

## Agent Teams

| Team | Agents | Purpose |
|------|--------|---------|
| **Executive Leadership** | ARIA (Orchestrator) | Strategic oversight, task delegation |
| **Platform Engineering** | ATLAS, NEXUS, SYNTH, PIXEL, SENTINEL, SCOUT | Architecture, infrastructure, AI, frontend, security, maintenance |
| **Campaign Production** | AG-VP, AG-MANAGER, AG-ENGINEER | Strategy, project management, creative production |

## Supported Providers

| Category | Providers |
|----------|----------|
| **Aggregator** | **Poe by Quora** (primary — 600+ models) |
| **LLM** | OpenAI, Anthropic, Google (Gemini), Mistral, Cohere |
| **Video** | Runway, Replicate, Stability AI, Pika, HeyGen |
| **Audio** | ElevenLabs |
| **Generic** | Custom HTTP provider adapter |

## License

Private / Proprietary — AI Freedom Studios
