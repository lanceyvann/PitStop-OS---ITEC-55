import { describe, it, expect } from 'vitest';
import { Kernel } from '../kernel/kernel';
import { PCB } from '../models/pcb';

function createStockWaitingPcb(pid: number, tireId: string, quantity: number): PCB {
  return {
    pid,
    name: `Stock Waiter #${pid}`,
    vehicleType: 'sedan',
    modelName: 'Sedan',
    tireSpec: '195/65 R15',
    tireCount: quantity,
    state: 'WAITING',
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
    waitingForStock: { tireId, quantity },
    color: '#CC5500',
  };
}

describe('Shared Tire Stockroom Inventory Management', () => {
  it('blocks order when stock is insufficient and unblocks upon supplier delivery', () => {
    const kernel = new Kernel(555);
    const tireId = 'tire_185_60_r15';

    kernel.inventoryManager.setStock(tireId, 0);

    const order = createStockWaitingPcb(10, tireId, 4);
    kernel.processManager.registerProcess(order);
    kernel.processManager.transitionState(10, 'WAITING', 'Waiting for Tire Restock');

    expect(kernel.processManager.getWaitingQueuePids()).toContain(10);
    expect(kernel.processManager.getReadyQueuePids()).not.toContain(10);

    kernel.step();
    expect(kernel.processManager.getPcb(10)?.state).toBe('WAITING');

    kernel.restockTires(tireId, 8);

    expect(kernel.processManager.getPcb(10)?.state).toBe('READY');
    expect(kernel.processManager.getReadyQueuePids()).toContain(10);
    expect(kernel.processManager.getPcb(10)?.waitingForStock).toBeNull();
  });
});
