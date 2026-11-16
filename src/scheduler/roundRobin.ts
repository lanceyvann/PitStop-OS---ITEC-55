/**
 * @file roundRobin.ts
 * @description Round Robin (RR) Preemptive Scheduling Strategy.
 * Enforces a fixed time slice (quantum). When quantum expires, preemption occurs
 * and the next ready process is dispatched in FIFO order.
 */

import { ISchedulingStrategy, SchedulingContext, SchedulingDecision } from './types';

export class RoundRobinStrategy implements ISchedulingStrategy {
  public readonly name = 'RR';
  public readonly label = 'Round Robin (RR)';

  public selectNext(ctx: SchedulingContext): SchedulingDecision {
    // If a process is currently running:
    if (ctx.currentRunning && ctx.currentRunning.state === 'RUNNING') {
      // Check if its quantum has expired
      if (ctx.currentQuantumUsed >= ctx.quantum) {
        // If there are other processes waiting in ready queue, preempt!
        if (ctx.readyQueue.length > 0) {
          const nextProcess = ctx.readyQueue[0];
          return {
            nextPid: nextProcess.pid,
            shouldPreempt: true,
            reason: `Order #${ctx.currentRunning.pid}'s quantum (${ctx.quantum} ticks) expired. Preempting to dispatch Order #${nextProcess.pid}.`,
          };
        } else {
          // No other process waiting, renew quantum
          return {
            nextPid: ctx.currentRunning.pid,
            shouldPreempt: false,
            reason: `Order #${ctx.currentRunning.pid} continues running (quantum renewed as no other orders are waiting).`,
          };
        }
      }

      // Quantum not yet exhausted
      return {
        nextPid: ctx.currentRunning.pid,
        shouldPreempt: false,
        reason: `Order #${ctx.currentRunning.pid} continues executing (quantum progress: ${ctx.currentQuantumUsed}/${ctx.quantum} ticks).`,
      };
    }

    // CPU is idle, select head of FIFO ready queue
    if (ctx.readyQueue.length === 0) {
      return {
        nextPid: null,
        shouldPreempt: false,
        reason: 'Ready queue is empty. Fitting Bay is idle.',
      };
    }

    const chosen = ctx.readyQueue[0];
    return {
      nextPid: chosen.pid,
      shouldPreempt: false,
      reason: `Customer #${chosen.pid} (${chosen.modelName}) was dispatched for a ${ctx.quantum}-tick time quantum.`,
    };
  }
}
