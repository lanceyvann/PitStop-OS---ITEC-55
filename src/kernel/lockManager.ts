import { Lock, LockId } from '../models/lock';
import { DEFAULT_LOCKS } from '../config/defaults';

export class LockManager {
  private locks: Map<LockId, Lock>;

  constructor(initialLocks: Record<string, Lock> = DEFAULT_LOCKS) {
    this.locks = new Map();
    Object.values(initialLocks).forEach((l) => {
      this.locks.set(l.id, {
        ...l,
        heldByPid: l.heldByPid,
        waitingPids: [...l.waitingPids],
      });
    });
  }

  public getLocks(): Record<LockId, Lock> {
    const res: Record<string, Lock> = {};
    for (const [id, lock] of this.locks.entries()) {
      res[id] = {
        ...lock,
        waitingPids: [...lock.waitingPids],
      };
    }
    return res as Record<LockId, Lock>;
  }

  public getLock(id: LockId): Lock | undefined {
    return this.locks.get(id);
  }

  public setLockHolder(id: LockId, pid: number | null, waitingPids?: number[]): void {
    const lock = this.locks.get(id);
    if (lock) {
      lock.heldByPid = pid;
      if (waitingPids !== undefined) {
        lock.waitingPids = [...waitingPids];
      }
    }
  }

  public acquire(pid: number, id: LockId, tick: number): boolean {
    const lock = this.locks.get(id);
    if (!lock) return false;

    if (lock.heldByPid === pid) {
      return true;
    }
    if (lock.heldByPid === null) {
      lock.heldByPid = pid;
      lock.lastAcquiredAt = tick;
      lock.waitingPids = lock.waitingPids.filter((p) => p !== pid);
      return true;
    }

    if (!lock.waitingPids.includes(pid)) {
      lock.waitingPids.push(pid);
    }
    return false;
  }

  public release(pid: number, id: LockId, tick: number): { success: boolean; nextPid: number | null } {
    const lock = this.locks.get(id);
    if (!lock) return { success: false, nextPid: null };

    if (lock.heldByPid !== pid) {
      return { success: false, nextPid: null };
    }
    if (lock.waitingPids.length > 0) {
      const nextPid = lock.waitingPids.shift()!;
      lock.heldByPid = nextPid;
      lock.lastAcquiredAt = tick;
      return { success: true, nextPid };
    } else {
      lock.heldByPid = null;
      return { success: true, nextPid: null };
    }
  }

  public forceRelease(id: LockId, tick: number): { previousHolder: number | null; nextPid: number | null } {
    const lock = this.locks.get(id);
    if (!lock) return { previousHolder: null, nextPid: null };

    const previousHolder = lock.heldByPid;
    if (lock.waitingPids.length > 0) {
      const nextPid = lock.waitingPids.shift()!;
      lock.heldByPid = nextPid;
      lock.lastAcquiredAt = tick;
      return { previousHolder, nextPid };
    } else {
      lock.heldByPid = null;
      return { previousHolder, nextPid: null };
    }
  }

  public releaseAllForPid(pid: number, tick: number): Array<{ lockId: LockId; unblockedPid: number }> {
    const unblocked: Array<{ lockId: LockId; unblockedPid: number }> = [];

    for (const lock of this.locks.values()) {
      lock.waitingPids = lock.waitingPids.filter((p) => p !== pid);

      if (lock.heldByPid === pid) {
        if (lock.waitingPids.length > 0) {
          const nextPid = lock.waitingPids.shift()!;
          lock.heldByPid = nextPid;
          lock.lastAcquiredAt = tick;
          unblocked.push({ lockId: lock.id, unblockedPid: nextPid });
        } else {
          lock.heldByPid = null;
        }
      }
    }

    return unblocked;
  }

  public restoreState(locks: Record<LockId, Lock>): void {
    this.locks.clear();
    Object.values(locks).forEach((l) => {
      this.locks.set(l.id, {
        ...l,
        waitingPids: [...l.waitingPids],
      });
    });
  }
}
