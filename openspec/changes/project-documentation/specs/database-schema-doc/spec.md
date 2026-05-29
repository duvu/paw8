## ADDED Requirements

### Requirement: Database schema doc covers all tables
docs/database-schema.md SHALL document every table in the 7 migration files: tenants, tenant_settings, stores, users, roles, user_roles, user_store_assignments, customers, customer_documents, assets, asset_inventory, pawn_contracts, contract_assets, contract_status_history, contract_transactions, contract_extensions, payment_receipts, files, audit_logs, refresh_tokens, interest_policies, contract_sequences.

#### Scenario: Developer looks up a table
- **WHEN** a developer needs to understand the `pawn_contracts` table
- **THEN** they find every column, its type, constraints, and purpose

### Requirement: Each table entry lists columns, types, and constraints
For every table, docs/database-schema.md SHALL list: column name, PostgreSQL data type, nullable/not-null, default value if any, and any unique or foreign key constraints.

#### Scenario: Developer adds a migration
- **WHEN** a developer writes a new migration
- **THEN** the schema doc shows existing column types and constraints so they can maintain consistency

### Requirement: Database schema doc explains indexes
docs/database-schema.md SHALL list all indexes created in the migrations with the columns indexed and the reason (e.g., "index on tenant_id+status for filtered list queries").

#### Scenario: Developer understands query performance
- **WHEN** a developer writes a query filtering by tenant_id and status
- **THEN** the schema doc confirms an index exists for that pattern

### Requirement: Database schema doc includes an ER diagram
docs/database-schema.md SHALL include a Mermaid ERD showing the primary relationships between core tables.

#### Scenario: Developer understands entity relationships
- **WHEN** a developer reads the schema doc
- **THEN** the ERD shows how contracts, customers, assets, and transactions relate

### Requirement: Database schema doc explains the append-only transaction rule
docs/database-schema.md SHALL include a note on the `contract_transactions` table explaining the append-only constraint and the void/reversal/adjustment pattern.

#### Scenario: Developer understands financial record immutability
- **WHEN** a developer wants to correct a transaction error
- **THEN** the schema doc explains they must insert a void/reversal record, not update the original
