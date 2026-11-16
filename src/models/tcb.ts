/**
 * @file tcb.ts
 * @description Thread Control Block (TCB) model.
 * Represents lightweight execution streams within a process (customer tire order).
 */

export interface TCB {
  tid: string;
  ownerPid: number;
  name: string;
  role: 'consult' | 'mount' | 'balance' | 'bill';
  state: 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';
  pc: number;               // Program counter (current step index)
  privateStack: string[];   // Thread-private execution stack frames
  heldLocks: string[];      // Locks acquired by this specific thread
}
