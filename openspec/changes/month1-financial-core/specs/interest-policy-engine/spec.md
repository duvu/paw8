# Spec: Interest Policy Engine

## Overview

Tenant-configurable interest and fee policies stored in a dedicated `interest_policies` table. Provides default rates, late fees, storage fees, extension fees, and grace periods. Integrated into settlement calculation.

## Database Schema

### New table: `interest_policies`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| tenant_id | UUID | NOT NULL, FK→tenants(id) |
| name | VARCHAR(100) | NOT NULL |
| interest_type | interest_type_enum | NOT NULL |
| default_interest_rate | NUMERIC(8,4) | NOT NULL |
| late_fee_rate | NUMERIC(8,4) | DEFAULT 0 |
| extension_fee_flat | NUMERIC(18,2) | DEFAULT 0 |
| storage_fee_daily | NUMERIC(18,2) | DEFAULT 0 |
| grace_period_days | INTEGER | DEFAULT 0 |
| min_loan_amount | NUMERIC(18,2) | DEFAULT 0 |
| max_loan_amount | NUMERIC(18,2) | NULL |
| is_default | BOOLEAN | DEFAULT false |
| status | VARCHAR(20) | DEFAULT 'active' |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Constraints**: UNIQUE(tenant_id, name)
**Index**: (tenant_id, is_default, status)

### Altered table: `pawn_contracts`

Add column: `policy_id UUID REFERENCES interest_policies(id) NULL`

## API Endpoints

### `POST /api/v1/interest-policies`
- Auth: tenant_admin, tenant_owner
- Body: CreateInterestPolicyDto
- Returns: created policy

### `GET /api/v1/interest-policies`
- Auth: any authenticated user in tenant
- Query: `?status=active`
- Returns: list of policies for current tenant

### `GET /api/v1/interest-policies/:id`
- Auth: any authenticated user in tenant
- Returns: single policy

### `PATCH /api/v1/interest-policies/:id`
- Auth: tenant_admin, tenant_owner
- Body: UpdateInterestPolicyDto (partial)
- Returns: updated policy

### `POST /api/v1/interest-policies/:id/set-default`
- Auth: tenant_admin, tenant_owner
- Behavior: sets this policy as default, unsets previous default
- Returns: updated policy

## DTOs

### CreateInterestPolicyDto
```typescript
{
  name: string;              // @IsString @MaxLength(100)
  interestType: InterestType; // @IsEnum(InterestType)
  defaultInterestRate: number; // @IsNumber @Min(0) @Max(100)
  lateFeeRate?: number;       // @IsOptional @IsNumber @Min(0)
  extensionFeeFlat?: number;  // @IsOptional @IsNumber @Min(0)
  storageFeeDaily?: number;   // @IsOptional @IsNumber @Min(0)
  gracePeriodDays?: number;   // @IsOptional @IsInt @Min(0)
  minLoanAmount?: number;     // @IsOptional @IsNumber @Min(0)
  maxLoanAmount?: number;     // @IsOptional @IsNumber @Min(0)
}
```

### InterestPolicyResponseDto
All fields from table mapped to camelCase.

## Integration with Settlement

`TransactionsService.calculateSettlement()` enhanced:
1. Fetch contract → get `policy_id`
2. If `policy_id` is set, load policy
3. Calculate late fee: if overdue days > grace_period_days, `(overdueDays - gracePeriodDays) * (lateFeeRate/100) * principal`
4. Calculate storage fee: `overdueDays * storageFeeDaily`
5. Extension fee: applied only during `extendContract()` flow
6. If no policy: all fees = 0 (backward compatible)

## Files

- `libs/contracts/src/interest-policies.controller.ts` — new
- `libs/contracts/src/interest-policies.service.ts` — new
- `libs/contracts/src/interest-policies.repository.ts` — new
- `libs/contracts/src/dto/interest-policy.dto.ts` — new
- `apps/api-gateway/src/migrations/1700000009000-CreateInterestPolicies.ts` — new
- `libs/transactions/src/transactions.service.ts` — modified (calculateSettlement)
- `libs/transactions/src/transactions.repository.ts` — modified (add findPolicyById)
