import React from 'react';

export type ViewMode = 'OS' | 'STORY';

export interface TermDefinition {
  osTerm: string;
  storyTerm: string;
  description: string;
}

export const SCENARIO_MAPPING: Record<string, TermDefinition> = {
  kernel: {
    osTerm: 'Kernel Core',
    storyTerm: "Shop Manager's Desk",
    description: 'Central authoritative controller managing all allocations, queues, and shop resources.',
  },
  kernelMode: {
    osTerm: 'Kernel Mode (Privileged)',
    storyTerm: 'Sales Counter / Manager Office',
    description: 'Privileged execution mode with direct hardware, queue, and inventory control.',
  },
  userMode: {
    osTerm: 'User Mode (Restricted)',
    storyTerm: 'Showroom / Waiting Lounge',
    description: 'Restricted unprivileged state where customer orders await attention.',
  },
  cpu: {
    osTerm: 'Central Processing Unit (CPU)',
    storyTerm: 'Fitting Bay with Hydraulic Lift',
    description: 'The single active execution slot where tires are fitted onto vehicles.',
  },
  process: {
    osTerm: 'Process',
    storyTerm: 'Customer Tire Order',
    description: 'An independent unit of execution with private registers and resource allocation.',
  },
  pcb: {
    osTerm: 'Process Control Block (PCB)',
    storyTerm: 'Sales Ticket / Order Slip',
    description: 'The tracking record holding state, vehicle type, priority, and registers.',
  },
  thread: {
    osTerm: 'Thread',
    storyTerm: 'Staff Sub-Task (Consult, Mount, Balance, Bill)',
    description: 'A lightweight sub-stream of execution sharing the process address space.',
  },
  tcb: {
    osTerm: 'Thread Control Block (TCB)',
    storyTerm: 'Mechanic Task Card',
    description: 'The tracking record for an individual mechanic task and execution stack.',
  },
  readyQueue: {
    osTerm: 'Ready Queue',
    storyTerm: 'Waiting Vehicle Lane',
    description: 'Queue of orders primed and waiting for their turn at the fitting bay lift.',
  },
  runningState: {
    osTerm: 'RUNNING',
    storyTerm: 'On the Hydraulic Lift (Bay Active)',
    description: 'Vehicle is currently raised on the lift having work performed.',
  },
  waitingState: {
    osTerm: 'WAITING (Blocked I/O / Mutex)',
    storyTerm: 'Awaiting Delivery / Balancer / POS Checkout',
    description: 'Order cannot proceed until a mutex lock, stock item, or payment completes.',
  },
  terminatedState: {
    osTerm: 'TERMINATED',
    storyTerm: 'Completed & Departed with New Tires',
    description: 'Job fully finished, invoice settled, and all shop resources released.',
  },
  timeQuantum: {
    osTerm: 'Time Quantum (Time Slice)',
    storyTerm: 'Bay Time Allocation Window',
    description: 'Maximum consecutive time an order can stay on the lift before yielding.',
  },
  contextSwitch: {
    osTerm: 'Context Switch',
    storyTerm: 'Bay Vehicle Swap',
    description: 'Lifting down the current vehicle, saving state, and raising the next.',
  },
  highPriority: {
    osTerm: 'High Priority (Preemption)',
    storyTerm: 'Fleet / Commuter Express Order',
    description: 'Priority commercial or emergency orders that bypass regular customer turns.',
  },
  mutexLocks: {
    osTerm: 'Mutex Locks (Mutual Exclusion)',
    storyTerm: 'Exclusive Equipment (Tire Changer, Balancer, Register)',
    description: 'Single-occupancy machines that only one mechanic can use at a time.',
  },
  resourcePool: {
    osTerm: 'Shared Resource Pool',
    storyTerm: 'Tire Stock Room Inventory',
    description: 'Shared inventory counters for tire sizes and brands.',
  },
};

export function getTerm(key: keyof typeof SCENARIO_MAPPING, mode: ViewMode): string {
  const item = SCENARIO_MAPPING[key];
  if (!item) return key;
  return mode === 'STORY' ? item.storyTerm : item.osTerm;
}

