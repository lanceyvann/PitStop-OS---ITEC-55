/**
 * @file stress.test.ts
 * @description 50+ Process Scale & Stress Unit Test.
 * Asserts that the mini-OS manages 50+ concurrent/sequential customer orders without
 * state corruption, queue leakage, or orphaned equipment lock holders.
 */

import { describe, it, expect } from 'vitest';
import { Kernel } from '../kernel/kernel';
import { PCB } from '../models/pcb';

function createFastStressPcb(pid: number, arrival: number): PCB {
  return {
    pid,
    name: `Stress Order #${pid}`,
    vehicleType: 'sedan',
    modelName: `Car #${pid}`,
    tireSpec: '195/65 R15',
    tireCount: 4,
    state: 'NEW',
    priority: (pid % 10) + 1,
    basePriority: (pid % 10) + 1,
    agingBoost: 0,
    arrivalTime: arrival,
    burstPlan: [{ id: 'b1', type: 'CPU', duration: 2, remaining: 2, label: 'Fit' }],
    currentSegmentIndex: 0,
    totalCpuBurst: 2,
    totalIoBurst: 0,
    remainingCpuTime: 2,
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

describe('50+ Processes Scale & Stress Testing', () => {
  it('handles 55 processes with zero queue leakage, memory corruption, or orphaned locks', () => {
    const kernel = new Kernel(2026);
    kernel.scheduler.setAlgorithm('RR');
    kernel.scheduler.quantum = 3;

    // Generate 55 processes across staggered arrival times
    const totalOrders = 55;
    for (let i = 1; i <= totalOrders; i++) {
      const arrival = Math.floor((i - 1) / 3);
      kernel.submitOrder(createFastStressPcb(i, arrival));
    }

    const registered = Object.keys(kernel.processManager.getAllPcbs()).length;
    expect(registered).toBeGreaterThanOrEqual(totalOrders);

    // Run simulation loop until all processes complete
    let safetyLimit = 500;
    while (safetyLimit > 0) {
      const pcbs = Object.values(kernel.processManager.getAllPcbs());
      const allTerminated = pcbs.every((p) => p.state === 'TERMINATED');
      if (allTerminated) break;

      kernel.step();
      safetyLimit -= 1;
    }

    expect(safetyLimit).toBeGreaterThan(0);

    // Verify all processes terminated cleanly
    const finalPcbs = Object.values(kernel.processManager.getAllPcbs());
    expect(finalPcbs.length).toBe(totalOrders);
    for (const p of finalPcbs) {
      expect(p.state).toBe('TERMINATED');
      expect(p.completionTime).toBeGreaterThanOrEqual(p.arrivalTime);
      expect(p.turnaroundTime).toBeGreaterThanOrEqual(p.totalCpuBurst);
    }

    // Assert zero queue leakage
    expect(kernel.processManager.getReadyQueuePids().length).toBe(0);
    expect(kernel.processManager.getWaitingQueuePids().length).toBe(0);
    expect(kernel.processManager.getRunningPid()).toBeNull();

    // Assert all mutex locks are released
    const locks = kernel.lockManager.getLocks();
    for (const lock of Object.values(locks)) {
      expect(lock.heldByPid).toBeNull();
      expect(lock.waitingPids.length).toBe(0);
    }
  });
});
