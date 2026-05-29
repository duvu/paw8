## ADDED Requirements

### Requirement: Architecture document describes system components
ARCHITECTURE.md SHALL describe all top-level system components: NestJS API gateway, Next.js web portal, Flutter mobile app, PostgreSQL database, and MinIO file storage.

#### Scenario: Component overview is complete
- **WHEN** a developer reads ARCHITECTURE.md
- **THEN** they understand how each component relates to the others and what responsibilities each has

### Requirement: Architecture document explains module boundaries
ARCHITECTURE.md SHALL list all 12 NestJS libs (auth, tenants, stores, users, customers, assets, contracts, transactions, files, reports, audit, common) with a one-line responsibility description each.

#### Scenario: Module responsibilities are clear
- **WHEN** a developer needs to add a feature
- **THEN** they can determine which module owns the feature from the architecture doc

### Requirement: Architecture document explains tenant isolation pattern
ARCHITECTURE.md SHALL describe the multi-tenant isolation approach: shared database, shared schema, tenant_id on every business table, JWT-derived tenant context, TenantGuard enforcement.

#### Scenario: Tenant isolation pattern is understood
- **WHEN** a developer reads the tenant isolation section
- **THEN** they understand that frontend MUST NOT pass tenant_id and the backend derives it from JWT

### Requirement: Architecture document includes Mermaid ER diagram
ARCHITECTURE.md SHALL include a Mermaid diagram showing the main entity relationships (tenants → stores → users, pawn_contracts → contract_transactions, assets → contract_assets).

#### Scenario: ER diagram renders on GitHub
- **WHEN** a developer views ARCHITECTURE.md on GitHub
- **THEN** the ER diagram renders as a visual diagram
