# Design: Month 1 — Financial Core

## Design Decisions

### D1: Interest Policies as Dedicated Table (not tenant_settings key-value)

**Decision**: Create `interest_policies` table with typed columns rather than storing JSON blobs in `tenant_settings`.

**Rationale**: Policy has multiple typed fields (rates, amounts, booleans, durations) — a key-value table requires parsing and provides no DB-level validation. A dedicated table allows constraints, defaults, and future per-store or per-asset-type policies.

**Schema**:
```sql
interest_policies (
  id UUID PK,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(100) NOT NULL,
  interest_type interest_type_enum NOT NULL,  -- reuse existing enum
  default_interest_rate NUMERIC(8,4) NOT NULL,
  late_fee_rate NUMERIC(8,4) DEFAULT 0,       -- % per day past due
  extension_fee_flat NUMERIC(18,2) DEFAULT 0, -- flat fee per extension
  storage_fee_daily NUMERIC(18,2) DEFAULT 0,  -- per-day storage cost
  grace_period_days INTEGER DEFAULT 0,
  min_loan_amount NUMERIC(18,2) DEFAULT 0,
  max_loan_amount NUMERIC(18,2),
  is_default BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
)
```

One tenant can have multiple policies (e.g., "Standard", "VIP", "High-risk"). Contracts reference a policy via `policy_id` column (nullable, for backward compatibility with existing contracts that store rate inline).

### D2: Contract State Machine as Pure Function Map

**Decision**: Implement as a simple `VALID_TRANSITIONS: Record<ContractStatus, ContractStatus[]>` constant in a dedicated `contract-state-machine.ts` file. No external state machine library.

**Rationale**: The transition graph is small (9 states, ~15 edges). A library like xstate adds complexity for no benefit. A pure map is testable, readable, and zero-dep.

**Transition Map**:
```
DRAFT       → [ACTIVE, CANCELLED]
ACTIVE      → [NEAR_DUE, OVERDUE, EXTENDED, SETTLED, CANCELLED]
NEAR_DUE    → [OVERDUE, EXTENDED, SETTLED, CANCELLED]
OVERDUE     → [EXTENDED, SETTLED, LIQUIDATION_PENDING, CANCELLED]
EXTENDED    → [ACTIVE, NEAR_DUE, OVERDUE, SETTLED, CANCELLED]
SETTLED     → []  (terminal)
CANCELLED   → []  (terminal)
LIQUIDATION_PENDING → [LIQUIDATED, CANCELLED]
LIQUIDATED  → []  (terminal)
```

Enforcement: `validateTransition(from, to)` throws `BadRequestException` with message explaining allowed targets. Called from `ContractsService.updateStatus()` AND from `TransactionsService.recordTransaction()` before status change.

### D3: Overdue Scheduler in Contracts Module (not separate module)

**Decision**: Add `ContractSchedulerService` inside `libs/contracts/` that uses `@Cron()` decorator. Register `ScheduleModule.forRoot()` in the API gateway `AppModule`.

**Rationale**: The scheduler's only job is contract status transitions — it belongs with contracts domain logic. Separate scheduler module would be over-engineering for one cron job.

**Behavior**:
- Runs daily at 02:00 AM (configurable via env `SCHEDULER_CRON`).
- Query 1: SELECT contracts WHERE status='active' AND due_date < NOW() → batch update to 'overdue'.
- Query 2: SELECT contracts WHERE status='active' AND due_date BETWEEN NOW() AND NOW()+7 days → batch update to 'near_due'.
- All transitions go through state machine validation.
- Records status history for each transition.
- Logs count of transitions per run.

### D4: Fee Calculation Integrated into calculateSettlement()

**Decision**: Modify `TransactionsService.calculateSettlement()` to:
1. Load contract's `policy_id` → fetch policy from `interest_policies`.
2. If policy exists, compute `lateFee = overdueDays * late_fee_rate/100 * principal`.
3. If no policy (legacy contracts), `feeDue = 0` (backward compatible).
4. Add `storageFee = overdueDays * storage_fee_daily` if applicable.

**Return type enhanced**:
```typescript
{
  principalAmount: number;
  interestDue: number;
  lateFee: number;
  storageFee: number;
  extensionFee: number;
  totalFee: number;       // lateFee + storageFee + extensionFee
  totalDue: number;       // principal + interest + totalFee
  alreadyPaid: number;
  remaining: number;
}
```

### D5: Seed Data as Executable TypeORM Migration

**Decision**: Create a migration file `1700000009000-SeedDevelopmentData.ts` that only runs when `NODE_ENV !== 'production'`. Uses raw SQL INSERTs with UUIDs.

**Rationale**: Migrations are already the project's DB change mechanism. A seed migration runs once via `typeorm migration:run`, integrates with existing tooling, and won't accidentally re-seed.

**Dataset**:
- 1 tenant: "Tiệm Cầm Đồ Phát Tài" (code: PTAI)
- 2 stores: "Chi nhánh Quận 1" (Q1), "Chi nhánh Quận 7" (Q7)
- 6 users: platform_admin, tenant_owner, tenant_admin, store_manager×2, staff×2
- 2 interest policies: "Tiêu chuẩn" (1.5%/month), "VIP" (1.2%/month)
- 10 customers with realistic Vietnamese names/CCCD
- 15 assets (mix of phones, laptops, motorcycles, gold)
- 12 contracts: 4 active, 2 near_due, 2 overdue, 2 settled, 1 extended, 1 cancelled
- Transaction history matching contract states

### D6: Policy Column Added to pawn_contracts (nullable FK)

**Decision**: Add `policy_id UUID REFERENCES interest_policies(id)` to `pawn_contracts`. Nullable for backward compatibility. When creating new contract, if tenant has a default policy, auto-assign. Contract still stores `interest_rate` and `interest_type` inline (snapshot at creation time).

**Rationale**: Policy may change after contract creation — the contract's rate must not change retroactively. `policy_id` is a reference for fee calculation; `interest_rate`/`interest_type` remain the authoritative values for interest computation.

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Scheduler not running in dev (no always-on process) | Add manual trigger endpoint: `POST /api/v1/contracts/run-overdue-check` (admin only) |
| Existing contracts have no policy_id | Nullable FK; fee calc returns 0 when no policy — backward compatible |
| Seed data conflicts with manual test data | Seed uses fixed UUIDs; can be re-run safely (INSERT ON CONFLICT DO NOTHING) |
| State machine blocks legitimate manual overrides | Platform admin / tenant_owner can bypass via `force: true` flag (logged in audit) |

## Migration Order

1. Create `interest_policies` table + add `policy_id` to `pawn_contracts` (migration)
2. Implement state machine (pure logic, no DB changes)
3. Wire state machine into contracts + transactions services
4. Implement scheduler
5. Enhance `calculateSettlement()` with fee logic
6. Create seed data migration
