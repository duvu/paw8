# Draft: Codebase Consistency Hardening

## Requirements (confirmed)
- User asked for continuation from previous assistant state.
- Prior likely next focus: simplify codebase, strengthen architecture, maintain consistency, avoid interface drift.
- Planning only: no implementation in this session.
- User chose the next work plan scope as a full 4-wave consistency-hardening plan.
- User chose TDD where feasible as the preferred test strategy.
- User wants Flutter mobile included in the same auth contract-alignment scope.
- User wants temporary backward compatibility for token-field drift during rollout.
- User wants documentation/contract SSOT updates included in done criteria.
- User wants migrations/schema treated as the DB source of truth when drift exists.
- User wants the temporary auth compatibility shim added and later removed within the same overall work plan.
- User wants guard/interceptor hardening rolled out explicitly per controller/module first, with global registration deferred.
- User wants this plan kept strictly to consistency hardening only: no opportunistic redesign or adjacent feature work.

## Technical Decisions
- Repository uses OpenSpec-style workflow context, but no active `openspec/specs/*` or `openspec/changes/*` files were found in the current workspace scan.
- Current runtime docs in `README.md` are more accurate than the older planning-era notes in `AGENTS.md`.
- Oracle recommendation: plan sequence should be contract freeze/inventory -> API contract alignment -> DB/schema-service alignment -> tenant/store/audit enforcement hardening.
- Oracle recommendation: avoid one cleanup mega-change in execution terms; instead keep one plan with staged waves and dependency guardrails.
- Auth contract alignment should use a temporary compatibility shim/normalizer rather than a coordinated breaking cutover.
- Contract alignment scope includes backend, web, and mobile together.
- Documentation updates should be part of the same plan, not deferred.
- Migrations/schema will be treated as authoritative for database reconciliation.
- Compatibility-shim cleanup will be a later wave inside the same plan.
- Guard/interceptor enforcement should begin with explicit attachment/classification, not immediate global rollout.

## Research Findings
- `README.md` states the codebase is now a working MVP1 with API, web, mobile, migrations, MinIO integration, and i18n.
- `README.md` lists current consistency risks:
  - web/mobile auth clients expect `access_token` while backend returns `accessToken`
  - some web reports/audit paths do not match backend controllers
  - `TenantGuard`, `StoreScopeGuard`, and `AuditInterceptor` exist but are not visibly wired globally or per controller
  - migration schema and some service SQL disagree on enum/column names
- Direct repository scan refined those caveats:
  - backend test infrastructure exists (`jest`, `test:e2e`, existing auth/app/integration tests)
  - web currently has no usable automated test stack/scripts; execution plan should rely on agent QA there unless test setup is explicitly added
  - mobile has baseline `flutter_test` support but no current Dart test files were found
  - active auth response contract is already aligned on camelCase across backend, web, and mobile; snake_case remains only in local storage key names
  - active reports and audit web routes match backend controllers under `/api/v1`
  - guards/interceptor are already globally registered in `apps/api-gateway/src/app.module.ts`
  - remaining meaningful drift is concentrated in residual schema/domain inconsistencies and weak enforcement/classification coverage, not missing registration
- Confirmed active residual drift from direct scan:
  - `libs/reports/src/reports.repository.ts` still queries asset status `'pawned'`
  - `libs/reports/src/reports.service.ts` still filters assets with status `'pawned'`
  - `libs/shared-types/src/contract.types.ts` still uses interest type `'per_term'` instead of migration/runtime `'per_period'`
  - `libs/contracts/src/contracts.service.ts` still uses some `pawned` naming while checking actual status `'holding'`
- Confirmed guard/interceptor behavior caveats from direct scan:
  - `TenantGuard` only actively enforces tenant match when route `:tenantId` is present
  - `StoreScopeGuard` only inspects `params.storeId` or `body.storeId`; otherwise it allows through and relies on service-layer filtering
  - `AuditInterceptor` is global but only records when `@Audit(...)` metadata exists and it swallows logging failure

## Scope Boundaries
- INCLUDE: clarifying and planning the next architecture/consistency change.
- INCLUDE: strict contract/schema/guard consistency hardening only.
- EXCLUDE: direct code changes or implementation.
- EXCLUDE: opportunistic refactors, schema redesign beyond reconciliation, and adjacent feature work.

## Open Questions
- No major blocking discovery questions remain from the repository scan.
- One planning judgment remains implicit and can be carried into the final plan unless contradicted: contract-freeze wave should now focus on codifying the currently-true runtime contracts and correcting stale docs/SSOT references, not on fixing a proven live auth/route mismatch.
