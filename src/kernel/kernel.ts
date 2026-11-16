/**
 * @file kernel.ts
 * @description Central Tire Shop OS Kernel Engine.
 * Coordinates system ticks, CPU context switches, process lifecycles, mutex locks,
 * shared inventory, Gantt history generation, and Time Machine snapshots.
 */

import { KernelLog } from './kernelLog';
import { ProcessManager } from './processManager';
import { LockManager } from './lockManager';
import { InventoryManager } from './inventoryManager';
import { ThreadManager } from './threadManager';
import { DeadlockDetector, DeadlockReport } from './deadlockDetector';
import { Syscalls, SyscallContext } from './syscalls';
import { Scheduler } from '../scheduler/scheduler';
import { AlgorithmType } from '../scheduler/types';
import { PCB } from '../models/pcb';
import { LockId } from '../models/lock';
import { GanttBlock, SimulationSnapshot, SystemMetrics } from '../models/snapshot';
import { Mulberry32 } from '../config/prng';
import { WHY_TEMPLATES } from '../skin/dictionary';

export class Kernel {
  public clock: number = 0;
  public mode: 'USER' | 'KERNEL' = 'USER';
  
  public readonly logger: KernelLog;
  public readonly processManager: ProcessManager;
  public readonly lockManager: LockManager;
  public readonly inventoryManager: InventoryManager;
  public readonly threadManager: ThreadManager;
  public readonly scheduler: Scheduler;
  
  // Pending pool of incoming arrivals that haven't arrived yet
  public futureArrivals: PCB[] = [];
  
  // Metrics & State Tracking
  public currentQuantumUsed: number = 0;
  public totalBusyTicks: number = 0;
  public contextSwitchCount: number = 0;
  public lastRunningPid: number | null = null;
  public latestDeadlockReport: DeadlockReport = {
    hasDeadlock: false,
    cyclePids: [],
    edges: [],
    summary: 'Normal execution',
    suggestedVictimPid: null,
  };
  
  // Gantt Chart State
  public ganttBlocks: GanttBlock[] = [];
  
  // Time Machine Snapshots (one snapshot captured at every tick)
  public snapshots: SimulationSnapshot[] = [];
  
  // Seeded PRNG for deterministic runtime events
  public prng: Mulberry32;

  constructor(seed: number = 1337) {
    this.logger = new KernelLog();
    this.processManager = new ProcessManager();
    this.lockManager = new LockManager();
    this.inventoryManager = new InventoryManager();
    this.threadManager = new ThreadManager();
    this.scheduler = new Scheduler('FCFS', 3);
    this.prng = new Mulberry32(seed);

    this.boot();
  }

  /**
   * Initializes OS subsystems and records boot sequence.
   */
  public boot(): void {
    this.clock = 0;
    this.mode = 'USER';
    this.totalBusyTicks = 0;
    this.contextSwitchCount = 0;
    this.currentQuantumUsed = 0;
    this.lastRunningPid = null;
    this.ganttBlocks = [];
    this.snapshots = [];

    this.logger.generateBootSequence();
    this.captureSnapshot();
  }

  private getSyscallContext(): SyscallContext {
    return {
      tick: this.clock,
      setMode: (m) => {
        this.mode = m;
      },
      logger: this.logger,
      processManager: this.processManager,
      lockManager: this.lockManager,
      threadManager: this.threadManager,
      inventoryManager: this.inventoryManager,
    };
  }

  /**
   * Enqueues an incoming order into future arrivals or ready queue.
   */
  public submitOrder(order: PCB): void {
    this.processManager.registerProcess(order);
    if (order.arrivalTime <= this.clock) {
      this.processManager.transitionState(order.pid, 'READY');
      this.logger.info(
        'PROCESS',
        `Admitted Order #${order.pid} (${order.modelName}) to Ready queue. Priority: ${order.priority}`,
        this.clock,
        order.pid,
        'create_process'
      );
    } else {
      this.futureArrivals.push(order);
      this.logger.info(
        'PROCESS',
        `Scheduled Order #${order.pid} (${order.modelName}) for arrival at Tick ${order.arrivalTime}.`,
        this.clock,
        order.pid
      );
    }
  }

