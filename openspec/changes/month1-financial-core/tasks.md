# Tasks: Month 1 — Financial Core

## Group 1: Database Migration — Interest Policies + Contract Policy FK

- [x] 1.1 Create migration file `1700000009000-CreateInterestPolicies.ts` with `interest_policies` table schema
- [x] 1.2 Add `policy_id UUID REFERENCES interest_policies(id) NULL` column to `pawn_contracts` in same migration
- [x] 1.3 Add index `(tenant_id, is_default, status)` on `interest_policies`
- [x] 1.4 Add index `(policy_id)` on `pawn_contracts`
- [x] 1.5 Run migration locally and verify tables created: `pnpm typeorm migration:run`

## Group 2: Interest Policy CRUD

- [x] 2.1 Create `libs/contracts/src/dto/interest-policy.dto.ts` with CreateInterestPolicyDto + UpdateInterestPolicyDto + InterestPolicyResponseDto (class-validator decorators + @ApiProperty)
- [x] 2.2 Create `libs/contracts/src/interest-policies.repository.ts` — insert, findAll, findById, update, setDefault, findDefaultByTenant
- [x] 2.3 Create `libs/contracts/src/interest-policies.service.ts` — create, findAll, findOne, update, setDefault (unset previous)
- [x] 2.4 Create `libs/contracts/src/interest-policies.controller.ts` — POST, GET list, GET :id, PATCH :id, POST :id/set-default (@ApiTags, @ApiBearerAuth)
- [x] 2.5 Register InterestPoliciesRepository + InterestPoliciesService + InterestPoliciesController in `contracts.module.ts`
- [x] 2.6 Verify LSP diagnostics clean on all new files

## Group 3: Contract State Machine

- [x] 3.1 Create `libs/contracts/src/contract-state-machine.ts` with VALID_TRANSITIONS map, validateTransition(), isTerminalStatus(), getAllowedTransitions()
- [x] 3.2 Modify `ContractsService.updateStatus()` — call `validateTransition(currentStatus, newStatus)` before update. Add `force?: boolean` parameter that skips validation (for admin override, logged in audit)
- [x] 3.3 Add endpoint `GET /api/v1/contracts/:id/allowed-transitions` in contracts.controller.ts — returns currentStatus + allowed transitions array
- [x] 3.4 Modify `TransactionsService.recordTransaction()` — call `validateTransition()` before changing contract status to SETTLED
- [x] 3.5 Modify `TransactionsService.extendContract()` — call `validateTransition()` before changing contract status to EXTENDED/ACTIVE
- [x] 3.6 Verify LSP diagnostics clean on modified files

## Group 4: Overdue Scheduler

- [x] 4.1 Install `@nestjs/schedule`: `pnpm add @nestjs/schedule --filter api-gateway`
- [x] 4.2 Import `ScheduleModule.forRoot()` in `apps/api-gateway/src/app.module.ts`
- [x] 4.3 Add repository methods to `contracts.repository.ts`: `findOverdueContracts(tenantId?)`, `findNearDueContracts(tenantId?, days?)`, `batchUpdateStatus(ids, newStatus, changedBy)`
- [x] 4.4 Create `libs/contracts/src/contract-scheduler.service.ts` with `@Cron()` decorator, `markOverdue()`, `markNearDue()` methods, batch processing (100 per batch), state machine validation per contract
- [x] 4.5 Add manual trigger endpoint `POST /api/v1/contracts/run-overdue-check` (admin only) in contracts.controller.ts
- [x] 4.6 Register `ContractSchedulerService` in `contracts.module.ts`
- [x] 4.7 Add env vars to `.env.example`: SCHEDULER_CRON, NEAR_DUE_DAYS, SCHEDULER_ENABLED
- [x] 4.8 Verify LSP diagnostics clean

## Group 5: Enhanced Settlement Calculation

- [x] 5.1 Add `findPolicyById(policyId)` method to `transactions.repository.ts` (or contracts repository — wherever settlement is calculated)
- [x] 5.2 Modify `TransactionsService.calculateSettlement()` — load policy via contract's policy_id, compute lateFee (overdueDays beyond grace period * rate * principal), storageFee (overdueDays * daily rate)
- [x] 5.3 Update return type to include lateFee, storageFee, extensionFee, totalFee fields (backward compatible: all 0 when no policy)
- [x] 5.4 Update CreateContractDto to accept optional `policyId` field; in `ContractsService.create()`, if policyId provided use it, else find tenant's default policy
- [x] 5.5 Verify LSP diagnostics clean on transactions + contracts services

## Group 6: Seed Data

- [x] 6.1 Create `apps/api-gateway/src/migrations/1700000010000-SeedDevelopmentData.ts` — production guard at top
- [x] 6.2 Insert tenant (1), stores (2), users (6) with bcrypt-hashed passwords, roles, user_roles, user_store_assignments
- [x] 6.3 Insert interest_policies (2) — "Tiêu chuẩn" (3%/month, default) + "VIP" (2%/month)
- [x] 6.4 Insert customers (10) with Vietnamese names, CCCD, phone, addresses
- [x] 6.5 Insert assets (15) — mix of motorcycle, phone, laptop, gold, watch, electronics
- [x] 6.6 Insert contracts (12) with various statuses, linked assets via contract_assets, policy_id references
- [x] 6.7 Insert transactions (disbursements, interest collections, settlements, extension) matching contract states
- [x] 6.8 Insert contract_status_history entries for all non-draft contracts
- [x] 6.9 Insert asset_inventory records for assets currently held
- [x] 6.10 Use ON CONFLICT DO NOTHING for all inserts (idempotent)
- [x] 6.11 Implement `down()` method that DELETEs by fixed UUIDs
- [x] 6.12 Run migration and verify data: `pnpm typeorm migration:run`

## Group 7: Integration Verification

- [x] 7.1 TypeScript compile: `pnpm tsc --noEmit` — 0 errors
- [x] 7.2 Verify state machine: manually test invalid transition returns 400
- [x] 7.3 Verify settlement returns fee breakdown when policy exists
- [x] 7.4 Verify scheduler manual trigger works: POST /api/v1/contracts/run-overdue-check
- [x] 7.5 Verify seed data accessible via existing API endpoints (GET contracts, customers, etc.)
