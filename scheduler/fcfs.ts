import { ISchedulingStrategy, SchedulingContext, SchedulingDecision } from './types';
import { PCB } from '../models/pcb';

export class FcfsStrategy implements ISchedulingStrategy {
  public readonly name = 'FCFS';
  public readonly label = 'First-Come, First-Served (FCFS)';

  public selectNext(ctx: SchedulingContext): SchedulingDecision {
    // Non-preemptive: if an active process is still running, it retains CPU
    if (ctx.currentRunning && ctx.currentRunning.state === 'RUNNING') {
      return {
        nextPid: ctx.currentRunning.pid,
        shouldPreempt: false,
        reason: `Order #${ctx.currentRunning.pid} continues running (FCFS is non-preemptive).`,
      };
    }

    if (ctx.readyQueue.length === 0) {
      return {
        nextPid: null,
        shouldPreempt: false,
        reason: 'Waiting Lane (Ready queue) is empty. CPU is idle.',
      };
    }

    const sorted = [...ctx.readyQueue].sort((a: PCB, b: PCB) => {
      if (a.arrivalTime !== b.arrivalTime) {
        return a.arrivalTime - b.arrivalTime;
      }
      return a.pid - b.pid;
    });

    const chosen = sorted[0];
    return {
      nextPid: chosen.pid,
      shouldPreempt: false,
      reason: `Customer #${chosen.pid} (${chosen.modelName}) was chosen because it arrived earliest at Tick ${chosen.arrivalTime} among ${ctx.readyQueue.length} waiting orders.`,
    };
  }
}
