# Stage 1: Base image
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml* package-lock.json* pnpm-lock.yaml* ./
COPY packages/tsconfig/package.json ./packages/tsconfig/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else pnpm install; \
  fi

# Stage 3: Build the project
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY . .

# Generate Prisma Client for database communication
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Build the Next.js web application using standalone compilation
RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm --filter=@repo/web build; \
  else npm run build --workspace=@repo/web; \
  fi

# Stage 4: Production runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets and standalone output
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
