FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY collab-server/package.json ./collab-server/
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm exec prisma generate

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

ARG AUTH_SECRET=ci-build-auth-secret-min-32-characters-long
ARG DATABASE_URL=postgresql://ci:ci@localhost:5432/ci?schema=public
ARG AUTH_URL=http://localhost:3000
ARG COLLAB_SECRET=ci-build-collab-secret-shared
ARG NEXT_PUBLIC_COLLAB_WS_URL=ws://localhost:1234

ENV AUTH_SECRET=$AUTH_SECRET
ENV DATABASE_URL=$DATABASE_URL
ENV AUTH_URL=$AUTH_URL
ENV COLLAB_SECRET=$COLLAB_SECRET
ENV NEXT_PUBLIC_COLLAB_WS_URL=$NEXT_PUBLIC_COLLAB_WS_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Prisma 运行时依赖（hoisted node_modules 布局）
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
