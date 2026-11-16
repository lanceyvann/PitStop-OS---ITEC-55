import { ISchedulingStrategy, SchedulingContext, SchedulingDecision } from './types';
import { PCB } from '../models/pcb';

export class PriorityStrategy implements ISchedulingStrategy {
  public readonly name = 'PRIORITY';
  public readonly label = 'Priority Scheduling (with Aging)';

  public selectNext(ctx: SchedulingContext): SchedulingDecision {
    if (ctx.readyQueue.length === 0) {
      if (ctx.currentRunning && ctx.currentRunning.state === 'RUNNING') {
        return {
          nextPid: ctx.currentRunning.pid,
          shouldPreempt: false,
          reason: `Order #${ctx.currentRunning.pid} continues running (highest priority active).`,
        };
      }
      return {
        nextPid: null,
        shouldPreempt: false,
        reason: 'Ready queue is empty. Fitting Bay is idle.',
      };
    }

    const sorted = [...ctx.readyQueue].sort((a: PCB, b: PCB) => {
      const effA = a.priority + (ctx.agingEnabled ? a.agingBoost : 0);
      const effB = b.priority + (ctx.agingEnabled ? b.agingBoost : 0);

      if (effA !== effB) {
        return effB - effA; 
      }
      if (a.arrivalTime !== b.arrivalTime) {
        return a.arrivalTime - b.arrivalTime;
      }
      return a.pid - b.pid;
    });

    const highestReady = sorted[0];
    const highestReadyEff = highestReady.priority + (ctx.agingEnabled ? highestReady.agingBoost : 0);

    if (ctx.currentRunning && ctx.currentRunning.state === 'RUNNING') {
      const runningEff = ctx.currentRunning.priority + (ctx.agingEnabled ? ctx.currentRunning.agingBoost : 0);

      if (highestReadyEff > runningEff) {
        return {
          nextPid: highestReady.pid,
          shouldPreempt: true,
          reason: `Order #${highestReady.pid} (${highestReady.modelName}) has higher priority (${highestReadyEff} vs ${runningEff}). Preempting Order #${ctx.currentRunning.pid}.`,
        };
      }

      return {
        nextPid: ctx.currentRunning.pid,
        shouldPreempt: false,
        reason: `Order #${ctx.currentRunning.pid} continues running with priority ${runningEff}.`,
      };
    }
    return {
      nextPid: highestReady.pid,
      shouldPreempt: false,
      reason: `Customer #${highestReady.pid} (${highestReady.modelName}) was selected with highest priority (${highestReadyEff}${
        highestReady.agingBoost > 0 ? ` incl. +${highestReady.agingBoost} aging` : ''
      }) among ${ctx.readyQueue.length} waiting orders.`,
    };
  }
}
