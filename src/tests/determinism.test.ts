import { describe, it, expect } from 'vitest';
import { Kernel } from '../kernel/kernel';
import { createBenchmarkWorkload } from '../config/workloads';

describe('Simulation Determinism & Time Machine Rewind', () => {
  it('produces 100% identical metrics and logs for identical seeds and workloads', () => {
    const seed = 999;
    const kernelA = new Kernel(seed);
    const kernelB = new Kernel(seed);

    const workloadA = createBenchmarkWorkload('balanced', seed);
    const workloadB = createBenchmarkWorkload('balanced', seed);

    workloadA.forEach((p) => kernelA.submitOrder(p));
    workloadB.forEach((p) => kernelB.submitOrder(p));

    for (let i = 0; i < 20; i++) {
      kernelA.step();
      kernelB.step();
    }

    const metricsA = kernelA.calculateMetrics();
    const metricsB = kernelB.calculateMetrics();

    expect(metricsA).toEqual(metricsB);
    expect(kernelA.logger.getEntries().length).toBe(kernelB.logger.getEntries().length);

    const logsA = kernelA.logger.getEntries();
    const logsB = kernelB.logger.getEntries();
    for (let i = 0; i < logsA.length; i++) {
      expect(logsA[i].message).toBe(logsB[i].message);
      expect(logsA[i].tick).toBe(logsB[i].tick);
    }
  });

  it('Time Machine rewind restores exact snapshot state at tick T', () => {
    const kernel = new Kernel(777);
    const workload = createBenchmarkWorkload('cpu-heavy', 777);
    workload.slice(0, 5).forEach((p) => kernel.submitOrder(p));

    for (let i = 0; i < 15; i++) {
      kernel.step();
    }

    const snapAt8 = kernel.snapshots[8];
    expect(snapAt8).toBeDefined();

    const success = kernel.rewindToTick(8);
    expect(success).toBe(true);
    expect(kernel.clock).toBe(8);
    expect(kernel.processManager.getRunningPid()).toBe(snapAt8.runningPid);
    expect(kernel.processManager.getReadyQueuePids()).toEqual(snapAt8.readyQueuePids);
  });

  it('Time Machine rewind preserves scheduled future arrivals upon replaying forward', () => {
    const kernel = new Kernel(4321);
    const workload = createBenchmarkWorkload('balanced', 4321);
    workload.slice(0, 5).forEach((p, idx) => {
      p.arrivalTime = idx * 3; 
      kernel.submitOrder(p);
    });

    for (let i = 0; i < 15; i++) {
      kernel.step();
    }
    const stateAt15 = JSON.parse(JSON.stringify(kernel.calculateMetrics()));

    kernel.rewindToTick(5);
    expect(kernel.clock).toBe(5);

    for (let i = 5; i < 15; i++) {
      kernel.step();
    }

    const stateReplayed = kernel.calculateMetrics();
    expect(stateReplayed).toEqual(stateAt15);
  });
});
