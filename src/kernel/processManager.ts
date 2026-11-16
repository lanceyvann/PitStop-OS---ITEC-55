import { PCB } from '../models/pcb';
import { ProcessState, isValidStateTransition } from '../models/stateTransitions';

export interface TransitionResult {
  success: boolean;
  previousState: ProcessState;
  newState: ProcessState;
  error?: string;
}

export class ProcessManager {
  private pcbs: Map<number, PCB> = new Map();
  private readyQueue: number[] = [];     
  private waitingQueue: number[] = [];    
  private terminatedList: number[] = [];  
  private runningPid: number | null = null;

  constructor() {
    this.pcbs = new Map();
    this.readyQueue = [];
    this.waitingQueue = [];
    this.terminatedList = [];
    this.runningPid = null;
  }


  public registerProcess(pcb: PCB): boolean {
    if (this.pcbs.has(pcb.pid)) return false;
    this.pcbs.set(pcb.pid, { ...pcb });
    if (pcb.state === 'READY' && !this.readyQueue.includes(pcb.pid)) {
      this.readyQueue.push(pcb.pid);
    } else if (pcb.state === 'WAITING' && !this.waitingQueue.includes(pcb.pid)) {
      this.waitingQueue.push(pcb.pid);
    }
    return true;
  }

  public transitionState(pid: number, targetState: ProcessState, reason?: string): TransitionResult {
    const pcb = this.pcbs.get(pid);
    if (!pcb) {
      return {
        success: false,
        previousState: 'NEW',
        newState: targetState,
        error: `Process PID #${pid} not found in PCB table.`,
      };
    }

    const previousState = pcb.state;
    if (previousState === targetState) {
      return { success: true, previousState, newState: targetState };
    }

    if (!isValidStateTransition(previousState, targetState)) {
      return {
        success: false,
        previousState,
        newState: targetState,
        error: `Illegal state transition rejected: ${previousState} -> ${targetState} for PID #${pid}.`,
      };
    }

    if (previousState === 'READY') {
      this.readyQueue = this.readyQueue.filter((p) => p !== pid);
    } else if (previousState === 'WAITING') {
      this.waitingQueue = this.waitingQueue.filter((p) => p !== pid);
    } else if (previousState === 'RUNNING' && this.runningPid === pid) {
      this.runningPid = null;
    }

    if (targetState === 'READY') {
      if (!this.readyQueue.includes(pid)) {
        this.readyQueue.push(pid);
      }
    } else if (targetState === 'WAITING') {
      if (!this.waitingQueue.includes(pid)) {
        this.waitingQueue.push(pid);
      }
      if (reason) pcb.waitingReason = reason;
    } else if (targetState === 'RUNNING') {
      this.runningPid = pid;
      delete pcb.waitingReason;
    } else if (targetState === 'TERMINATED') {
      if (!this.terminatedList.includes(pid)) {
        this.terminatedList.push(pid);
      }
    }

    pcb.state = targetState;
    return { success: true, previousState, newState: targetState };
  }

  public getPcb(pid: number): PCB | undefined {
    return this.pcbs.get(pid);
  }

  public getAllPcbs(): Record<number, PCB> {
    const map: Record<number, PCB> = {};
    for (const [pid, pcb] of this.pcbs.entries()) {
      map[pid] = { ...pcb };
    }
    return map;
  }

  public getReadyQueue(): PCB[] {
    return this.readyQueue
      .map((pid) => this.pcbs.get(pid))
      .filter((p): p is PCB => p !== undefined);
  }

  public getReadyQueuePids(): number[] {
    return [...this.readyQueue];
  }

  public getWaitingQueue(): PCB[] {
    return this.waitingQueue
      .map((pid) => this.pcbs.get(pid))
      .filter((p): p is PCB => p !== undefined);
  }

  public getWaitingQueuePids(): number[] {
    return [...this.waitingQueue];
  }

  public getTerminatedPids(): number[] {
    return [...this.terminatedList];
  }

  public getRunningPid(): number | null {
    return this.runningPid;
  }

  public getRunningPcb(): PCB | null {
    return this.runningPid !== null ? this.pcbs.get(this.runningPid) || null : null;
  }

  public setRunningPid(pid: number | null): void {
    this.runningPid = pid;
  }

  public linkParentChild(parentPid: number, childPid: number): void {
    const parent = this.pcbs.get(parentPid);
    const child = this.pcbs.get(childPid);
    if (parent && child) {
      if (!parent.childrenPids.includes(childPid)) {
        parent.childrenPids.push(childPid);
      }
      child.parentPid = parentPid;
    }
  }

  public terminateProcess(pid: number, currentClock: number): { success: boolean; pcb?: PCB } {
    const pcb = this.pcbs.get(pid);
    if (!pcb) return { success: false };

    pcb.completionTime = currentClock;
    pcb.turnaroundTime = Math.max(0, currentClock - pcb.arrivalTime);
    
    pcb.waitingTime = Math.max(0, pcb.turnaroundTime - pcb.totalCpuBurst);

    if (pcb.firstCpuTime !== null) {
      pcb.responseTime = Math.max(0, pcb.firstCpuTime - pcb.arrivalTime);
    } else {
      pcb.responseTime = 0;
    }

    const res = this.transitionState(pid, 'TERMINATED', 'Job completed and departed');
    return { success: res.success, pcb };
  }

  public restoreState(
    pcbs: Record<number, PCB>,
    readyPids: number[],
    waitingPids: number[],
    terminatedPids: number[],
    runningPid: number | null
  ): void {
    this.pcbs.clear();
    Object.entries(pcbs).forEach(([idStr, pcb]) => {
      this.pcbs.set(Number(idStr), { ...pcb });
    });
    this.readyQueue = [...readyPids];
    this.waitingQueue = [...waitingPids];
    this.terminatedList = [...terminatedPids];
    this.runningPid = runningPid;
  }
}
