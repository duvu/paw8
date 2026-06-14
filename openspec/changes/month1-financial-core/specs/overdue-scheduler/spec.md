# Spec: Overdue Scheduler

## Overview

A NestJS cron job that runs daily to automatically transition contract statuses:
- ACTIVE contracts past `due_date` → OVERDUE
- ACTIVE contracts within 7 days of `due_date` → NEAR_DUE

Uses `@nestjs/schedule` package with `@Cron()` decorator.

## Dependencies

- Package: `@nestjs/schedule` (added to `apps/api-gateway/package.json`)
- Import: `ScheduleModule.forRoot()` in API gateway's `AppModule`

## Implementation

### File: `libs/contracts/src/contract-scheduler.service.ts`

```typescript
@Injectable()
export class ContractSchedulerService {
  private readonly logger = new Logger(ContractSchedulerService.name);

  constructor(
    private readonly contractsRepository: ContractsRepository,
  ) {}

  @Cron(process.env.SCHEDULER_CRON || '0 2 * * *')  // daily at 02:00
  async handleOverdueCheck(): Promise<void> {
    await this.markOverdue();
    await this.markNearDue();
  }

  async markOverdue(): Promise<number> {
    // SELECT contracts WHERE status IN ('active', 'near_due') AND due_date < CURRENT_DATE
    // For each: validateTransition(current, OVERDUE), update status, insert history
    // Return count
  }

  async markNearDue(): Promise<number> {
    // SELECT contracts WHERE status = 'active' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
    // For each: validateTransition(current, NEAR_DUE), update status, insert history
    // Return count
  }
}
```

### Batch Processing

- Query contracts in batches of 100 to avoid long transactions.
- Each contract transition is its own DB transaction (if one fails, others still proceed).
- Log summary: `"Overdue check complete: {n} → overdue, {m} → near_due"`.

### Manual Trigger Endpoint

`POST /api/v1/contracts/run-overdue-check`
- Auth: platform_admin, tenant_owner, tenant_admin
- Behavior: Runs `handleOverdueCheck()` for the caller's tenant only
- Returns: `{ overdueCount: number, nearDueCount: number }`
- Purpose: Allow testing without waiting for cron

### Repository Methods Needed

Add to `ContractsRepository`:

```typescript
findOverdueContracts(tenantId?: string): Promise<{ id, tenant_id, status }[]>
// WHERE status IN ('active','near_due') AND due_date < CURRENT_DATE
// If tenantId provided, filter by it; otherwise all tenants

findNearDueContracts(tenantId?: string, days?: number): Promise<{ id, tenant_id, status }[]>
// WHERE status = 'active' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $days
// If tenantId provided, filter by it; otherwise all tenants

batchUpdateStatus(ids: string[], newStatus: ContractStatus, changedBy: string): Promise<void>
// UPDATE pawn_contracts SET status=$1, updated_by=$2, updated_at=NOW() WHERE id = ANY($3)
// INSERT INTO contract_status_history for each
```

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| SCHEDULER_CRON | `0 2 * * *` | Cron expression for overdue check |
| NEAR_DUE_DAYS | `7` | Days before due_date to mark near_due |
| SCHEDULER_ENABLED | `true` | Set to `false` to disable in tests |

## Error Handling

- If a single contract fails to transition (e.g., already in terminal state due to race condition), log warning and continue.
- If database is unreachable, log error and retry on next cron cycle.
- No retry logic within a single run — next daily run catches anything missed.

## Files

- `libs/contracts/src/contract-scheduler.service.ts` — new
- `libs/contracts/src/contracts.repository.ts` — modified (add batch query methods)
- `libs/contracts/src/contracts.module.ts` — modified (register scheduler service)
- `libs/contracts/src/contracts.controller.ts` — modified (manual trigger endpoint)
- `apps/api-gateway/src/app.module.ts` — modified (import ScheduleModule.forRoot())
- `apps/api-gateway/package.json` — modified (add @nestjs/schedule)
