## Context

paw8 MVP1 is complete: NestJS modular monolith (12 libs), Next.js web portal (16 pages), Flutter mobile app (20 screens), PostgreSQL with 7 migration files, MinIO file storage, and full i18n (vi/en/zh). No developer documentation exists. Any new contributor must read source code to understand the architecture, set up their environment, or deploy the system.

## Goals / Non-Goals

**Goals:**
- Provide a canonical reference for every aspect of the system a developer needs to operate it
- Document the architecture decisions that are not obvious from reading code (tenant isolation, append-only transactions, contract code generation)
- Give a complete API reference so frontend/mobile devs can integrate without reading NestJS source
- Provide a deployment runbook so ops can stand up the system reliably
- Document the security model so reviewers understand what is enforced and where

**Non-Goals:**
- End-user documentation (UX guides, user manuals)
- API client SDKs or Postman collections
- CI/CD pipeline setup (not yet implemented)
- Performance benchmarks or load testing results
- Changelog or versioning policy

## Decisions

### D1: Documentation lives in the repo, not an external wiki

All docs in `docs/` directory + `README.md` + `ARCHITECTURE.md` at root. Rationale: docs stay in sync with code via the same PR workflow; no external service dependency; GitHub renders Markdown natively. Alternative (Notion/Confluence) rejected because it decouples docs from code.

### D2: API reference is hand-authored Markdown, not auto-generated

The NestJS code does not have Swagger decorators yet. Auto-generation would require a non-trivial setup (adding `@ApiProperty` to all 100+ DTOs). Hand-authored reference from reading the existing controllers and DTOs is faster and complete for the current surface area. Swagger can replace this in a future change.

### D3: One doc per concern, single root README as index

Seven documents: README (index), ARCHITECTURE, development guide, API reference, database schema, deployment guide, security guide. Each has a single clear audience and purpose. Alternative (one mega-doc) rejected because it becomes unmaintainable and hard to link to specific sections.

### D4: Database schema doc reflects actual migration files, not an ideal model

The schema doc is generated from reading the 7 migration TypeScript files, not from an idealized ERD. This ensures accuracy with the actual deployed schema. Diagrams use ASCII/Mermaid so they render in GitHub without external tools.

### D5: Security doc maps every enforcement point to code location

Each security invariant (tenant isolation, store scope, file access, append-only transactions) is documented with the file and mechanism that enforces it. This allows security reviewers to verify coverage without reading all code.

## Risks / Trade-offs

- [Risk] Docs become stale as code evolves → Mitigation: Each doc section references the specific file (e.g., migration filename) so drift is detectable
- [Risk] API reference may have errors since it's hand-authored → Mitigation: Written by reading actual controller + DTO files; future Swagger setup will replace it
- [Risk] Architecture doc describes current implementation, not intended target → Mitigation: Clearly labeled "current state" vs "future direction" sections

## Migration Plan

No code changes. Files to create:
1. `README.md` (root)
2. `ARCHITECTURE.md` (root)
3. `docs/development.md`
4. `docs/api-reference.md`
5. `docs/database-schema.md`
6. `docs/deployment.md`
7. `docs/security.md`

No rollback needed — documentation is additive.

## Open Questions

- Should `docs/api-reference.md` include example curl commands? (decision: yes, one example per endpoint group)
- Should the ER diagram use Mermaid or ASCII? (decision: Mermaid — GitHub renders it natively)
