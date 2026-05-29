# Deployment Guide

This guide documents the current deployable pieces in the repository.

Important current-state note:

- the repo includes Docker Compose infrastructure for PostgreSQL and MinIO
- the repo does not currently include project Dockerfiles for the API or web app
- production deployment for the API and web app is therefore manual unless you add your own containerization or process manager setup

## Current Deployment Topology

| Component | Current Repo Support | Notes |
| --- | --- | --- |
| PostgreSQL | `docker-compose.yml` | Official `postgres:16-alpine` image |
| MinIO | `docker-compose.yml` | Official `minio/minio:latest` image |
| Bucket initialization | `docker-compose.yml` | `minio-init` creates `pawn-platform` and keeps it private |
| API app | manual process deploy | no project Dockerfile in repo |
| Web app | manual process deploy | no project Dockerfile in repo |
| Mobile app | platform build flow | deploy with normal Flutter Android/iOS packaging |

## Docker Compose Infrastructure

Current services from `docker-compose.yml`:

| Service | Image | Host Ports | Volumes | Health Check |
| --- | --- | --- | --- | --- |
| `postgres` | `postgres:16-alpine` | `5433:5432` | `postgres_data:/var/lib/postgresql/data` | `pg_isready -U paw8 -d paw8_dev` |
| `minio` | `minio/minio:latest` | `9000:9000`, `9001:9001` | `minio_data:/data` | `mc ready local` |
| `minio-init` | `minio/mc:latest` | none | none | one-shot init container |

Named volumes:

- `postgres_data`
- `minio_data`

## Environment Variables

| Variable | Purpose | Example | Secret |
| --- | --- | --- | --- |
| `APP_PORT` | API listen port | `3000` | No |
| `APP_ENV` | Runtime environment | `production` | No |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://paw8:***@db.internal:5432/paw8` | Yes |
| `DATABASE_HOST` | PostgreSQL host | `db.internal` | No |
| `DATABASE_PORT` | PostgreSQL port | `5432` | No |
| `DATABASE_USER` | PostgreSQL username | `paw8` | No |
| `DATABASE_PASSWORD` | PostgreSQL password | `change-me` | Yes |
| `DATABASE_NAME` | PostgreSQL database name | `paw8` | No |
| `JWT_PRIVATE_KEY_PATH` | RS256 private key path | `/etc/paw8/keys/private.pem` | Path only |
| `JWT_PUBLIC_KEY_PATH` | RS256 public key path | `/etc/paw8/keys/public.pem` | Path only |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | Access token TTL | `15m` | No |
| `JWT_REFRESH_TOKEN_EXPIRES_IN` | Refresh token TTL | `7d` | No |
| `MINIO_ENDPOINT` | MinIO hostname | `minio.internal` | No |
| `MINIO_PORT` | MinIO API port | `9000` | No |
| `MINIO_USE_SSL` | Enable TLS to MinIO | `true` | No |
| `MINIO_ACCESS_KEY` | MinIO access key | `paw8-prod-user` | Yes |
| `MINIO_SECRET_KEY` | MinIO secret key | `change-me` | Yes |
| `MINIO_BUCKET` | Bucket name | `pawn-platform` | No |
| `MINIO_PRESIGNED_UPLOAD_EXPIRY` | Presigned upload lifetime in seconds | `3600` | No |
| `MINIO_PRESIGNED_DOWNLOAD_EXPIRY` | Presigned download lifetime in seconds | `900` | No |

## RS256 Key Generation

Generate the API keypair before starting the API:

```bash
mkdir -p /etc/paw8/keys
openssl genrsa -out /etc/paw8/keys/private.pem 2048
openssl rsa -in /etc/paw8/keys/private.pem -pubout -out /etc/paw8/keys/public.pem
chmod 600 /etc/paw8/keys/private.pem
chmod 644 /etc/paw8/keys/public.pem
```

Point the API env vars to those files:

```env
JWT_PRIVATE_KEY_PATH=/etc/paw8/keys/private.pem
JWT_PUBLIC_KEY_PATH=/etc/paw8/keys/public.pem
```

## Database Migration Runbook

Run migrations from `apps/api-gateway/`:

```bash
pnpm migration:run
```

Recommended verification:

1. check that the command exits successfully
2. confirm expected tables exist in PostgreSQL
3. confirm no pending SQL errors appear in startup logs

If you need to revert the last migration batch:

```bash
pnpm migration:revert
```

Seed data is appropriate for local or demo environments only:

```bash
pnpm seed
```

Do not run the demo seed in production unless that is explicitly desired.

## MinIO Initialization

The repository already includes a MinIO bootstrap pattern:

1. start MinIO
2. run `minio-init`
3. create bucket `pawn-platform`
4. set anonymous access policy to `none`

If you need to reproduce the initialization manually with `mc`:

```bash
mc alias set local http://localhost:9000 paw8_minio_user paw8_minio_password
mc mb --ignore-existing local/pawn-platform
mc anonymous set none local/pawn-platform
```

Expected object key pattern in application code:

```text
tenants/{tenantId}/{entityType}s/{entityId}/{timestamp}-{filename}
```

## Health Checks

### PostgreSQL

The Compose health check uses:

```bash
pg_isready -U paw8 -d paw8_dev
```

### MinIO

The Compose health check uses:

```bash
mc ready local
```

### API

There is no dedicated `/health` endpoint in the current API.

Use a process check plus a representative request instead. Example login probe:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"platform@paw8.dev","password":"Password@123"}'
```

## Deployment Gaps To Plan Around

- no project Dockerfile for `apps/api-gateway`
- no project Dockerfile for `apps/web`
- no dedicated API health endpoint
- default ports and CORS values need alignment before a polished production rollout
- mobile API base URL is hardcoded in source rather than injected from environment
- some frontend routes and token expectations do not currently match backend behavior