export const WHY_TEMPLATES = {
  fcfsSelected: (pid: number, vehicle: string, arrivalTime: number, queueCount: number) =>
    `Order #${pid} (${vehicle}) was dispatched to the Fitting Bay because it arrived earliest (Tick ${arrivalTime}) among the ${queueCount} orders in the Waiting Lane. First-Come, First-Served strictly follows arrival order without preemption.`,

  sjfSelected: (pid: number, vehicle: string, burst: number, queueCount: number) =>
    `Order #${pid} (${vehicle}) was dispatched because it has the shortest remaining CPU time (${burst} ticks) among ${queueCount} waiting orders. SJF minimizes average waiting time across all vehicles.`,

  rrSelected: (pid: number, vehicle: string, quantum: number) =>
    `Order #${pid} (${vehicle}) was allocated the Fitting Bay lift for a round-robin time slice of up to ${quantum} ticks, ensuring fair bay access for all vehicles without starvation.`,

  prioritySelected: (pid: number, vehicle: string, priority: number, agingBoost: number) =>
    `Order #${pid} (${vehicle}) was dispatched because it holds the highest effective priority (${priority}${
      agingBoost > 0 ? ` including +${agingBoost} aging bonus` : ''
    }). High priority commercial and fleet vehicles receive expedited service.`,

  preemptedQuantum: (pid: number, quantum: number) =>
    `Order #${pid} was preempted and returned to the Waiting Lane because its ${quantum}-tick time quantum expired. This preserves CPU responsiveness for other vehicles.`,

  preemptedPriority: (runningPid: number, preemptingPid: number, highPri: number) =>
    `Order #${runningPid} was preempted by Order #${preemptingPid} possessing higher priority (${highPri}). The bay was reassigned via context switch.`,

  blockedOnLock: (pid: number, lockName: string) =>
    `Order #${pid} entered WAITING because it requested exclusive access to "${lockName}", which is currently occupied by another order.`,

  blockedOnStock: (pid: number, tireSpec: string, requested: number) =>
    `Order #${pid} entered WAITING because the stock room has insufficient inventory for ${requested}x ${tireSpec}. It will resume once the tire supplier delivers restock.`,

  deadlockDetected: (pids: number[], cycleDescription: string) =>
    `DEADLOCK DETECTED! A circular wait condition exists between orders [${pids.join(
      ', '
    )}]. ${cycleDescription}. Neither order can advance without administrative intervention.`,

  completed: (pid: number, turnaround: number, waiting: number) =>
    `Order #${pid} completed all tire fitting, balancing, and billing. Total turnaround: ${turnaround} ticks (Waiting: ${waiting} ticks). All locks and lift bay released.`,
};

export function VehicleIcon({ type, className = 'w-4 h-4' }: { type: string; className?: string }) {
  const norm = type.toLowerCase();

  if (norm.includes('motorcycle') || norm.includes('bike')) {
    return React.createElement(
      'svg',
      {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className,
      },
      React.createElement('circle', { cx: 5, cy: 16, r: 3 }),
      React.createElement('circle', { cx: 19, cy: 16, r: 3 }),
      React.createElement('path', { d: 'M12 17l4-9h4' }),
      React.createElement('path', { d: 'M5 16l4-7h5' }),
      React.createElement('path', { d: 'M9 9h2' })
    );
  }

  if (norm.includes('sedan') || norm.includes('car')) {
    return React.createElement(
      'svg',
      {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className,
      },
      React.createElement('path', { d: 'M4 14h16l1 3H3l1-3z' }),
      React.createElement('path', { d: 'M6 14l2-5h8l2 5' }),
      React.createElement('circle', { cx: 7, cy: 17, r: 2 }),
      React.createElement('circle', { cx: 17, cy: 17, r: 2 })
    );
  }

  if (norm.includes('suv') || norm.includes('pickup')) {
    return React.createElement(
      'svg',
      {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className,
      },
      React.createElement('path', { d: 'M3 13h18l1 3H2l1-3z' }),
      React.createElement('path', { d: 'M5 13l2-6h9l3 6' }),
      React.createElement('line', { x1: 13, y1: 7, x2: 13, y2: 13 }),
      React.createElement('circle', { cx: 7, cy: 16, r: 2.5 }),
      React.createElement('circle', { cx: 17, cy: 16, r: 2.5 })
    );
  }

  if (norm.includes('jeepney') || norm.includes('van')) {
    return React.createElement(
      'svg',
      {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className,
      },
      React.createElement('rect', { x: 2, y: 7, width: 20, height: 9, rx: 1 }),
      React.createElement('line', { x1: 2, y1: 11, x2: 22, y2: 11 }),
      React.createElement('line', { x1: 8, y1: 7, x2: 8, y2: 11 }),
      React.createElement('line', { x1: 14, y1: 7, x2: 14, y2: 11 }),
      React.createElement('circle', { cx: 6, cy: 17, r: 2 }),
      React.createElement('circle', { cx: 18, cy: 17, r: 2 })
    );
  }

  return React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className,
    },
    React.createElement('rect', { x: 1, y: 5, width: 14, height: 10, rx: 1 }),
    React.createElement('path', { d: 'M15 8h4l3 3v4h-7V8z' }),
    React.createElement('circle', { cx: 5, cy: 17, r: 2 }),
    React.createElement('circle', { cx: 10, cy: 17, r: 2 }),
    React.createElement('circle', { cx: 18, cy: 17, r: 2 })
  );
}
