## ADDED Requirements

### Requirement: Development guide covers prerequisites
docs/development.md SHALL list all prerequisites: Node.js 20+, pnpm 9+, Docker + Docker Compose, Flutter 3.x, Dart SDK, and bun (for oh-my-agent tooling).

#### Scenario: Missing prerequisite is discoverable
- **WHEN** a developer tries to set up the project and encounters an error
- **THEN** they can find the full prerequisite list and identify what is missing

### Requirement: Development guide explains environment variable setup
docs/development.md SHALL document every environment variable in `.env.example` with its purpose, default value, and whether it is required or optional.

#### Scenario: Developer configures environment
- **WHEN** a developer copies `.env.example` to `.env`
- **THEN** the development guide explains each variable so they can adjust for their local setup

### Requirement: Development guide explains running each app
docs/development.md SHALL provide commands to start: PostgreSQL + MinIO via Docker Compose, NestJS API (port 3100), Next.js web (port 3000), and Flutter mobile (emulator/device).

#### Scenario: All three apps running locally
- **WHEN** a developer follows the run instructions
- **THEN** they can have all three apps running simultaneously against the local Docker services

### Requirement: Development guide covers running tests
docs/development.md SHALL document how to run: NestJS unit tests, NestJS e2e integration tests, Next.js build verification, and Flutter analyze.

#### Scenario: Running the full test suite
- **WHEN** a developer runs the documented test commands
- **THEN** all test suites execute and report results

### Requirement: Development guide covers running database migrations
docs/development.md SHALL document the migration workflow: `pnpm migration:run`, `pnpm migration:revert`, and `pnpm seed` with expected output.

#### Scenario: Fresh database setup
- **WHEN** a developer starts with an empty PostgreSQL instance
- **THEN** the guide walks them through running migrations + seed to get a working database with sample data
