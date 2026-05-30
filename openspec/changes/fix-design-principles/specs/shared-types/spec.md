## ADDED Requirements

### Requirement: Shared TypeScript interfaces in libs/shared-types
A new NestJS library `libs/shared-types` SHALL exist, containing pure TypeScript interfaces (no classes, no decorators, no NestJS imports) for all API request/response shapes. It SHALL be importable as `@paw8/shared-types`.

#### Scenario: Backend imports shared interface
- **WHEN** a NestJS DTO class is defined
- **THEN** it MAY implement or extend an interface from `@paw8/shared-types`

#### Scenario: Frontend imports shared interface
- **WHEN** the Next.js web app defines a type for an API response
- **THEN** it imports the interface from `@paw8/shared-types` instead of redefining it

### Requirement: libs/shared-types has zero framework dependencies
The `libs/shared-types` package SHALL have no runtime dependencies on `@nestjs/*`, `class-validator`, `class-transformer`, or any other framework library.

#### Scenario: Package.json has no runtime deps
- **WHEN** `libs/shared-types/package.json` is inspected
- **THEN** the `dependencies` field is empty or absent; only `devDependencies` may exist for TypeScript tooling