  /**
   * Core Single-Tick Simulation Step.
   * Advances the clock by exactly 1 tick, updating queues, CPU execution, and metrics.
   */
  public step(): void {
    this.clock += 1;

    // 1. Check for new arrivals scheduled for this tick
    const arrivingNow = this.futureArrivals.filter((p) => p.arrivalTime <= this.clock);
    this.futureArrivals = this.futureArrivals.filter((p) => p.arrivalTime > this.clock);

    for (const order of arrivingNow) {
      this.processManager.transitionState(order.pid, 'READY');
      this.logger.info(
        'PROCESS',
        `Order #${order.pid} (${order.modelName}) arrived at Tick ${this.clock}. Moved to Ready queue.`,
        this.clock,
        order.pid,
        'create_process'
      );
    }

    // 2. Advance Waiting I/O processes
    this.advanceWaitingProcesses();

    // 3. Advance Priority Aging
    if (this.scheduler.agingEnabled && this.scheduler.getAlgorithm() === 'PRIORITY') {
      const readyPids = this.processManager.getReadyQueuePids();
      for (const pid of readyPids) {
        const pcb = this.processManager.getPcb(pid);
        if (pcb) {
          pcb.waitingTime += 1;
          if (pcb.waitingTime % this.scheduler.agingInterval === 0) {
            pcb.agingBoost += 1;
            this.logger.debug(
              'SCHEDULER',
              `Order #${pid} received aging boost (+1). Effective priority now: ${pcb.priority + pcb.agingBoost}`,
              this.clock,
              pid
            );
          }
        }
      }
    }

    // 4. Run CPU Scheduling Decision
    const currentRunning = this.processManager.getRunningPcb();
    const readyQueue = this.processManager.getReadyQueue();

    const decision = this.scheduler.schedule({
      readyQueue,
      currentRunning,
      currentQuantumUsed: this.currentQuantumUsed,
      currentTime: this.clock,
    });

    // Handle preemption if signaled by strategy
    if (decision.shouldPreempt && currentRunning && decision.nextPid !== currentRunning.pid) {
      Syscalls.yield(currentRunning.pid, this.getSyscallContext(), decision.reason);
      this.currentQuantumUsed = 0;
    }

    // Check if we need to dispatch a new process onto the CPU
    let activeRunning = this.processManager.getRunningPcb();
    if (!activeRunning && decision.nextPid !== null) {
      const nextPcb = this.processManager.getPcb(decision.nextPid);
      if (nextPcb) {
        // Context switch!
        if (this.lastRunningPid !== null && this.lastRunningPid !== nextPcb.pid) {
          this.contextSwitchCount += 1;
          this.recordGanttBlock('CONTEXT_SWITCH', this.clock - 1, 1, 'SWITCH', `Switch to #${nextPcb.pid}`);
          this.logger.info(
            'SCHEDULER',
            `Context switch on Fitting Bay lift: PID #${this.lastRunningPid} -> PID #${nextPcb.pid}.`,
            this.clock
          );
        }

        this.processManager.transitionState(nextPcb.pid, 'RUNNING');
        this.currentQuantumUsed = 0;
        activeRunning = nextPcb;

        // Record first CPU time for response time calculation
        if (activeRunning.firstCpuTime === null) {
          activeRunning.firstCpuTime = this.clock - 1;
          activeRunning.responseTime = Math.max(0, activeRunning.firstCpuTime - activeRunning.arrivalTime);
        }

        this.logger.info('SCHEDULER', decision.reason, this.clock, activeRunning.pid);
      }
    }

    // 5. Execute CPU step for the active process
    if (activeRunning && activeRunning.state === 'RUNNING') {
      this.totalBusyTicks += 1;
      this.currentQuantumUsed += 1;
      this.lastRunningPid = activeRunning.pid;

      // Update register PC
      activeRunning.registers.PC += 1;

      // Check current burst segment
      const currentSegment = activeRunning.burstPlan[activeRunning.currentSegmentIndex];
      if (currentSegment && currentSegment.type === 'CPU') {
        // Check if segment requires a mutex lock that we haven't acquired
        if (currentSegment.requiredLock && !activeRunning.heldLocks.includes(currentSegment.requiredLock)) {
          const acquired = Syscalls.acquireLock(activeRunning.pid, currentSegment.requiredLock, this.getSyscallContext());
          if (!acquired) {
            // Blocked on lock! Cannot execute CPU this tick
            this.recordGanttBlock(
              activeRunning.pid,
              this.clock - 1,
              1,
              'WAITING',
              `Blocked waiting for ${currentSegment.requiredLock}`,
              `Blocked: Waiting for lock ${currentSegment.requiredLock}`
            );
            return;
          }
        }

        currentSegment.remaining -= 1;
        activeRunning.remainingCpuTime = Math.max(0, activeRunning.remainingCpuTime - 1);

        // Record CPU execution block on Gantt
        this.recordGanttBlock(
          activeRunning.pid,
          this.clock - 1,
          1,
          'RUNNING',
          currentSegment.label,
          decision.reason
        );

        // Advance thread step
        if (activeRunning.threads.length > 0) {
          const activeThread = activeRunning.threads[0];
          this.threadManager.stepThread(activeThread, `exec_step_${activeRunning.registers.PC}`);
        }

        // Did current CPU segment finish?
        if (currentSegment.remaining <= 0) {
          // Release segment lock if tied to segment
          if (currentSegment.requiredLock) {
            Syscalls.releaseLock(activeRunning.pid, currentSegment.requiredLock, this.getSyscallContext());
          }

          // Advance to next segment
          activeRunning.currentSegmentIndex += 1;

          // Check if all segments are completed
          if (activeRunning.currentSegmentIndex >= activeRunning.burstPlan.length) {
            Syscalls.terminateProcess(activeRunning.pid, this.getSyscallContext());
            this.currentQuantumUsed = 0;
          } else {
            // Check next segment
            const nextSegment = activeRunning.burstPlan[activeRunning.currentSegmentIndex];
            if (nextSegment.type === 'IO') {
              // Initiate I/O burst
              Syscalls.ioRequest(activeRunning.pid, nextSegment.duration, nextSegment.label, this.getSyscallContext());
              this.currentQuantumUsed = 0;
            }
          }
        }
      }
    } else {
      // CPU is idle
      this.recordGanttBlock('CPU_IDLE', this.clock - 1, 1, 'IDLE', 'Fitting Bay Lift Idle', 'No orders in Ready queue');
    }

    // 6. Deadlock Detection Check
    this.checkDeadlocks();

    // 7. Save Snapshot for Time Machine
    this.captureSnapshot();
  }

