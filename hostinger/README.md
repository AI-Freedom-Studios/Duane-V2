# Hostinger VPS Deployment Guide

## Prerequisites

- Hostinger VPS with Ubuntu 22.04/24.04
- Root/sudo access
- Domain name (optional, recommended)

## Quick Deploy

### 1. SSH into your Hostinger VPS

```bash
ssh root@your-vps-ip
```

### 2. Run the deployment script

```bash
# Option A: One-liner
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/agentos/main/hostinger/deploy.sh | \
  DOMAIN=your-domain.com bash

# Option B: Download and customize
wget https://raw.githubusercontent.com/YOUR_USERNAME/agentos/main/hostinger/deploy.sh
nano deploy.sh  # Edit DOMAIN, REPO_URL, etc.
bash deploy.sh
```

### 3. Set up SSL (recommended)

```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 4. Configure Poe.com API

1. Go to https://poe.com/api_key to get your API key
2. Log in to AgentOS at `https://your-domain.com`
3. Navigate to **Integrations Hub** > **Add API Key**
4. Select "Poe by Quora" and paste your key

## Environment Variables

Edit `/opt/agentos/.env` to customize:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing key |
| `ENCRYPTION_KEY` | AES encryption key |
| `NEXT_PUBLIC_API_URL` | Public API URL |

## Management Commands

```bash
# View logs
pm2 logs

# Restart all services
pm2 restart all

# Monitor processes
pm2 monit

# Update deployment
cd /opt/agentos && git pull && pnpm install && pnpm build && pm2 restart all

# Database operations
cd /opt/agentos && pnpm db:migrate
cd /opt/agentos && pnpm db:seed
```

## Hostinger VPS Recommended Specs

| Plan | Use Case |
|------|----------|
| KVM 1 (4GB RAM) | Development / small teams |
| KVM 2 (8GB RAM) | Production (recommended) |
| KVM 4 (16GB RAM) | High traffic / multiple instances |

## Troubleshooting

### App not loading
```bash
pm2 logs --lines 50
nginx -t
systemctl status nginx
```

### Database issues
```bash
sudo -u postgres psql -d agentos -c "SELECT 1"
cd /opt/agentos && pnpm db:migrate
```

### Redis issues
```bash
redis-cli ping
systemctl restart redis-server
```
