import { BadRequestException } from '@nestjs/common';
import { ContractStatus } from './dto/contract.dto';

/**
 * Valid status transitions for pawn contracts.
 * Key: current status → Value: set of allowed next statuses
 *
 * Design principle: only explicit transitions are permitted.
 * Use force=true (admin-only) to bypass for corrections.
 */
export const VALID_TRANSITIONS: Record<ContractStatus, Set<ContractStatus>> = {
  [ContractStatus.DRAFT]: new Set([
    ContractStatus.ACTIVE,
    ContractStatus.CANCELLED,
  ]),
  [ContractStatus.ACTIVE]: new Set([
    ContractStatus.NEAR_DUE,
    ContractStatus.OVERDUE,
    ContractStatus.EXTENDED,
    ContractStatus.SETTLED,
    ContractStatus.CANCELLED,
  ]),
  [ContractStatus.NEAR_DUE]: new Set([
    ContractStatus.ACTIVE,
    ContractStatus.OVERDUE,
    ContractStatus.EXTENDED,
    ContractStatus.SETTLED,
    ContractStatus.CANCELLED,
  ]),
  [ContractStatus.OVERDUE]: new Set([
    ContractStatus.EXTENDED,
    ContractStatus.SETTLED,
    ContractStatus.LIQUIDATION_PENDING,
    ContractStatus.CANCELLED,
  ]),
  [ContractStatus.EXTENDED]: new Set([
    ContractStatus.NEAR_DUE,
    ContractStatus.OVERDUE,
    ContractStatus.SETTLED,
    ContractStatus.CANCELLED,
  ]),
  [ContractStatus.SETTLED]: new Set([
    // Terminal — no transitions allowed
  ]),
  [ContractStatus.CANCELLED]: new Set([
    // Terminal — no transitions allowed
  ]),
  [ContractStatus.LIQUIDATION_PENDING]: new Set([
    ContractStatus.LIQUIDATED,
    ContractStatus.SETTLED,
  ]),
  [ContractStatus.LIQUIDATED]: new Set([
    // Terminal — no transitions allowed
  ]),
};

/** Statuses from which no further transitions are possible */
export const TERMINAL_STATUSES = new Set<ContractStatus>([
  ContractStatus.SETTLED,
  ContractStatus.CANCELLED,
  ContractStatus.LIQUIDATED,
]);

/**
 * Validate that a transition from `from` → `to` is permitted.
 * Throws BadRequestException if the transition is invalid.
 *
 * @param from  Current contract status
 * @param to    Requested next status
 * @param force If true, skip transition check (admin override only)
 */
export function validateTransition(
  from: ContractStatus,
  to: ContractStatus,
  force = false,
): void {
  if (force) return;

  const allowed = VALID_TRANSITIONS[from];
  if (!allowed || !allowed.has(to)) {
    throw new BadRequestException(
      `Invalid status transition: ${from} → ${to}. Allowed: ${
        allowed && allowed.size > 0
          ? [...allowed].join(', ')
          : 'none (terminal status)'
      }`,
    );
  }
}

/**
 * Returns whether a given status is terminal (no outgoing transitions).
 */
export function isTerminalStatus(status: ContractStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

/**
 * Returns the set of statuses reachable from a given current status.
 */
export function getAllowedTransitions(from: ContractStatus): ContractStatus[] {
  return [...(VALID_TRANSITIONS[from] ?? [])];
}
