import { ISchedulingStrategy, SchedulingContext, SchedulingDecision } from './types';

export class RoundRobinStrategy implements ISchedulingStrategy {
  public readonly name = 'RR';
  public readonly label = 'Round Robin (RR)';

  public selectNext(ctx: SchedulingContext): SchedulingDecision {
    if (ctx.currentRunning && ctx.currentRunning.state === 'RUNNING') {
      if (ctx.currentQuantumUsed >= ctx.quantum) {
        if (ctx.readyQueue.length > 0) {
          const nextProcess = ctx.readyQueue[0];
          return {
            nextPid: nextProcess.pid,
            shouldPreempt: true,
            reason: `Order #${ctx.currentRunning.pid}'s quantum (${ctx.quantum} ticks) expired. Preempting to dispatch Order #${nextProcess.pid}.`,
          };
        } else {
          return {
            nextPid: ctx.currentRunning.pid,
            shouldPreempt: false,
            reason: `Order #${ctx.currentRunning.pid} continues running (quantum renewed as no other orders are waiting).`,
          };
        }
      }

      return {
        nextPid: ctx.currentRunning.pid,
        shouldPreempt: false,
        reason: `Order #${ctx.currentRunning.pid} continues executing (quantum progress: ${ctx.currentQuantumUsed}/${ctx.quantum} ticks).`,
      };
    }
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
