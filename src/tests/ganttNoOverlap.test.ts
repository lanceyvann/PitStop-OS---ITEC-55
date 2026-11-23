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

  it('builds contiguous single-core CPU slices with explicit idle gaps and preemptive slices', async () => {
    const { buildCpuSlicesFromKernelBlocks, SAMPLE_CPU_SLICES } = await import('../ui/components/GanttChart');

    expect(SAMPLE_CPU_SLICES[0].isIdle).toBe(true);
    expect(SAMPLE_CPU_SLICES[0].startTime).toBe(0);
    expect(SAMPLE_CPU_SLICES[0].endTime).toBe(2);

    const p1Slices = SAMPLE_CPU_SLICES.filter((s) => s.processId === 'P1');
    expect(p1Slices.length).toBe(2);
    expect(p1Slices[0].endTime).toBeLessThan(p1Slices[1].startTime);

    for (let i = 0; i < SAMPLE_CPU_SLICES.length - 1; i++) {
      expect(SAMPLE_CPU_SLICES[i].endTime).toBe(SAMPLE_CPU_SLICES[i + 1].startTime);
    }

    const mockBlocks: GanttBlock[] = [
      { id: 'w1', pid: 1, start: 0, duration: 2, state: 'WAITING', label: 'IO wait' },
      { id: 'cs1', pid: 'CONTEXT_SWITCH', start: 2, duration: 1, state: 'SWITCH', label: 'CS' },
      { id: 'r1', pid: 1, start: 2, duration: 3, state: 'RUNNING', label: 'Mount' },
      { id: 'r2', pid: 2, start: 5, duration: 2, state: 'RUNNING', label: 'Balance' },
      { id: 'r3', pid: 1, start: 7, duration: 2, state: 'RUNNING', label: 'Finish' },
    ];

    const slices = buildCpuSlicesFromKernelBlocks(mockBlocks);
    expect(slices.map((s) => [s.processId, s.startTime, s.endTime, s.isIdle])).toEqual([
      ['IDLE', 0, 2, true],
      ['P1', 2, 5, false],
      ['P2', 5, 7, false],
      ['P1', 7, 9, false],
    ]);
  });
});
