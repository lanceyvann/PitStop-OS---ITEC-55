export type ProcessState = 'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';

export const LEGAL_TRANSITIONS: Record<ProcessState, ProcessState[]> = {
  NEW: ['READY'],
  READY: ['RUNNING', 'TERMINATED'],
  RUNNING: ['READY', 'WAITING', 'TERMINATED'],
  WAITING: ['READY', 'TERMINATED'],
  TERMINATED: [], 
};

export function isValidStateTransition(fromState: ProcessState, toState: ProcessState): boolean {
  if (fromState === toState) return true; // Idempotent no-op
  const allowed = LEGAL_TRANSITIONS[fromState];
  return Boolean(allowed && allowed.includes(toState));
}
