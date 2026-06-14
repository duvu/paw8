# Spec: Contract State Machine

## Overview

Enforce valid contract status transitions via a deterministic transition map. Invalid transitions throw `BadRequestException`. All transitions are recorded in `contract_status_history`.

## Transition Map

```
DRAFT                → [ACTIVE, CANCELLED]
ACTIVE               → [NEAR_DUE, OVERDUE, EXTENDED, SETTLED, CANCELLED]
NEAR_DUE             → [OVERDUE, EXTENDED, SETTLED, CANCELLED]
OVERDUE              → [EXTENDED, SETTLED, LIQUIDATION_PENDING, CANCELLED]
EXTENDED             → [ACTIVE, NEAR_DUE, OVERDUE, SETTLED, CANCELLED]
SETTLED              → []
CANCELLED            → []
LIQUIDATION_PENDING  → [LIQUIDATED, CANCELLED]
LIQUIDATED           → []
```

## Implementation

### File: `libs/contracts/src/contract-state-machine.ts`

```typescript
import { ContractStatus } from './dto/contract.dto';
import { BadRequestException } from '@nestjs/common';

const VALID_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  [ContractStatus.DRAFT]: [ContractStatus.ACTIVE, ContractStatus.CANCELLED],
  [ContractStatus.ACTIVE]: [ContractStatus.NEAR_DUE, ContractStatus.OVERDUE, ContractStatus.EXTENDED, ContractStatus.SETTLED, ContractStatus.CANCELLED],
  [ContractStatus.NEAR_DUE]: [ContractStatus.OVERDUE, ContractStatus.EXTENDED, ContractStatus.SETTLED, ContractStatus.CANCELLED],
  [ContractStatus.OVERDUE]: [ContractStatus.EXTENDED, ContractStatus.SETTLED, ContractStatus.LIQUIDATION_PENDING, ContractStatus.CANCELLED],
  [ContractStatus.EXTENDED]: [ContractStatus.ACTIVE, ContractStatus.NEAR_DUE, ContractStatus.OVERDUE, ContractStatus.SETTLED, ContractStatus.CANCELLED],
  [ContractStatus.SETTLED]: [],
  [ContractStatus.CANCELLED]: [],
  [ContractStatus.LIQUIDATION_PENDING]: [ContractStatus.LIQUIDATED, ContractStatus.CANCELLED],
  [ContractStatus.LIQUIDATED]: [],
};

export function validateTransition(from: ContractStatus, to: ContractStatus): void {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid status transition: ${from} → ${to}. Allowed: [${(allowed || []).join(', ')}]`
    );
  }
}

export function isTerminalStatus(status: ContractStatus): boolean {
  return VALID_TRANSITIONS[status]?.length === 0;
}

export function getAllowedTransitions(status: ContractStatus): ContractStatus[] {
  return VALID_TRANSITIONS[status] || [];
}
```

## Integration Points

### ContractsService.updateStatus()
Before updating:
```typescript
validateTransition(currentContract.status, newStatus);
```

Exception: if caller passes `force: true` AND user role is `platform_admin` or `tenant_owner`, skip validation but still log to audit.

### TransactionsService.recordTransaction()
Before changing contract status on SETTLEMENT:
```typescript
validateTransition(contract.status, ContractStatus.SETTLED);
```

### TransactionsService.extendContract()
Before changing contract status:
```typescript
validateTransition(contract.status, ContractStatus.EXTENDED);
```

### ContractSchedulerService
When transitioning to NEAR_DUE or OVERDUE:
```typescript
validateTransition(contract.status, ContractStatus.NEAR_DUE);
// or
validateTransition(contract.status, ContractStatus.OVERDUE);
```

## API Enhancement

### `GET /api/v1/contracts/:id/allowed-transitions`
- Auth: any authenticated user with access to contract
- Returns: `{ currentStatus: string, allowedTransitions: string[] }`
- Purpose: Frontend can show only valid action buttons

## Files

- `libs/contracts/src/contract-state-machine.ts` — new
- `libs/contracts/src/contracts.service.ts` — modified (updateStatus adds validation)
- `libs/contracts/src/contracts.controller.ts` — modified (new endpoint)
- `libs/transactions/src/transactions.service.ts` — modified (validate before status change)
