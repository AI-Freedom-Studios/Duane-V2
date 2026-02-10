# AgentOS — AI Freedom Studios

> AI-powered social media & content management platform with autonomous agent teams.

AgentOS is a full-stack SaaS platform that orchestrates AI agents across content creation, social media management, and campaign production. It features a plug-and-play provider architecture supporting 13+ AI providers, OAuth-connected social platforms, and a BullMQ-powered job scheduler.

---

## Screenshots

| Dashboard | Teams & Agents |
|-----------|---------------|
| Metric cards, gradient hub tiles, workforce overview | Agent teams with orchestrator cards, live activity feed |

---

## Features

- **AI Agent Framework** — 10 agents across 3 teams (Executive, Engineering, Campaign) with ARIA as orchestrator
- **Provider Hub** — Plug-and-play API key management for OpenAI, Anthropic, Google, Mistral, Cohere, Runway, Replicate, Stability, ElevenLabs, Poe, and more
- **Social Media Management** — OAuth connect flows for Meta, LinkedIn, YouTube, TikTok, X with multi-account support
- **Post Composer** — Draft, schedule, and publish across platforms with BullMQ background jobs
- **Video Studio** — Multi-provider video generation (Runway, Replicate, Stability)
- **Ads Manager** — Scaffolded for Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads, X Ads (Phase 2)
- **Dark Mode** — Full dark theme with localStorage persistence
- **Encrypted Secrets** — API keys and OAuth tokens encrypted at rest (AES-256-GCM)
- **Audit Logging** — Every sensitive action is logged with user, action, and IP

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Radix UI, TanStack Query, Zustand |
| Backend | NestJS, TypeScript, Passport JWT, BullMQ |
| Database | PostgreSQL + Prisma ORM |
| Queue | Redis + BullMQ |
| Auth | JWT + bcrypt, RBAC (Owner/Admin/Member) |
| Encryption | AES-256-GCM with scrypt key derivation |
| Monorepo | pnpm workspaces + Turborepo |
| CI | GitHub Actions (lint, typecheck, test, build) |
| Infra | Docker Compose, Dockerfiles for API + Web |

## Project Structure

```
agentos/
├── apps/
│   ├── api/                # NestJS backend (port 4000)
│   │   ├── prisma/         # Schema, migrations, seed
│   │   └── src/
│   │       ├── auth/       # JWT register/login, RBAC
│   │       ├── providers/  # API key vault + provider registry
│   │       ├── integrations/ # OAuth flows (Meta, LinkedIn, etc.)
│   │       ├── posts/      # Post CRUD + BullMQ publisher
│   │       ├── agents/     # Agent CRUD + delegation
│   │       ├── tasks/      # Task management
│   │       ├── audit/      # Audit log
│   │       └── jobs/       # Job monitoring
│   └── web/                # Next.js frontend (port 3000)
│       └── src/
│           ├── app/        # Pages (dashboard, teams, video, social, etc.)
│           ├── components/ # UI components (shadcn/ui) + layout
│           └── lib/        # API client, auth store, theme
├── packages/
│   └── shared/             # Shared types, enums, Zod schemas
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

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Login, get JWT |
| GET | `/auth/me` | Yes | Current user |
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
| `META_CLIENT_ID` | For OAuth | Meta developer app credentials |
| `LINKEDIN_CLIENT_ID` | For OAuth | LinkedIn developer app credentials |

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for full production deployment guide covering:

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
| **LLM** | OpenAI, Anthropic, Google (Gemini), Mistral, Cohere |
| **Video** | Runway, Replicate, Stability AI, Pika*, HeyGen* |
| **Audio** | ElevenLabs |
| **Aggregator** | Poe |
| **Generic** | Custom HTTP provider adapter |

*\* Stub — full integration pending API availability*

## License

Private / Proprietary — AI Freedom Studios
