export interface TCB {
  tid: string;
  ownerPid: number;
  name: string;
  role: 'consult' | 'mount' | 'balance' | 'bill';
  state: 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';
  pc: number;          
  privateStack: string[];   
  heldLocks: string[];      
}
