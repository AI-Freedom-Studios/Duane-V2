FROM node:20-alpine AS base
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile || pnpm install
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN cd apps/api && npx prisma generate
RUN pnpm --filter @agentos/api run build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
EXPOSE 4000
CMD ["node", "dist/main"]
