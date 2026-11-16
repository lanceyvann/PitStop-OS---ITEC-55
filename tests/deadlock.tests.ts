import { describe, it, expect } from 'vitest';
import { Kernel } from '../kernel/kernel';
import { createDeadlockScenario } from '../config/workloads';

describe('Deadlock Detection and Recovery Subsystem', () => {
  it('detects circular wait deadlock and identifies participating cycle PIDs', () => {
    const kernel = new Kernel(123);
    const { orders, locksSetup } = createDeadlockScenario();

    orders.forEach((o) => {
      kernel.processManager.registerProcess(o);
    });

    locksSetup.forEach((ls) => {
      const waiter = orders.find((o) => o.pid !== ls.heldByPid)?.pid;
      kernel.lockManager.setLockHolder(ls.lockId, ls.heldByPid, waiter ? [waiter] : []);
    });

    const report = kernel.checkDeadlocks();
    expect(report.hasDeadlock).toBe(true);
    expect(report.cyclePids).toContain(101);
    expect(report.cyclePids).toContain(102);
    expect(report.edges.length).toBe(2);
  });

  it('recovers from deadlock when victim process is aborted', () => {
    const kernel = new Kernel(123);
    const { orders, locksSetup } = createDeadlockScenario();

    orders.forEach((o) => {
      kernel.processManager.registerProcess(o);
    });

    locksSetup.forEach((ls) => {
      const waiter = orders.find((o) => o.pid !== ls.heldByPid)?.pid;
      kernel.lockManager.setLockHolder(ls.lockId, ls.heldByPid, waiter ? [waiter] : []);
    });

    const report1 = kernel.checkDeadlocks();
    expect(report1.hasDeadlock).toBe(true);
    const victim = report1.suggestedVictimPid || 101;

    kernel.abortVictimProcess(victim);

    const report2 = kernel.checkDeadlocks();
    expect(report2.hasDeadlock).toBe(false);
  });

  it('recovers from deadlock when contested lock is force-released', () => {
    const kernel = new Kernel(123);
    const { orders, locksSetup } = createDeadlockScenario();

    orders.forEach((o) => {
      kernel.processManager.registerProcess(o);
    });

    locksSetup.forEach((ls) => {
      const waiter = orders.find((o) => o.pid !== ls.heldByPid)?.pid;
      kernel.lockManager.setLockHolder(ls.lockId, ls.heldByPid, waiter ? [waiter] : []);
    });

    expect(kernel.checkDeadlocks().hasDeadlock).toBe(true);

    kernel.forceReleaseLock('lock_tire_changer');

    expect(kernel.checkDeadlocks().hasDeadlock).toBe(false);
  });
});
