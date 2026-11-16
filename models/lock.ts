export type LockId = 'lock_tire_changer' | 'lock_wheel_balancer' | 'lock_cash_register';

export interface Lock {
  id: LockId;
  osName: string;
  shopName: string;
  heldByPid: number | null; 
  waitingPids: number[];   
  lastAcquiredAt?: number;
}
