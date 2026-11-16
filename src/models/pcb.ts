import { ProcessState } from './stateTransitions';
import { LockId } from './lock';
import { TCB } from './tcb';

export interface BurstSegment {
  id: string;
  type: 'CPU' | 'IO';
  duration: number;        
  remaining: number;       
  label: string;           
  requiredLock?: LockId;   
  requiresStock?: boolean; 
}

export interface CpuRegisters {
  PC: number;             
  SP: number;             
  AX: number;             
  BX: number;             
  CX: number;             
  DX: number;             
}

export interface PCB {
  pid: number;
  name: string;
  vehicleType: string;      
  modelName: string;        
  tireSpec: string;         
  tireCount: number;        
  state: ProcessState;
  priority: number;         
  basePriority: number;     
  agingBoost: number;       
  arrivalTime: number;      
  
  burstPlan: BurstSegment[];
  currentSegmentIndex: number;
  
  totalCpuBurst: number;    
  totalIoBurst: number;     
  remainingCpuTime: number; 
  
  registers: CpuRegisters;
  parentPid: number | null;
  childrenPids: number[];
  threads: TCB[];
  
  firstCpuTime: number | null;
  completionTime: number | null;
  waitingTime: number;      
  turnaroundTime: number;   
  responseTime: number;     
  
  heldLocks: LockId[];
  waitingForLock: LockId | null;
  waitingForStock: { tireId: string; quantity: number } | null;
  waitingReason?: string;
  
  isDeadlocked?: boolean;
  color: string;           
}
