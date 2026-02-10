# Deploy AgentOS Demo

Quick deployment guides for Railway and Render.

---

## Option A: Railway (Recommended — fastest)

### Prerequisites
- GitHub account with this repo pushed
- [Railway account](https://railway.app) (free tier available)

### Steps

1. **Go to [railway.app](https://railway.app)** and sign in with GitHub.

2. **Create a new project** → "Deploy from GitHub repo" → select this repository.

3. **Add PostgreSQL**: Click "+ New" → "Database" → "PostgreSQL"

4. **Add Redis**: Click "+ New" → "Database" → "Redis"

5. **Deploy the API service**:
   - Click "+ New" → "GitHub Repo" → select this repo
   - Go to Settings:
     - **Root Directory**: `apps/api`
     - **Build Command**: `npx prisma generate && npx nest build`
     - **Start Command**: `npx prisma migrate deploy && node dist/main`
   - Add environment variables:
     - `DATABASE_URL` → click "Reference" → select PostgreSQL → `DATABASE_URL`
     - `REDIS_URL` → click "Reference" → select Redis → `REDIS_URL`
     - `JWT_SECRET` → generate a random string (e.g., `openssl rand -hex 32`)
     - `ENCRYPTION_KEY` → generate a random string (e.g., `openssl rand -hex 32`)
     - `PORT` → `4000`
     - `NODE_ENV` → `production`
     - `CORS_ORIGIN` → (set after web deploys, use `*` temporarily)
   - Deploy

6. **Deploy the Web frontend**:
   - Click "+ New" → "GitHub Repo" → select this repo
   - Go to Settings:
     - **Root Directory**: `apps/web`
     - **Build Command**: `npx next build`
     - **Start Command**: `npx next start -p ${PORT:-3000}`
   - Add environment variables:
     - `NEXT_PUBLIC_API_URL` → the API's Railway URL (e.g., `https://agentos-api-production.up.railway.app`)
     - `PORT` → `3000`
   - Deploy

7. **Update CORS**: Go back to the API service and set `CORS_ORIGIN` to the web frontend URL.

8. **Seed the database** (optional): In the API service, open the terminal and run:
   ```bash
   npx prisma migrate deploy && npx ts-node prisma/seed.ts
   ```

### Your demo URL
After deployment, Railway gives you a public URL like:
`https://agentos-web-production.up.railway.app`

---

## Option B: Render

### Prerequisites
- GitHub account with this repo pushed
- [Render account](https://render.com) (free tier available)

### Steps

1. **Go to [render.com](https://render.com)** and sign in with GitHub.

2. **Use the Blueprint**: Click "New" → "Blueprint" → connect your GitHub repo. Render will detect `render.yaml` and set up all services automatically.

   OR manually:

3. **Create PostgreSQL**: Dashboard → "New" → "PostgreSQL" (name: `agentos-db`)

4. **Create Redis**: Dashboard → "New" → "Redis" (name: `agentos-redis`)

5. **Create API Web Service**:
   - "New" → "Web Service" → connect repo
   - **Root Directory**: leave empty (uses Dockerfile)
   - **Docker**: select `apps/api/Dockerfile`
   - Environment variables (same as Railway Step 5)
   - Health Check Path: `/health`

6. **Create Web Frontend Service**:
   - "New" → "Web Service" → connect repo
   - **Docker**: select `apps/web/Dockerfile`
   - Environment: `NEXT_PUBLIC_API_URL` = API service URL

### Your demo URL
Render gives you URLs like:
`https://agentos-web.onrender.com`

---

## Demo Credentials

After seeding, log in with:
- **Email**: `founder@aifreedomstudios.com`
- **Password**: `AgentOS2024!`

---

## Environment Variables Reference

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | API | PostgreSQL connection string |
| `REDIS_URL` | API | Redis connection string |
| `JWT_SECRET` | API | JWT signing secret (min 32 chars) |
| `ENCRYPTION_KEY` | API | AES encryption key (min 32 chars) |
| `PORT` | Both | Server port (API: 4000, Web: 3000) |
| `NODE_ENV` | Both | `production` |
| `CORS_ORIGIN` | API | Frontend URL for CORS |
| `NEXT_PUBLIC_API_URL` | Web | API URL for frontend requests |