  /**
   * Advances waiting I/O burst durations and handles stock unblocking.
   */
  private advanceWaitingProcesses(): void {
    const waitingPids = this.processManager.getWaitingQueuePids();

    for (const pid of waitingPids) {
      const pcb = this.processManager.getPcb(pid);
      if (!pcb || pcb.state !== 'WAITING') continue;

      // If waiting for stock:
      if (pcb.waitingForStock) {
        const hasStock = this.inventoryManager.hasAvailableStock(
          pcb.waitingForStock.tireId,
          pcb.waitingForStock.quantity
        );
        if (hasStock) {
          this.inventoryManager.reserveStock(pcb.waitingForStock.tireId, pcb.waitingForStock.quantity);
          pcb.waitingForStock = null;
          this.processManager.transitionState(pid, 'READY');
          this.logger.info('INVENTORY', `Stock restocked! Order #${pid} unblocked and re-entered Ready queue.`, this.clock, pid);
        } else {
          this.recordGanttBlock(pid, this.clock - 1, 1, 'WAITING', 'Waiting for Tire Restock', 'Stock depleted in stockroom');
        }
        continue;
      }

      // If waiting for lock:
      if (pcb.waitingForLock) {
        const isDeadlocked = this.latestDeadlockReport.cyclePids.includes(pid);
        this.recordGanttBlock(
          pid,
          this.clock - 1,
          1,
          isDeadlocked ? 'DEADLOCK' : 'WAITING',
          isDeadlocked ? 'Deadlock Hold-and-Wait' : `Waiting for ${pcb.waitingForLock}`,
          isDeadlocked ? this.latestDeadlockReport.summary : `Blocked waiting for lock ${pcb.waitingForLock}`
        );
        continue;
      }

      // Standard I/O burst segment progression
      const currentSegment = pcb.burstPlan[pcb.currentSegmentIndex];
      if (currentSegment && currentSegment.type === 'IO') {
        currentSegment.remaining -= 1;
        this.recordGanttBlock(pid, this.clock - 1, 1, 'WAITING', currentSegment.label, 'Executing external I/O burst');

        if (currentSegment.remaining <= 0) {
          // I/O completed! Transition back to READY
          pcb.currentSegmentIndex += 1;
          if (pcb.currentSegmentIndex >= pcb.burstPlan.length) {
            Syscalls.terminateProcess(pid, this.getSyscallContext());
          } else {
            this.processManager.transitionState(pid, 'READY');
            this.logger.info('PROCESS', `Order #${pid} finished I/O ("${currentSegment.label}"). Woke up to Ready queue.`, this.clock, pid);
          }
        }
      }
    }
  }

