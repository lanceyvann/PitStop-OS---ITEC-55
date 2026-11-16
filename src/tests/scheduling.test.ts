import { describe, it, expect } from 'vitest';
import { Kernel } from '../kernel/kernel';
import { PCB } from '../models/pcb';

function createPureCpuPcb(pid: number, arrivalTime: number, burst: number, priority: number): PCB {
  return {
    pid,
    name: `Test P${pid}`,
    vehicleType: 'sedan',
    modelName: `Car #${pid}`,
    tireSpec: '195/65 R15',
    tireCount: 4,
    state: 'NEW',
    priority,
    basePriority: priority,
    agingBoost: 0,
    arrivalTime,
    burstPlan: [{ id: 'b1', type: 'CPU', duration: burst, remaining: burst, label: 'CPU Fit' }],
    currentSegmentIndex: 0,
    totalCpuBurst: burst,
    totalIoBurst: 0,
    remainingCpuTime: burst,
    registers: { PC: 0, SP: 0, AX: 0, BX: 0, CX: 0, DX: 0 },
    parentPid: null,
    childrenPids: [],
    threads: [],
    firstCpuTime: null,
    completionTime: null,
    waitingTime: 0,
    turnaroundTime: 0,
    responseTime: 0,
    heldLocks: [],
    waitingForLock: null,
    waitingForStock: null,
    color: '#CC5500',
  };
}

describe('CPU Scheduling Algorithms - Hand-Computed 5-Process Scenarios', () => {
  it('FCFS matches hand-computed metrics for 5 processes', () => {
    const kernel = new Kernel(10);
    kernel.scheduler.setAlgorithm('FCFS');

    const p1 = createPureCpuPcb(1, 0, 3, 2);
    const p2 = createPureCpuPcb(2, 0, 1, 5);
    const p3 = createPureCpuPcb(3, 0, 4, 1);
    const p4 = createPureCpuPcb(4, 0, 2, 4);
    const p5 = createPureCpuPcb(5, 0, 5, 3);

    [p1, p2, p3, p4, p5].forEach((p) => kernel.submitOrder(p));

    while (kernel.clock < 15) {
      kernel.step();
    }

    const metrics = kernel.calculateMetrics();
    expect(metrics.completedCount).toBe(5);
    expect(metrics.avgTurnaroundTime).toBe(8.0);
    expect(metrics.avgWaitingTime).toBe(5.0);
    expect(metrics.avgResponseTime).toBe(5.0);
  });

  it('SJF matches hand-computed metrics for 5 processes', () => {
    const kernel = new Kernel(10);
    kernel.scheduler.setAlgorithm('SJF');

    const p1 = createPureCpuPcb(1, 0, 3, 2);
    const p2 = createPureCpuPcb(2, 0, 1, 5);
    const p3 = createPureCpuPcb(3, 0, 4, 1);
    const p4 = createPureCpuPcb(4, 0, 2, 4);
    const p5 = createPureCpuPcb(5, 0, 5, 3);

    [p1, p2, p3, p4, p5].forEach((p) => kernel.submitOrder(p));

    while (kernel.clock < 15) {
      kernel.step();
    }

    const metrics = kernel.calculateMetrics();
    expect(metrics.completedCount).toBe(5);
    expect(metrics.avgTurnaroundTime).toBe(7.0);
    expect(metrics.avgWaitingTime).toBe(4.0);
  });

  it('Priority matches hand-computed metrics for 5 processes', () => {
    const kernel = new Kernel(10);
    kernel.scheduler.setAlgorithm('PRIORITY');
    kernel.scheduler.agingEnabled = false; 

    const p1 = createPureCpuPcb(1, 0, 3, 2);
    const p2 = createPureCpuPcb(2, 0, 1, 5);
    const p3 = createPureCpuPcb(3, 0, 4, 1);
    const p4 = createPureCpuPcb(4, 0, 2, 4);
    const p5 = createPureCpuPcb(5, 0, 5, 3);

    [p1, p2, p3, p4, p5].forEach((p) => kernel.submitOrder(p));

    while (kernel.clock < 15) {
      kernel.step();
    }

    const metrics = kernel.calculateMetrics();
    expect(metrics.completedCount).toBe(5);
    expect(metrics.avgTurnaroundTime).toBe(7.6);
    expect(metrics.avgWaitingTime).toBe(4.6);
  });
});
