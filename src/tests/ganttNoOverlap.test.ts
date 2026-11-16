import { describe, it, expect } from 'vitest';
import { Kernel } from '../kernel/kernel';
import { createBenchmarkWorkload } from '../config/workloads';
import { GanttBlock } from '../models/snapshot';

describe('Gantt Chart Non-Overlap Invariant', () => {
  it('ensures no two bars overlap in the CPU row and no overlaps within any process row', () => {
    const kernel = new Kernel(888);
    kernel.scheduler.setAlgorithm('RR');
    kernel.scheduler.quantum = 2;

    const orders = createBenchmarkWorkload('balanced', 888);
    orders.slice(0, 10).forEach((o) => kernel.submitOrder(o));

    for (let i = 0; i < 50; i++) {
      kernel.step();
    }

    const blocks = kernel.ganttBlocks;
    expect(blocks.length).toBeGreaterThan(0);

    const cpuBlocks = blocks
      .filter((b) => b.pid === 'CPU_IDLE' || b.state === 'RUNNING')
      .sort((a, b) => a.start - b.start);

    for (let i = 0; i < cpuBlocks.length - 1; i++) {
      const b1 = cpuBlocks[i];
      const b2 = cpuBlocks[i + 1];
      const b1End = b1.start + b1.duration;

      expect(b1End).toBeLessThanOrEqual(b2.start);
    }

    const pcbs = kernel.processManager.getAllPcbs();
    for (const pidStr of Object.keys(pcbs)) {
      const pid = Number(pidStr);
      const processBlocks = blocks
        .filter((b) => b.pid === pid)
        .sort((a, b) => a.start - b.start);

      for (let i = 0; i < processBlocks.length - 1; i++) {
        const b1 = processBlocks[i];
        const b2 = processBlocks[i + 1];
        const b1End = b1.start + b1.duration;

        expect(b1End).toBeLessThanOrEqual(b2.start);
      }
    }
  });
});
