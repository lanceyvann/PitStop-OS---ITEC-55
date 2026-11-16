/**
 * @file stateTransitions.ts
 * @description OS Process 5-State Lifecycle Transition Matrix.
 * Enforces legal state changes and rejects illegal state transitions.
 */

export type ProcessState = 'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';

/**
 * Valid transitions map: fromState -> allowed toStates[]
 */
export const LEGAL_TRANSITIONS: Record<ProcessState, ProcessState[]> = {
  NEW: ['READY'],
  READY: ['RUNNING', 'TERMINATED'], // Can be aborted if needed
  RUNNING: ['READY', 'WAITING', 'TERMINATED'],
  WAITING: ['READY', 'TERMINATED'], // When unblocked, must re-enter READY queue; or can be aborted
  TERMINATED: [], // Terminal sink state, no outgoing transitions
};

/**
 * Validates whether transitioning from `fromState` to `toState` is legally permitted.
 * @param fromState Current process state.
 * @param toState Intended target state.
 * @returns boolean indicating validity.
 */
export function isValidStateTransition(fromState: ProcessState, toState: ProcessState): boolean {
  if (fromState === toState) return true; // Idempotent no-op
  const allowed = LEGAL_TRANSITIONS[fromState];
  return Boolean(allowed && allowed.includes(toState));
}
