## ADDED Requirements

### Requirement: Deployment guide covers Docker Compose production setup
docs/deployment.md SHALL document how to deploy all services (PostgreSQL, MinIO, NestJS API, Next.js) using Docker Compose, including image versions and volume configuration.

#### Scenario: Ops deploys from scratch
- **WHEN** an ops engineer follows the deployment guide on a fresh server
- **THEN** all services start and pass health checks

### Requirement: Deployment guide documents all environment variables
docs/deployment.md SHALL list every environment variable required for production with its purpose, example value, and security classification (secret vs. non-secret).

#### Scenario: Configuring production environment
- **WHEN** an ops engineer configures the production `.env`
- **THEN** they have a complete reference for every variable including which ones are secrets

### Requirement: Deployment guide includes migration runbook
docs/deployment.md SHALL document the migration runbook: run `pnpm migration:run` before starting the API, how to verify migrations succeeded, and how to revert a failed migration.

#### Scenario: Deploying a new version with migrations
- **WHEN** a new version includes database migrations
- **THEN** the ops engineer follows the runbook to run migrations before switching traffic

### Requirement: Deployment guide covers MinIO initialization
docs/deployment.md SHALL document MinIO bucket initialization: creating the `pawn-platform` private bucket, setting access policy, and the minio-init container pattern from docker-compose.yml.

#### Scenario: MinIO setup on new deployment
- **WHEN** MinIO is deployed fresh
- **THEN** the guide explains how to initialize the bucket and verify it is private

### Requirement: Deployment guide documents health check endpoints
docs/deployment.md SHALL document how to verify the deployment is healthy: API health endpoint, database connectivity check, MinIO connectivity check.

#### Scenario: Verifying deployment health
- **WHEN** an ops engineer deploys a new version
- **THEN** they can run the documented health checks to confirm the system is operational
