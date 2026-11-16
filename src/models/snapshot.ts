import { PCB } from './pcb';
import { Lock, LockId } from './lock';
import { TireStockItem } from './tireStockItem';

export interface GanttBlock {
  id: string;
  pid: number | 'CPU_IDLE' | 'CONTEXT_SWITCH';
  start: number;
  duration: number;
  state: 'RUNNING' | 'READY' | 'WAITING' | 'IDLE' | 'SWITCH' | 'DEADLOCK';
  label: string;
  whyReason?: string;
}

export interface SystemMetrics {
  cpuUtilization: number;  
  throughput: number;      
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  completedCount: number;
  contextSwitchCount: number;
  totalBusyTicks: number;
}

export interface SimulationSnapshot {
  tick: number;
  mode: 'USER' | 'KERNEL';
  runningPid: number | null;
  readyQueuePids: number[];
  waitingQueuePids: number[];
  terminatedPids: number[];
  pcbs: Record<number, PCB>;
  futureArrivals?: PCB[];
  locks: Record<LockId, Lock>;
  inventory: TireStockItem[];
  metrics: SystemMetrics;
  ganttBlocks: GanttBlock[];
  logsCount: number;
  prngState: number;
  currentQuantumUsed: number;
  deadlockReport?: {
    hasDeadlock: boolean;
    cyclePids: number[];
    edges: Array<{ fromPid: number; toPid: number; lockId: LockId }>;
    summary: string;
    suggestedVictimPid: number | null;
  };
}
