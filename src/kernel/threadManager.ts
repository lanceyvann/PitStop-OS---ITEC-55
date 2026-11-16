/**
 * @file threadManager.ts
 * @description Thread Management Subsystem managing Thread Control Blocks (TCBs).
 * Simulates lightweight worker threads per customer order (consultation, mounting, balancing, billing).
 */

import { TCB } from '../models/tcb';

export class ThreadManager {
  private threads: Map<string, TCB> = new Map();

  /**
   * Spawns a new staff task thread under an owner process.
   */
  public createThread(ownerPid: number, role: TCB['role'], name: string): TCB {
    const tid = `t_${ownerPid}_${role}_${Date.now().toString(36).substring(4)}`;
    const tcb: TCB = {
      tid,
      ownerPid,
      name,
      role,
      state: 'READY',
      pc: 0,
      privateStack: [`init_${role}_task()`],
      heldLocks: [],
    };
    this.threads.set(tid, tcb);
    return tcb;
  }

  /**
   * Advances the execution state and program counter of a thread.
   */
  public stepThread(tcb: TCB, instruction: string): void {
    tcb.pc += 1;
    tcb.privateStack.push(instruction);
    if (tcb.privateStack.length > 5) {
      tcb.privateStack.shift(); // Keep stack clean
    }
  }

  /**
   * Returns all threads belonging to a process.
   */
  public getThreadsForPid(pid: number): TCB[] {
    const list: TCB[] = [];
    for (const tcb of this.threads.values()) {
      if (tcb.ownerPid === pid) {
        list.push({ ...tcb, privateStack: [...tcb.privateStack], heldLocks: [...tcb.heldLocks] });
      }
    }
    return list;
  }

  /**
   * Terminates all threads for a process upon process exit.
   */
  public terminateThreadsForPid(pid: number): void {
    for (const [tid, tcb] of this.threads.entries()) {
      if (tcb.ownerPid === pid) {
        tcb.state = 'TERMINATED';
        this.threads.delete(tid);
      }
    }
  }

  public restoreState(threadsList: TCB[]): void {
    this.threads.clear();
    threadsList.forEach((t) => {
      this.threads.set(t.tid, {
        ...t,
        privateStack: [...t.privateStack],
        heldLocks: [...t.heldLocks],
      });
    });
  }
}
