/**
 * @file lockManager.ts
 * @description Mutex Lock Manager for workshop equipment (Changer, Balancer, Register).
 * Enforces mutual exclusion, queueing, and fair FIFO release unblocking.
 */

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

  /**
   * Attempts to acquire lock for process `pid`.
   * Returns true if granted immediately, false if blocked.
   */
  public acquire(pid: number, id: LockId, tick: number): boolean {
    const lock = this.locks.get(id);
    if (!lock) return false;

    // Already held by this process
    if (lock.heldByPid === pid) {
      return true;
    }

    // Unlocked: grant immediately
    if (lock.heldByPid === null) {
      lock.heldByPid = pid;
      lock.lastAcquiredAt = tick;
      // Remove from waitQueue if present
      lock.waitingPids = lock.waitingPids.filter((p) => p !== pid);
      return true;
    }

    // Busy: add to waiting queue if not already there
    if (!lock.waitingPids.includes(pid)) {
      lock.waitingPids.push(pid);
    }
    return false;
  }

  /**
   * Releases lock held by `pid`.
   * If other processes are waiting, grants lock to next in queue and returns its PID.
   */
  public release(pid: number, id: LockId, tick: number): { success: boolean; nextPid: number | null } {
    const lock = this.locks.get(id);
    if (!lock) return { success: false, nextPid: null };

    if (lock.heldByPid !== pid) {
      return { success: false, nextPid: null };
    }

    // Check if other processes are waiting
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

  /**
   * Forcefully releases a lock (administrative intervention for deadlock recovery).
   */
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

  /**
   * Cleans up all locks held or waited on by a terminating/aborted process.
   * Returns list of any nextPids that got unblocked as a result.
   */
  public releaseAllForPid(pid: number, tick: number): Array<{ lockId: LockId; unblockedPid: number }> {
    const unblocked: Array<{ lockId: LockId; unblockedPid: number }> = [];

    for (const lock of this.locks.values()) {
      // Remove from waiting queue if queued
      lock.waitingPids = lock.waitingPids.filter((p) => p !== pid);

      // If held by this process, release and hand over to next waiter
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

  /**
   * Restores locks map state from snapshot.
   */
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
