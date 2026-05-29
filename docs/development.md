# Development Guide

This guide describes the current local development workflow for the implemented codebase.

## Prerequisites

- Node.js `>=20`
- pnpm `>=9`
- Docker and Docker Compose
- Flutter 3.x with a working simulator or device
- Bun for the repo's AI tooling and agent integrations
- OpenSSL for JWT key generation

## Working Local Port Plan

The repository defaults are not fully aligned, so the cleanest local setup is:

| Service | Recommended Local Port | Why |
| --- | --- | --- |
| API | `3000` | backend default in `.env.example`, `main.ts`, web client default, mobile client default |
| Web | `3001` | avoids API port conflict and matches API CORS default origin |
| PostgreSQL | `5433` | Docker Compose exposes `5433:5432` |
| MinIO API | `9000` | Docker Compose |
| MinIO Console | `9001` | Docker Compose |

## Environment Setup

Copy the root environment file:

```bash
cp .env.example .env
```

Important local fix before starting the API:

```env
DATABASE_URL=postgresql://paw8:paw8_dev_password@localhost:5433/paw8_dev
DATABASE_PORT=5433
```

### Generate RS256 Keys

The repo does not ship `keys/private.pem` or `keys/public.pem`. Generate them locally:

```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

### Environment Variables

`apps/api-gateway/src/app.module.ts` loads the root `.env` file.

| Variable | Purpose | Default in `.env.example` | Notes |
| --- | --- | --- | --- |
| `APP_PORT` | API listen port | `3000` | Recommended local API port |
| `APP_ENV` | Runtime mode | `development` | Enables TypeORM logging in development |
| `DATABASE_URL` | Primary DB connection string | `postgresql://paw8:paw8_dev_password@localhost:5432/paw8_dev` | Change host port to `5433` for local Docker Compose |
| `DATABASE_HOST` | DB host | `localhost` | Redundant if `DATABASE_URL` is set |
| `DATABASE_PORT` | DB port | `5432` | Change to `5433` for local Docker Compose |
| `DATABASE_USER` | DB user | `paw8` | Used by some scripts and tooling |
| `DATABASE_PASSWORD` | DB password | `paw8_dev_password` | Secret |
| `DATABASE_NAME` | DB name | `paw8_dev` | Used by local Postgres container |
| `JWT_PRIVATE_KEY_PATH` | RS256 private key path | `./keys/private.pem` | Required for signing access tokens |
| `JWT_PUBLIC_KEY_PATH` | RS256 public key path | `./keys/public.pem` | Required for token verification |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | Access token TTL | `15m` | Backend currently returns `expiresIn: 900` from auth flows |
| `JWT_REFRESH_TOKEN_EXPIRES_IN` | Refresh token TTL | `7d` | Hashed refresh tokens are stored in `refresh_tokens` |
| `MINIO_ENDPOINT` | MinIO host | `localhost` | Local Compose target |
| `MINIO_PORT` | MinIO API port | `9000` | Matches Docker Compose |
| `MINIO_USE_SSL` | MinIO TLS toggle | `false` | Local development default |
| `MINIO_ACCESS_KEY` | MinIO access key | `paw8_minio_user` | Secret |
| `MINIO_SECRET_KEY` | MinIO secret key | `paw8_minio_password` | Secret |
| `MINIO_BUCKET` | Bucket name | `pawn-platform` | Created by `minio-init` |
| `MINIO_PRESIGNED_UPLOAD_EXPIRY` | Upload URL expiry | `3600` | Files service currently falls back to `300` if env is absent |
| `MINIO_PRESIGNED_DOWNLOAD_EXPIRY` | Download URL expiry | `900` | Files service currently falls back to `3600` if env is absent |

Optional web env var:

- `NEXT_PUBLIC_API_URL`: overrides the default API base URL in `apps/web/lib/api.ts`

## Install Dependencies

From the repo root:

```bash
pnpm install
```

From the mobile app:

```bash
cd apps/mobile
flutter pub get
```

## Start Local Infrastructure

From the repo root:

```bash
docker compose up -d
docker compose ps
```

What this starts:

- PostgreSQL 16 on host port `5433`
- MinIO API on `9000`
- MinIO console on `9001`
- `minio-init` to create the `pawn-platform` bucket and keep it private

## Database Migrations and Seed Data

Run migrations from `apps/api-gateway/`:

```bash
cd apps/api-gateway
pnpm migration:run
```

Seed demo data:

```bash
pnpm seed
```

Expected seed result includes a success line similar to:

```text
✅ Seed complete!
```

Seeded demo data:

- tenant: `Demo Pawn Shop` (`DEMO`)
- store: `Cửa hàng 1 - Hà Nội` (`HN01`)
- demo password for all seeded users: `Password@123`

## Running the API

Start the API from `apps/api-gateway/`:

```bash
pnpm start:dev
```

Current behavior:

- default port: `3000`
- base URL: `http://localhost:3000/api/v1`
- global validation: whitelist, reject unknown fields, implicit conversion
- i18n: `Accept-Language` with fallback to `vi`

## Running the Web Portal

Start the web app from `apps/web/` on port `3001`:

```bash
pnpm dev -- --port 3001
```

Why not `3000`?

- `next dev` defaults to `3000`
- the API also defaults to `3000`
- the API CORS origin fallback is `http://localhost:3001`

Useful behavior in the current web client:

- default API URL is `http://localhost:3000/api/v1`
- JWT is stored in `localStorage` under `access_token`
- 401 responses clear the token and redirect to `/login`

Current caveat:

- the web auth context expects `access_token`, but the backend returns `accessToken`

## Running the Flutter App

From `apps/mobile/`:

```bash
flutter run
```

Current mobile runtime behavior:

- base URL is hardcoded in `lib/core/api/api_client.dart` as `http://localhost:3000/api/v1`
- JWT is stored in `FlutterSecureStorage` under `access_token`
- locale is stored in secure storage and restored on startup

Current caveats:

- the auth repository expects `access_token`, but the backend returns `accessToken`
- Android emulators normally need `10.0.2.2` instead of `localhost`
- physical devices need the host machine IP rather than `localhost`
- `AssetPhotoUploadScreen` exists but is not currently registered in GoRouter

## Testing and Verification

From the repo root:

```bash
pnpm build
pnpm test
pnpm lint
pnpm i18n:check
```

API-specific verification:

```bash
cd apps/api-gateway
pnpm test
pnpm test:e2e
```

Web-specific verification:

```bash
cd apps/web
pnpm build
```

Mobile-specific verification:

```bash
cd apps/mobile
flutter analyze
flutter test
```

## Known Local Development Mismatches

- `.env.example` uses PostgreSQL port `5432`, but Docker Compose exposes `5433`
- API default port is `3000`, and web default dev port is also `3000`
- API CORS fallback origin is `http://localhost:3001`
- web reports and audit pages currently call some backend paths that do not exist
- migration schema and service SQL are not fully aligned in contracts and transactions