  /**
   * Run deadlock detection on current state.
   */
  public checkDeadlocks(): DeadlockReport {
    const pcbs = this.processManager.getAllPcbs();
    const locks = this.lockManager.getLocks();
    const report = DeadlockDetector.detect(pcbs, locks);

    // Update isDeadlocked flag on pcbs
    for (const pcb of Object.values(pcbs)) {
      pcb.isDeadlocked = report.cyclePids.includes(pcb.pid);
    }

    if (report.hasDeadlock && !this.latestDeadlockReport.hasDeadlock) {
      this.logger.error('LOCK', report.summary, this.clock);
    }

    this.latestDeadlockReport = report;
    return report;
  }

  /**
   * Deadlock Recovery: Abort victim process.
   */
  public abortVictimProcess(victimPid: number): void {
    this.logger.warn(
      'LOCK',
      `ADMIN RECOVERY: Aborting deadlocked Order #${victimPid} to break circular wait.`,
      this.clock,
      victimPid
    );
    Syscalls.terminateProcess(victimPid, this.getSyscallContext());
    this.checkDeadlocks();
  }

  /**
   * Deadlock Recovery: Force-release a lock.
   */
  public forceReleaseLock(lockId: LockId): void {
    const { previousHolder, nextPid } = this.lockManager.forceRelease(lockId, this.clock);
    this.logger.warn(
      'LOCK',
      `ADMIN RECOVERY: Force-released lock [${lockId}]. Previous holder: #${previousHolder || 'none'}. Granted to: #${nextPid || 'none'}.`,
      this.clock
    );
    if (nextPid !== null) {
      const nextPcb = this.processManager.getPcb(nextPid);
      if (nextPcb) {
        nextPcb.waitingForLock = null;
        if (!nextPcb.heldLocks.includes(lockId)) {
          nextPcb.heldLocks.push(lockId);
        }
        this.processManager.transitionState(nextPid, 'READY');
      }
    }
    this.checkDeadlocks();
  }

  /**
   * Supplier Restock Event (adds inventory and wakes up any waiting processes).
   */
  public restockTires(tireId: string, quantity: number): void {
    this.inventoryManager.restock(tireId, quantity);
    const item = this.inventoryManager.getItem(tireId);
    this.logger.info(
      'INVENTORY',
      `SUPPLIER DELIVERY: Received +${quantity} units of ${item?.brand} ${item?.size}. Total in stock: ${item?.stock}.`,
      this.clock
    );

    // Wake up any orders waiting for this stock
    const waitingPids = this.processManager.getWaitingQueuePids();
    for (const pid of waitingPids) {
      const pcb = this.processManager.getPcb(pid);
      if (pcb && pcb.waitingForStock && pcb.waitingForStock.tireId === tireId) {
        if (this.inventoryManager.hasAvailableStock(tireId, pcb.waitingForStock.quantity)) {
          this.inventoryManager.reserveStock(tireId, pcb.waitingForStock.quantity);
          pcb.waitingForStock = null;
          this.processManager.transitionState(pid, 'READY');
          this.logger.info('INVENTORY', `Order #${pid} unblocked after restock and entered Ready queue.`, this.clock, pid);
        }
      }
    }
  }

  /**
   * Records or extends contiguous Gantt blocks.
   * Merges contiguous blocks of the same state and PID to keep timeline tidy.
   */
  private recordGanttBlock(
    pid: number | 'CPU_IDLE' | 'CONTEXT_SWITCH',
    start: number,
    duration: number,
    state: GanttBlock['state'],
    label: string,
    whyReason?: string
  ): void {
    const last = this.ganttBlocks[this.ganttBlocks.length - 1];
    if (last && last.pid === pid && last.state === state && last.start + last.duration === start) {
      last.duration += duration;
      return;
    }

    this.ganttBlocks.push({
      id: `gb_${pid}_${start}_${Math.random().toString(36).substring(2, 6)}`,
      pid,
      start,
      duration,
      state,
      label,
      whyReason,
    });
  }

