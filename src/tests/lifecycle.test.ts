import { describe, it, expect } from 'vitest';
import { ProcessManager } from '../kernel/processManager';
import { PCB } from '../models/pcb';

function createDummyPcb(pid: number): PCB {
  return {
    pid,
    name: `Test P${pid}`,
    vehicleType: 'sedan',
    modelName: 'Sedan',
    tireSpec: '195/65 R15',
    tireCount: 4,
    state: 'NEW',
    priority: 5,
    basePriority: 5,
    agingBoost: 0,
    arrivalTime: 0,
    burstPlan: [],
    currentSegmentIndex: 0,
    totalCpuBurst: 4,
    totalIoBurst: 0,
    remainingCpuTime: 4,
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

describe('OS Process 5-State Lifecycle Rejection & Validation', () => {
  it('allows legal sequential progression NEW -> READY -> RUNNING -> WAITING -> READY -> RUNNING -> TERMINATED', () => {
    const pm = new ProcessManager();
    const pcb = createDummyPcb(1);
    pm.registerProcess(pcb);

    const r1 = pm.transitionState(1, 'READY');
    expect(r1.success).toBe(true);
    expect(pm.getPcb(1)?.state).toBe('READY');
    expect(pm.getReadyQueuePids()).toContain(1);

    const r2 = pm.transitionState(1, 'RUNNING');
    expect(r2.success).toBe(true);
    expect(pm.getPcb(1)?.state).toBe('RUNNING');
    expect(pm.getRunningPid()).toBe(1);

    const r3 = pm.transitionState(1, 'WAITING', 'I/O Request');
    expect(r3.success).toBe(true);
    expect(pm.getPcb(1)?.state).toBe('WAITING');
    expect(pm.getWaitingQueuePids()).toContain(1);

    const r4 = pm.transitionState(1, 'READY');
    expect(r4.success).toBe(true);
    expect(pm.getPcb(1)?.state).toBe('READY');

    const r5 = pm.transitionState(1, 'RUNNING');
    expect(r5.success).toBe(true);

    const r6 = pm.transitionState(1, 'TERMINATED');
    expect(r6.success).toBe(true);
    expect(pm.getPcb(1)?.state).toBe('TERMINATED');
    expect(pm.getTerminatedPids()).toContain(1);
  });

  it('rejects illegal transition NEW -> RUNNING directly', () => {
    const pm = new ProcessManager();
    const pcb = createDummyPcb(2);
    pm.registerProcess(pcb);

    const res = pm.transitionState(2, 'RUNNING');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Illegal state transition rejected: NEW -> RUNNING');
    expect(pm.getPcb(2)?.state).toBe('NEW');
  });

  it('rejects illegal transition WAITING -> RUNNING directly (must go to READY first)', () => {
    const pm = new ProcessManager();
    const pcb = createDummyPcb(3);
    pm.registerProcess(pcb);
    pm.transitionState(3, 'READY');
    pm.transitionState(3, 'RUNNING');
    pm.transitionState(3, 'WAITING');

    const res = pm.transitionState(3, 'RUNNING');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Illegal state transition rejected: WAITING -> RUNNING');
  });

  it('rejects any transition out of TERMINATED sink state', () => {
    const pm = new ProcessManager();
    const pcb = createDummyPcb(4);
    pm.registerProcess(pcb);
    pm.transitionState(4, 'READY');
    pm.transitionState(4, 'TERMINATED');

    const res1 = pm.transitionState(4, 'READY');
    expect(res1.success).toBe(false);

    const res2 = pm.transitionState(4, 'RUNNING');
    expect(res2.success).toBe(false);
  });
});
