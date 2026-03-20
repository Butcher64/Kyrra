# Kyrra Worker — Multi-stage Docker build
# Built from monorepo root (not apps/worker/) to access packages/shared
# Deploy target: Railway EU region

# ── Stage 1: Install all dependencies ──
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/

RUN pnpm install --frozen-lockfile --prod=false

# ── Stage 2: Build packages/shared ──
FROM base AS build-shared
COPY packages/shared/ ./packages/shared/
COPY packages/tsconfig/ ./packages/tsconfig/
RUN cd packages/shared && pnpm run build 2>/dev/null || true

# ── Stage 3: Build apps/worker ──
FROM build-shared AS build-worker
COPY apps/worker/ ./apps/worker/
RUN cd apps/worker && pnpm run build

# ── Stage 4: Production image ──
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build-worker /app/apps/worker/dist ./dist
COPY --from=build-worker /app/apps/worker/package.json ./
COPY --from=build-worker /app/node_modules ./node_modules
COPY --from=build-worker /app/packages/shared ./packages/shared

EXPOSE 3001

CMD ["node", "dist/index.js"]
