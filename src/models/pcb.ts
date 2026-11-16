/**
 * @file pcb.ts
 * @description Process Control Block (PCB) representing a customer tire order.
 * Contains scheduling metadata, state, registers, thread table, and burst plan.
 */

import { ProcessState } from './stateTransitions';
import { LockId } from './lock';
import { TCB } from './tcb';

export interface BurstSegment {
  id: string;
  type: 'CPU' | 'IO';
  duration: number;        // Total duration in ticks
  remaining: number;       // Remaining duration in current segment
  label: string;           // Story label: e.g. "Mounting Tires", "Wheel Balancing", "POS Payment"
  requiredLock?: LockId;   // Mutex required before executing this segment
  requiresStock?: boolean; // Requires tire stock reservation
}

export interface CpuRegisters {
  PC: number;             // Program Counter
  SP: number;             // Stack Pointer
  AX: number;             // General Accumulator (e.g. tire count processed)
  BX: number;             // Base Register (e.g. torque value in Nm)
  CX: number;             // Counter Register (e.g. wheel balancing balance deviation)
  DX: number;             // Data Register (e.g. invoice total or tire inventory ID)
}

export interface PCB {
  pid: number;
  name: string;
  vehicleType: string;      // e.g. 'sedan', 'motorcycle', 'truck'
  modelName: string;        // e.g. "Toyota Vios"
  tireSpec: string;         // e.g. "195/65 R15"
  tireCount: number;        // e.g. 4
  state: ProcessState;
  priority: number;         // 1 (lowest) to 10 (highest/fleet rush)
  basePriority: number;     // Original priority before aging
  agingBoost: number;       // Accumulated priority boost from aging
  arrivalTime: number;      // Clock tick when process entered system
  
  burstPlan: BurstSegment[];
  currentSegmentIndex: number;
  
  totalCpuBurst: number;    // Sum of all CPU segments
  totalIoBurst: number;     // Sum of all IO segments
  remainingCpuTime: number; // Remaining CPU burst ticks
  
  registers: CpuRegisters;
  parentPid: number | null;
  childrenPids: number[];
  threads: TCB[];
  
  // Timing & scheduling metrics
  firstCpuTime: number | null;
  completionTime: number | null;
  waitingTime: number;      // Ticks spent in READY or WAITING
  turnaroundTime: number;   // completion - arrival
  responseTime: number;     // firstCpuTime - arrival
  
  // Resource state
  heldLocks: LockId[];
  waitingForLock: LockId | null;
  waitingForStock: { tireId: string; quantity: number } | null;
  waitingReason?: string;
  
  // Flags
  isDeadlocked?: boolean;
  color: string;            // Deterministic color for Gantt row
}