  /**
   * Computes comprehensive scheduling performance metrics.
   */
  public calculateMetrics(): SystemMetrics {
    const pcbs = Object.values(this.processManager.getAllPcbs());
    const completed = pcbs.filter((p) => p.state === 'TERMINATED' && p.completionTime !== null);

    const count = completed.length;
    const avgWaitingTime = count > 0 ? completed.reduce((acc, p) => acc + p.waitingTime, 0) / count : 0;
    const avgTurnaroundTime = count > 0 ? completed.reduce((acc, p) => acc + p.turnaroundTime, 0) / count : 0;
    const avgResponseTime = count > 0 ? completed.reduce((acc, p) => acc + p.responseTime, 0) / count : 0;

    const cpuUtilization = this.clock > 0 ? Math.min(100, (this.totalBusyTicks / this.clock) * 100) : 0;
    const throughput = this.clock > 0 ? count / this.clock : 0;

    return {
      cpuUtilization: Number(cpuUtilization.toFixed(1)),
      throughput: Number(throughput.toFixed(3)),
      avgWaitingTime: Number(avgWaitingTime.toFixed(2)),
      avgTurnaroundTime: Number(avgTurnaroundTime.toFixed(2)),
      avgResponseTime: Number(avgResponseTime.toFixed(2)),
      completedCount: count,
      contextSwitchCount: this.contextSwitchCount,
      totalBusyTicks: this.totalBusyTicks,
    };
  }

  /**
   * Captures a deep snapshot of the entire simulation state at current clock tick.
   */
  public captureSnapshot(): SimulationSnapshot {
    const snap: SimulationSnapshot = {
      tick: this.clock,
      mode: this.mode,
      runningPid: this.processManager.getRunningPid(),
      readyQueuePids: this.processManager.getReadyQueuePids(),
      waitingQueuePids: this.processManager.getWaitingQueuePids(),
      terminatedPids: this.processManager.getTerminatedPids(),
      pcbs: JSON.parse(JSON.stringify(this.processManager.getAllPcbs())),
      futureArrivals: JSON.parse(JSON.stringify(this.futureArrivals)),
      locks: JSON.parse(JSON.stringify(this.lockManager.getLocks())),
      inventory: JSON.parse(JSON.stringify(this.inventoryManager.getItems())),
      metrics: this.calculateMetrics(),
      ganttBlocks: JSON.parse(JSON.stringify(this.ganttBlocks)),
      logsCount: this.logger.getEntries().length,
      prngState: this.prng.getState(),
      currentQuantumUsed: this.currentQuantumUsed,
      deadlockReport: JSON.parse(JSON.stringify(this.latestDeadlockReport)),
    };

    if (this.snapshots[this.clock]) {
      this.snapshots[this.clock] = snap;
    } else {
      this.snapshots.push(snap);
    }
    return snap;
  }

  /**
   * Time Machine: Rewinds simulation state to an earlier tick T.
   */
  public rewindToTick(targetTick: number): boolean {
    if (targetTick < 0 || targetTick >= this.snapshots.length) return false;

    const snap = this.snapshots[targetTick];
    if (!snap) return false;

    this.clock = snap.tick;
    this.mode = snap.mode;
    this.currentQuantumUsed = snap.currentQuantumUsed;
    this.totalBusyTicks = snap.metrics.totalBusyTicks;
    this.contextSwitchCount = snap.metrics.contextSwitchCount;

    // Restore pending future arrivals
    this.futureArrivals = snap.futureArrivals ? JSON.parse(JSON.stringify(snap.futureArrivals)) : [];

    // Restore subsystems
    this.processManager.restoreState(
      snap.pcbs,
      snap.readyQueuePids,
      snap.waitingQueuePids,
      snap.terminatedPids,
      snap.runningPid
    );
    this.lockManager.restoreState(snap.locks);
    this.inventoryManager.restoreState(snap.inventory);
    this.prng.setState(snap.prngState);

    // Truncate event logs to what was recorded up to this snapshot
    this.logger.truncateToCount(snap.logsCount);

    // Restore Gantt history and snapshots up to this tick
    this.ganttBlocks = JSON.parse(JSON.stringify(snap.ganttBlocks));
    this.snapshots = this.snapshots.slice(0, targetTick + 1);

    if (snap.deadlockReport) {
      this.latestDeadlockReport = JSON.parse(JSON.stringify(snap.deadlockReport));
    } else {
      this.checkDeadlocks();
    }

    this.logger.info('KERNEL', `TIME MACHINE: Rewound simulation state to Tick ${targetTick}. Ready to resume.`, this.clock);
    return true;
  }
}
