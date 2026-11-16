import { KernelLog } from './kernelLog';
import { ProcessManager } from './processManager';
import { LockManager } from './lockManager';
import { ThreadManager } from './threadManager';
import { InventoryManager } from './inventoryManager';
import { LockId } from '../models/lock';
import { PCB } from '../models/pcb';

export type SyscallName =
  | 'create_process'
  | 'terminate_process'
  | 'create_thread'
  | 'join_thread'
  | 'io_request'
  | 'yield'
  | 'acquire_lock'
  | 'release_lock';

export interface SyscallContext {
  tick: number;
  setMode: (mode: 'USER' | 'KERNEL') => void;
  logger: KernelLog;
  processManager: ProcessManager;
  lockManager: LockManager;
  threadManager: ThreadManager;
  inventoryManager: InventoryManager;
}

export class Syscalls {
  public static execute<T>(
    name: SyscallName,
    pid: number | undefined,
    ctx: SyscallContext,
    action: () => T
  ): T {
    ctx.setMode('KERNEL');
    ctx.logger.debug('SYSCALL', `SYS_ENTER [${name}] invoked by ${pid !== undefined ? `PID #${pid}` : 'SYSTEM'}`, ctx.tick, pid, name);

    try {
      const result = action();
      return result;
    } finally {
      ctx.setMode('USER');
      ctx.logger.debug('SYSCALL', `SYS_EXIT [${name}] completed. Restored USER MODE.`, ctx.tick, pid, name);
    }
  }
  public static createProcess(pcb: PCB, ctx: SyscallContext): boolean {
    return this.execute('create_process', pcb.pid, ctx, () => {
      ctx.processManager.registerProcess(pcb);
      const res = ctx.processManager.transitionState(pcb.pid, 'READY');
      if (res.success) {
        ctx.logger.info(
          'PROCESS',
          `Created Order #${pcb.pid} (${pcb.modelName}). Admitted to Waiting Lane (Ready Queue). Priority: ${pcb.priority}`,
          ctx.tick,
          pcb.pid,
          'create_process'
        );
        return true;
      } else {
        ctx.logger.error('PROCESS', `Failed to admit PID #${pcb.pid}: ${res.error}`, ctx.tick, pcb.pid, 'create_process');
        return false;
      }
    });
  }

  public static terminateProcess(pid: number, ctx: SyscallContext): boolean {
    return this.execute('terminate_process', pid, ctx, () => {
      const pcb = ctx.processManager.getPcb(pid);
      if (!pcb) return false;
      const unblocked = ctx.lockManager.releaseAllForPid(pid, ctx.tick);
      unblocked.forEach((item) => {
        const waiterPcb = ctx.processManager.getPcb(item.unblockedPid);
        if (waiterPcb && waiterPcb.state === 'WAITING' && waiterPcb.waitingForLock === item.lockId) {
          waiterPcb.waitingForLock = null;
          ctx.processManager.transitionState(item.unblockedPid, 'READY');
          ctx.logger.info(
            'LOCK',
            `Lock [${item.lockId}] released by PID #${pid} and granted to waiting Order #${item.unblockedPid} (Woke up to READY).`,
            ctx.tick,
            item.unblockedPid
          );
        }
      });

      if (pcb.waitingForStock) {
        ctx.inventoryManager.releaseReservation(pcb.waitingForStock.tireId, pcb.waitingForStock.quantity);
      }

      ctx.threadManager.terminateThreadsForPid(pid);

      const res = ctx.processManager.terminateProcess(pid, ctx.tick);
      if (res.success) {
        ctx.logger.info(
          'PROCESS',
          `Order #${pid} completed & departed! Turnaround: ${pcb.turnaroundTime} ticks, Waiting: ${pcb.waitingTime} ticks, Response: ${pcb.responseTime} ticks.`,
          ctx.tick,
          pid,
          'terminate_process'
        );
      }
      return res.success;
    });
  }

  public static yield(pid: number, ctx: SyscallContext, reason: string = 'Voluntary yield'): boolean {
    return this.execute('yield', pid, ctx, () => {
      const res = ctx.processManager.transitionState(pid, 'READY', reason);
      if (res.success) {
        ctx.logger.info('SCHEDULER', `Order #${pid} yielded Fitting Bay lift: ${reason}`, ctx.tick, pid, 'yield');
      }
      return res.success;
    });
  }

  public static ioRequest(pid: number, duration: number, label: string, ctx: SyscallContext): boolean {
    return this.execute('io_request', pid, ctx, () => {
      const res = ctx.processManager.transitionState(pid, 'WAITING', label);
      if (res.success) {
        ctx.logger.info('PROCESS', `Order #${pid} blocked for I/O (${duration} ticks): "${label}"`, ctx.tick, pid, 'io_request');
      }
      return res.success;
    });
  }

  public static acquireLock(pid: number, lockId: LockId, ctx: SyscallContext): boolean {
    return this.execute('acquire_lock', pid, ctx, () => {
      const granted = ctx.lockManager.acquire(pid, lockId, ctx.tick);
      const pcb = ctx.processManager.getPcb(pid);

      if (granted) {
        if (pcb && !pcb.heldLocks.includes(lockId)) {
          pcb.heldLocks.push(lockId);
        }
        ctx.logger.info('LOCK', `Order #${pid} successfully acquired mutex [${lockId}].`, ctx.tick, pid, 'acquire_lock');
        return true;
      } else {
        if (pcb) {
          pcb.waitingForLock = lockId;
        }
        ctx.processManager.transitionState(pid, 'WAITING', `Waiting for lock: ${lockId}`);
        ctx.logger.warn('LOCK', `Order #${pid} BLOCKED waiting for mutex [${lockId}] (held by another order).`, ctx.tick, pid, 'acquire_lock');
        return false;
      }
    });
  }

  public static releaseLock(pid: number, lockId: LockId, ctx: SyscallContext): boolean {
    return this.execute('release_lock', pid, ctx, () => {
      const { success, nextPid } = ctx.lockManager.release(pid, lockId, ctx.tick);
      const pcb = ctx.processManager.getPcb(pid);
      if (pcb) {
        pcb.heldLocks = pcb.heldLocks.filter((l) => l !== lockId);
      }

      if (success) {
        ctx.logger.info('LOCK', `Order #${pid} released mutex [${lockId}].`, ctx.tick, pid, 'release_lock');
        if (nextPid !== null) {
          const nextPcb = ctx.processManager.getPcb(nextPid);
          if (nextPcb) {
            nextPcb.waitingForLock = null;
            if (!nextPcb.heldLocks.includes(lockId)) {
              nextPcb.heldLocks.push(lockId);
            }
            ctx.processManager.transitionState(nextPid, 'READY');
            ctx.logger.info('LOCK', `Mutex [${lockId}] granted to Order #${nextPid} (unblocked to READY queue).`, ctx.tick, nextPid);
          }
        }
        return true;
      }
      return false;
    });
  }
}
