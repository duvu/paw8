# Proposal: Month 1 — Financial Core

## Why

The backend has basic `calculateInterest()` and `calculateSettlement()` but critical financial logic is missing or incomplete:

1. **No interest/fee policies** — Interest rates are stored per-contract but there's no tenant-level policy table for default rates, fee schedules, grace periods, or late penalty configuration. `feeDue` is hardcoded to 0.
2. **No contract state machine** — `updateStatus()` accepts ANY `ContractStatus` value without transition validation. Nothing prevents jumping from DRAFT to SETTLED or OVERDUE to ACTIVE.
3. **No overdue scheduler** — Contracts don't auto-transition to NEAR_DUE or OVERDUE. Staff must manually check and update status.
4. **No seed data** — Zero sample data exists for development/testing. Every developer starts from empty tables.

These are blocking issues for production: without a state machine, data integrity is at risk; without a scheduler, overdue contracts go undetected; without policies, interest/fee logic can't be configured per-tenant.

## What Changes

### New capabilities

- `interest-policy-engine` — Migration for `interest_policies` table + service to load/apply tenant-specific rates, fees, grace periods. Refactor `calculateSettlement()` to use policy-driven fees instead of hardcoded 0.
- `contract-state-machine` — Strict transition map enforced in `ContractsService.updateStatus()`. Invalid transitions throw `BadRequestException`. History recorded in `contract_status_history`.
- `overdue-scheduler` — `@nestjs/schedule` cron job running daily. Transitions ACTIVE contracts past `due_date` to OVERDUE, and contracts within 7 days of `due_date` to NEAR_DUE.
- `seed-data` — TypeORM migration-style seed script inserting a complete test dataset: 1 tenant, 2 stores, 6 users (all roles), 10 customers, 15 assets, 12 contracts (various states), transactions history.

### Modified capabilities

- `contracts` — State machine enforcement in `updateStatus()`, integration with policy engine for fee lookup.
- `transactions` — `calculateSettlement()` uses policy-driven fees; `recordTransaction()` validates state transitions via state machine before changing status.

## Impact

| Area | Files affected |
|------|---------------|
| Database | New migration: `interest_policies` table |
| libs/contracts | `contracts.service.ts`, `contracts.repository.ts`, new `state-machine.ts` |
| libs/transactions | `transactions.service.ts`, `transactions.repository.ts` |
| libs/common | New `libs/scheduler/` module OR scheduler inside contracts |
| Seed | New `seed/` directory with seed script |
| package.json | `@nestjs/schedule` added to api-gateway |

No frontend changes. No breaking API changes (existing endpoints gain validation; invalid transitions that previously succeeded will now return 400).
