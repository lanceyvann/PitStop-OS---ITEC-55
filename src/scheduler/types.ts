/**
 * @file types.ts
 * @description CPU Scheduler Strategy interface and decision structures.
 */

import { PCB } from '../models/pcb';

export type AlgorithmType = 'FCFS' | 'SJF' | 'RR' | 'PRIORITY';

export interface SchedulingDecision {
  nextPid: number | null;
  shouldPreempt: boolean;
  reason: string;
}

export interface SchedulingContext {
  readyQueue: PCB[];
  currentRunning: PCB | null;
  currentQuantumUsed: number;
  quantum: number;
  agingEnabled: boolean;
  agingInterval: number;
  currentTime: number;
}

export interface ISchedulingStrategy {
  readonly name: AlgorithmType;
  readonly label: string;
  selectNext(ctx: SchedulingContext): SchedulingDecision;
}
