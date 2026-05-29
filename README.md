# paw8

![Node.js >=20](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)
![pnpm >=9](https://img.shields.io/badge/pnpm-%3E%3D9-F69220?logo=pnpm&logoColor=white)
![NestJS 11](https://img.shields.io/badge/nestjs-11-E0234E?logo=nestjs&logoColor=white)
![Next.js 16](https://img.shields.io/badge/next.js-16-000000?logo=next.js&logoColor=white)
![Flutter 3.x](https://img.shields.io/badge/flutter-3.x-02569B?logo=flutter&logoColor=white)

`paw8` is a multi-tenant pawn shop management platform for a single store or a store chain. The current repository contains a working MVP1 codebase with a NestJS API, a Next.js web portal, a Flutter mobile app, PostgreSQL migrations, MinIO file storage integration, and Vietnamese/English/Chinese localization.

## Status

- Backend: implemented in `apps/api-gateway/` with domain libs under `libs/`
- Web portal: implemented in `apps/web/`
- Mobile app: implemented in `apps/mobile/`
- Database: TypeORM migrations and seed data are present
- i18n: API, web, and mobile all support `vi`, `en`, and `zh`

These docs reflect the current codebase. They are more accurate than the planning-era notes still present in `AGENTS.md`.

## Tech Stack

| Area | Implementation |
| --- | --- |
| API | NestJS 11, TypeORM, PostgreSQL, `nestjs-i18n` |
| Web | Next.js 16 App Router, React 19, `next-intl`, Axios |
| Mobile | Flutter, Riverpod, Dio, GoRouter, Flutter Secure Storage |
| Database | PostgreSQL 16 |
| File Storage | MinIO with presigned upload/download URLs |
| Auth | RS256 JWT access tokens + hashed refresh tokens |
| Tooling | pnpm workspaces, Docker Compose, Bun-based agent tooling |

## Quick Start

1. Clone the repo and install dependencies.

```bash
git clone git@github.com:duvu/paw8.git
cd paw8
pnpm install
```

2. Copy the environment file and update the database port to match Docker Compose.

```bash
cp .env.example .env
```

Recommended local edit in `.env`:

```env
DATABASE_URL=postgresql://paw8:paw8_dev_password@localhost:5433/paw8_dev
DATABASE_PORT=5433
```

3. Generate RSA keys for JWT signing.

```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

4. Start local infrastructure.

```bash
docker compose up -d
```

5. Run API migrations and seed demo data.

```bash
cd apps/api-gateway
pnpm migration:run
pnpm seed
cd ../..
```

6. Start the API.

```bash
cd apps/api-gateway
pnpm start:dev
```

By default the API runs at `http://localhost:3000/api/v1`.

7. Start the web portal on port `3001`.

```bash
cd apps/web
pnpm dev -- --port 3001
```

This is the simplest working local setup because:

- the API defaults to port `3000`
- the web client defaults to calling `http://localhost:3000/api/v1`
- the API CORS default origin is `http://localhost:3001`

8. Optional: start the Flutter app.

```bash
cd apps/mobile
flutter pub get
flutter run
```

## Demo Accounts

Seed data creates one demo tenant and six users.

| Role | Email | Password |
| --- | --- | --- |
| Platform Admin | `platform@paw8.dev` | `Password@123` |
| Tenant Owner | `owner@demo.paw8.dev` | `Password@123` |
| Tenant Admin | `admin@demo.paw8.dev` | `Password@123` |
| Store Manager | `manager@demo.paw8.dev` | `Password@123` |
| Staff | `staff@demo.paw8.dev` | `Password@123` |
| Accountant | `accountant@demo.paw8.dev` | `Password@123` |

The seeded tenant code is `DEMO`. The seeded store code is `HN01`.

## Documentation

- [Architecture](./ARCHITECTURE.md)
- [Development Guide](./docs/development.md)
- [API Reference](./docs/api-reference.md)
- [Database Schema](./docs/database-schema.md)
- [Deployment Guide](./docs/deployment.md)
- [Security Guide](./docs/security.md)
- [Product Requirements (Vietnamese)](./docs/mvp1-requirements.md)

## Known Current-State Caveats

- `AGENTS.md` still contains earlier planning-phase statements and should not be treated as the runtime source of truth.
- The web and mobile auth clients currently expect `access_token`, while the backend returns `accessToken`.
- The web reports and audit pages currently call some paths that do not match the backend controllers.
- `TenantGuard`, `StoreScopeGuard`, and `AuditInterceptor` exist in `libs/common`, but they are not visibly registered globally or attached to controllers.
- The migration schema and some service SQL currently disagree on several enum and column names. The schema guide documents the migrations as the source of truth and calls out the mismatches explicitly.

## Contributing

Recommended branch naming:

- `feature/<topic>` for new features
- `fix/<topic>` for bug fixes
- `docs/<topic>` for documentation-only changes
- `chore/<topic>` for maintenance work

Recommended PR guidance:

- keep changes scoped to one concern
- link the relevant OpenSpec change when one exists
- mention any schema, route, or env-var changes explicitly
- include verification notes such as `pnpm build`, `pnpm test:e2e`, `flutter analyze`, or `pnpm i18n:check`
