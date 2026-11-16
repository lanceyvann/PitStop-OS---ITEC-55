/**
 * @file scheduler.ts
 * @description CPU Scheduler Coordinator managing strategy instances, aging progression, and quantum tracking.
 */

import { AlgorithmType, ISchedulingStrategy, SchedulingContext, SchedulingDecision } from './types';
import { FcfsStrategy } from './fcfs';
import { SjfStrategy } from './sjf';
import { RoundRobinStrategy } from './roundRobin';
import { PriorityStrategy } from './priority';

export class Scheduler {
  private strategies: Map<AlgorithmType, ISchedulingStrategy>;
  private currentAlgorithm: AlgorithmType = 'FCFS';
  public quantum: number = 3;
  public agingEnabled: boolean = true;
  public agingInterval: number = 5; // Every 5 ticks in ready queue, priority increments

  constructor(defaultAlgo: AlgorithmType = 'FCFS', quantum: number = 3) {
    this.strategies = new Map();
    this.strategies.set('FCFS', new FcfsStrategy());
    this.strategies.set('SJF', new SjfStrategy());
    this.strategies.set('RR', new RoundRobinStrategy());
    this.strategies.set('PRIORITY', new PriorityStrategy());

    this.currentAlgorithm = defaultAlgo;
    this.quantum = quantum;
  }

  public setAlgorithm(algo: AlgorithmType): void {
    if (this.strategies.has(algo)) {
      this.currentAlgorithm = algo;
    }
  }

  public getAlgorithm(): AlgorithmType {
    return this.currentAlgorithm;
  }

  public getStrategy(algo: AlgorithmType = this.currentAlgorithm): ISchedulingStrategy {
    return this.strategies.get(algo)!;
  }

  public schedule(ctx: Omit<SchedulingContext, 'quantum' | 'agingEnabled' | 'agingInterval'>): SchedulingDecision {
    const fullCtx: SchedulingContext = {
      ...ctx,
      quantum: this.quantum,
      agingEnabled: this.agingEnabled,
      agingInterval: this.agingInterval,
    };
    const strategy = this.getStrategy();
    return strategy.selectNext(fullCtx);
  }
}
