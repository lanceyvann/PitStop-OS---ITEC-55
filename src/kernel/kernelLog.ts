export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
export type LogSource = 'KERNEL' | 'SCHEDULER' | 'PROCESS' | 'THREAD' | 'LOCK' | 'INVENTORY' | 'SYSCALL';

export interface LogEntry {
  id: string;
  tick: number;
  timestamp: number;
  level: LogLevel;
  source: LogSource;
  pid?: number;
  syscall?: string;
  message: string;
}

export class KernelLog {
  private entries: LogEntry[] = [];
  private maxEntries: number = 2000;

  constructor() {
    this.entries = [];
  }

  public log(entry: Omit<LogEntry, 'id' | 'timestamp'>): LogEntry {
    const fullEntry: LogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };

    this.entries.push(fullEntry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
    return fullEntry;
  }

  public info(source: LogSource, message: string, tick: number, pid?: number, syscall?: string): LogEntry {
    return this.log({ level: 'INFO', source, message, tick, pid, syscall });
  }

  public warn(source: LogSource, message: string, tick: number, pid?: number, syscall?: string): LogEntry {
    return this.log({ level: 'WARN', source, message, tick, pid, syscall });
  }

  public error(source: LogSource, message: string, tick: number, pid?: number, syscall?: string): LogEntry {
    return this.log({ level: 'ERROR', source, message, tick, pid, syscall });
  }

  public debug(source: LogSource, message: string, tick: number, pid?: number, syscall?: string): LogEntry {
    return this.log({ level: 'DEBUG', source, message, tick, pid, syscall });
  }

  public getEntries(): LogEntry[] {
    return [...this.entries];
  }

  public clear(): void {
    this.entries = [];
  }

  public setEntries(entries: LogEntry[]): void {
    this.entries = [...entries];
  }

  public truncateToCount(count: number): void {
    if (count >= 0 && count <= this.entries.length) {
      this.entries = this.entries.slice(0, count);
    }
  }

  public generateBootSequence(): void {
    this.clear();
    const bootSteps: Array<{ source: LogSource; msg: string; level: LogLevel }> = [
      { source: 'KERNEL', msg: 'POST: Initializing Tire Shop Kernel v2.4 (ITEC 55 Micro-Architecture)...', level: 'INFO' },
      { source: 'KERNEL', msg: 'MMU: Initializing Process Control Block (PCB) tables [Capacity: 256 descriptors]...', level: 'INFO' },
      { source: 'KERNEL', msg: 'CPU: Registering single core Fitting Bay Hydraulic Lift (Context switch penalty: 1 tick)...', level: 'INFO' },
      { source: 'LOCK', msg: 'MUTEX: Registered 3 hardware locks [Tire Changer 0x01, Wheel Balancer 0x02, POS Cash Register 0x03]...', level: 'INFO' },
      { source: 'INVENTORY', msg: 'STORAGE: Mounting Shared Tire Stockroom Inventory [9 stock catalogs mapped]...', level: 'INFO' },
      { source: 'SCHEDULER', msg: 'SCHED: Initialized Multi-Strategy Dispatcher (FCFS, SJF, RR, Priority with Aging)...', level: 'INFO' },
      { source: 'KERNEL', msg: 'SYS: Trap table configured (syscalls: create_process, terminate_process, yield, io_req, locks)...', level: 'INFO' },
      { source: 'KERNEL', msg: 'BOOT COMPLETE: Switching to USER MODE showroom lounge. Waiting for customer arrivals.', level: 'INFO' },
    ];

    bootSteps.forEach((step) => {
      this.log({
        tick: 0,
        level: step.level,
        source: step.source,
        message: step.msg,
      });
    });
  }
}
