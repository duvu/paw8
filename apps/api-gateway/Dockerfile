# ─── Stage 1: Build & Deploy ──────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api-gateway/package.json ./apps/api-gateway/

COPY libs/ ./libs/

ENV SCARF_ANALYTICS=false
RUN pnpm install --frozen-lockfile

COPY apps/api-gateway/ ./apps/api-gateway/
RUN pnpm --filter api-gateway build

RUN pnpm --filter api-gateway deploy --prod --legacy /deploy/api-gateway

RUN cp -r /app/apps/api-gateway/dist /deploy/api-gateway/dist
RUN mkdir -p /deploy/api-gateway/dist/apps/api-gateway/i18n && \
    cp -r /app/apps/api-gateway/src/i18n/. /deploy/api-gateway/dist/apps/api-gateway/i18n/ 2>/dev/null || true

FROM node:22-alpine AS production

RUN apk add --no-cache chromium

WORKDIR /app

COPY --from=builder /deploy/api-gateway ./

RUN mkdir -p /app/keys

EXPOSE 3000

CMD ["node", "dist/apps/api-gateway/src/main"]
