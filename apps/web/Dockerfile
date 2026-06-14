# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

# Build args for Next.js public env vars (baked at build time)
ARG NEXT_PUBLIC_API_URL=https://api.paw8.x51.vn/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV CI=true

RUN pnpm build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS production

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
