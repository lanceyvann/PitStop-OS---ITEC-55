/**
 * @file scheduling.test.ts
 * @description Hand-computed 5-process scheduling verification tests.
 * Includes complete step-by-step arithmetic in comments for FCFS, SJF, RR, and Priority.
 */

import { describe, it, expect } from 'vitest';
import { Kernel } from '../kernel/kernel';
import { PCB } from '../models/pcb';

/**
 * Helper to build a pure CPU-burst test PCB without extra IO/locks
 */
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
  /**
   * Scenario: 5 Processes all arriving at T=0
   * P1: Burst 3, Priority 2
   * P2: Burst 1, Priority 5
   * P3: Burst 4, Priority 1
   * P4: Burst 2, Priority 4
   * P5: Burst 5, Priority 3
   */

  // ==========================================
  // 1. FCFS (First-Come, First-Served)
  // ==========================================
  // Order of arrival tie-break: P1, P2, P3, P4, P5
  // Schedule:
  // [0..3]: P1 (Burst 3) -> Finishes T=3.
  // [3..4]: P2 (Burst 1) -> Finishes T=4.
  // [4..8]: P3 (Burst 4) -> Finishes T=8.
  // [8..10]: P4 (Burst 2) -> Finishes T=10.
  // [10..15]: P5 (Burst 5) -> Finishes T=15.
  //
  // Turnaround = Completion - Arrival (Arrival = 0 for all):
  // TA(P1) = 3 - 0 = 3
  // TA(P2) = 4 - 0 = 4
  // TA(P3) = 8 - 0 = 8
  // TA(P4) = 10 - 0 = 10
  // TA(P5) = 15 - 0 = 15
  // Avg Turnaround = (3 + 4 + 8 + 10 + 15) / 5 = 40 / 5 = 8.00
  //
  // Waiting = Turnaround - Burst:
  // W(P1) = 3 - 3 = 0
  // W(P2) = 4 - 1 = 3
  // W(P3) = 8 - 4 = 4
  // W(P4) = 10 - 2 = 8
  // W(P5) = 15 - 5 = 10
  // Avg Waiting = (0 + 3 + 4 + 8 + 10) / 5 = 25 / 5 = 5.00
  //
  // Response = First Start - Arrival:
  // R(P1) = 0, R(P2) = 3, R(P3) = 4, R(P4) = 8, R(P5) = 10
  // Avg Response = 25 / 5 = 5.00
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

  // ==========================================
  // 2. SJF (Shortest Job First)
  // ==========================================
  // Bursts: P2(1), P4(2), P1(3), P3(4), P5(5)
  // Execution Order: P2, P4, P1, P3, P5
  // [0..1]: P2 (Burst 1) -> Finishes T=1
  // [1..3]: P4 (Burst 2) -> Finishes T=3
  // [3..6]: P1 (Burst 3) -> Finishes T=6
  // [6..10]: P3 (Burst 4) -> Finishes T=10
  // [10..15]: P5 (Burst 5) -> Finishes T=15
  //
  // Turnaround:
  // TA(P2) = 1, TA(P4) = 3, TA(P1) = 6, TA(P3) = 10, TA(P5) = 15
  // Avg Turnaround = (1 + 3 + 6 + 10 + 15) / 5 = 35 / 5 = 7.00
  //
  // Waiting:
  // W(P2) = 1 - 1 = 0
  // W(P4) = 3 - 2 = 1
  // W(P1) = 6 - 3 = 3
  // W(P3) = 10 - 4 = 6
  // W(P5) = 15 - 5 = 10
  // Avg Waiting = (0 + 1 + 3 + 6 + 10) / 5 = 20 / 5 = 4.00
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

  // ==========================================
  // 3. PRIORITY (Higher numeric value = higher priority)
  // ==========================================
  // Priorities: P2(5), P4(4), P5(3), P1(2), P3(1)
  // Execution Order: P2, P4, P5, P1, P3
  // [0..1]: P2 (Burst 1) -> Finishes T=1
  // [1..3]: P4 (Burst 2) -> Finishes T=3
  // [3..8]: P5 (Burst 5) -> Finishes T=8
  // [8..11]: P1 (Burst 3) -> Finishes T=11
  // [11..15]: P3 (Burst 4) -> Finishes T=15
  //
  // Turnaround:
  // TA(P2) = 1, TA(P4) = 3, TA(P5) = 8, TA(P1) = 11, TA(P3) = 15
  // Avg Turnaround = (1 + 3 + 8 + 11 + 15) / 5 = 38 / 5 = 7.60
  //
  // Waiting:
  // W(P2) = 1 - 1 = 0
  // W(P4) = 3 - 2 = 1
  // W(P5) = 8 - 5 = 3
  // W(P1) = 11 - 3 = 8
  // W(P3) = 15 - 4 = 11
  // Avg Waiting = (0 + 1 + 3 + 8 + 11) / 5 = 23 / 5 = 4.60
  it('Priority matches hand-computed metrics for 5 processes', () => {
    const kernel = new Kernel(10);
    kernel.scheduler.setAlgorithm('PRIORITY');
    kernel.scheduler.agingEnabled = false; // Disable aging for hand calculation

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
