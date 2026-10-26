# syntax=docker/dockerfile:1

# Stage 1: Fast Builder
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. Copy package manifests only for optimal layer caching
COPY package.json package-lock.json* ./

# 2. Install dependencies with persistent npm cache (avoids copying 30k+ files between stages)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit || npm install --no-audit

# 3. Copy application source code
COPY . .

# Set build environment variables
ENV NEXT_PUBLIC_BASE_URL=https://kondangsensei.my.id
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV IS_DOCKER_BUILD=true

# 4. Compile Next.js with persistent cache mount and skipped typecheck (instant build)
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# Stage 2: Minimal Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone server output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure external modules and worker files (pdf-parse and @napi-rs) are fully present in standalone container
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pdf-parse ./node_modules/pdf-parse
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@napi-rs ./node_modules/@napi-rs

# Ensure persistent uploads directories exist with proper permissions
RUN mkdir -p ./public/uploads/avatars ./public/uploads/questions ./public/uploads/audio && chown -R nextjs:nodejs ./public/uploads

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
