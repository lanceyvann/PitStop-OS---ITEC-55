/**
 * @file sjf.ts
 * @description Shortest Job First (SJF) Scheduling Strategy.
 * Selects the waiting process with the smallest remaining CPU burst time.
 * Tie-break: earlier arrival time, then lower PID.
 */

import { ISchedulingStrategy, SchedulingContext, SchedulingDecision } from './types';
import { PCB } from '../models/pcb';

export class SjfStrategy implements ISchedulingStrategy {
  public readonly name = 'SJF';
  public readonly label = 'Shortest Job First (SJF)';

  public selectNext(ctx: SchedulingContext): SchedulingDecision {
    // Non-preemptive: keep executing current process until it completes or blocks
    if (ctx.currentRunning && ctx.currentRunning.state === 'RUNNING') {
      return {
        nextPid: ctx.currentRunning.pid,
        shouldPreempt: false,
        reason: `Order #${ctx.currentRunning.pid} continues executing until its burst segment yields or finishes.`,
      };
    }

    if (ctx.readyQueue.length === 0) {
      return {
        nextPid: null,
        shouldPreempt: false,
        reason: 'Ready queue is empty. Fitting Bay is idle.',
      };
    }

    // Sort by remaining CPU time ASC, tie-break: arrivalTime ASC, then pid ASC
    const sorted = [...ctx.readyQueue].sort((a: PCB, b: PCB) => {
      if (a.remainingCpuTime !== b.remainingCpuTime) {
        return a.remainingCpuTime - b.remainingCpuTime;
      }
      if (a.arrivalTime !== b.arrivalTime) {
        return a.arrivalTime - b.arrivalTime;
      }
      return a.pid - b.pid;
    });

    const chosen = sorted[0];
    return {
      nextPid: chosen.pid,
      shouldPreempt: false,
      reason: `Customer #${chosen.pid} (${chosen.modelName}) was chosen because it has the shortest remaining CPU burst (${chosen.remainingCpuTime} ticks) among ${ctx.readyQueue.length} waiting orders.`,
    };
  }
}
