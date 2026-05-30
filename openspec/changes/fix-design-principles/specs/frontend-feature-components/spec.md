## ADDED Requirements

### Requirement: Feature-specific components live in components/features/<domain>/
The `apps/web/` directory SHALL have a `components/features/` directory. Feature-specific React components (those tied to a business domain like contracts, customers, assets) SHALL reside in `components/features/<domain>/` subdirectories, not in `components/ui/`.

#### Scenario: Feature component in correct location
- **WHEN** a developer adds a component like `ContractStatusBadge`
- **THEN** the file is created at `apps/web/components/features/contracts/ContractStatusBadge.tsx`, not in `components/ui/`

#### Scenario: Generic UI components remain in components/ui/
- **WHEN** a component has no domain-specific business logic (e.g., Button, Table, Modal)
- **THEN** it remains in `apps/web/components/ui/` unchanged

### Requirement: Each feature folder has a barrel index export
Every `components/features/<domain>/` directory SHALL have an `index.ts` that re-exports all components in that folder.

#### Scenario: Page imports from barrel
- **WHEN** a page component imports a feature component
- **THEN** the import path is `@/components/features/contracts` not `@/components/features/contracts/ContractStatusBadge`
