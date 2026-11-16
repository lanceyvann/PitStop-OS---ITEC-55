/**
 * @file workloads.ts
 * @description Standardized, deterministic workload generators for benchmarks and testing.
 * Uses seeded PRNG to ensure that benchmark runs are strictly reproducible.
 */

import { PCB, BurstSegment } from '../models/pcb';
import { Mulberry32 } from './prng';
import { DEFAULT_VEHICLE_PROFILES, DEFAULT_VEHICLE_MODELS, DEFAULT_TIRE_CATALOG, COLOR_PALETTE } from './defaults';
import { LockId } from '../models/lock';

export interface WorkloadOrderConfig {
  pid: number;
  name: string;
  vehicleTypeId: string;
  modelId: string;
  tireSpec: string;
  tireCount: number;
  priority: number;
  arrivalTime: number;
  burstPlan: BurstSegment[];
  parentPid?: number | null;
}

/**
 * Creates alternating CPU/IO burst segments based on vehicle profile and scaling.
 */
export function generateBurstPlan(
  tires: number,
  cpuMin: number,
  cpuMax: number,
  ioMin: number,
  ioMax: number,
  prng: Mulberry32
): BurstSegment[] {
  // Plan structure:
  // 1. Consultation & Inspection (CPU)
  // 2. Stockroom Tire Retrieval (I/O - requires stock)
  // 3. Dismounting & Rim Prep (CPU)
  // 4. Bead Seating & Inflation on Tire Changer (CPU - requires lock_tire_changer)
  // 5. Dynamic Spin Balancing (CPU - requires lock_wheel_balancer)
  // 6. POS Invoicing & Payment (I/O - requires lock_cash_register)
  // 7. Final Torque Wrench Lug Inspection (CPU)

  const cpuConsult = Math.max(1, Math.round(prng.range(cpuMin, Math.min(cpuMin + 1, cpuMax)) * 0.3));
  const ioStock = Math.max(1, prng.range(ioMin, ioMax));
  const cpuMount = Math.max(2, Math.round(tires * 1.5) + prng.range(0, 1));
  const cpuBalance = Math.max(1, tires + prng.range(0, 1));
  const ioPayment = Math.max(1, prng.range(ioMin, Math.min(ioMin + 2, ioMax)));
  const cpuFinal = Math.max(1, Math.round(tires * 0.5));

  return [
    {
      id: 'seg_1',
      type: 'CPU',
      duration: cpuConsult,
      remaining: cpuConsult,
      label: 'Consultation & Tread Depth Scan',
    },
    {
      id: 'seg_2',
      type: 'IO',
      duration: ioStock,
      remaining: ioStock,
      label: 'Stockroom Tire Retrieval',
      requiresStock: true,
    },
    {
      id: 'seg_3',
      type: 'CPU',
      duration: cpuMount,
      remaining: cpuMount,
      label: 'Bead Mounting on Tire Changer',
      requiredLock: 'lock_tire_changer',
    },
    {
      id: 'seg_4',
      type: 'CPU',
      duration: cpuBalance,
      remaining: cpuBalance,
      label: 'Spin Balancing on Wheel Balancer',
      requiredLock: 'lock_wheel_balancer',
    },
    {
      id: 'seg_5',
      type: 'IO',
      duration: ioPayment,
      remaining: ioPayment,
      label: 'POS Invoice Checkout',
      requiredLock: 'lock_cash_register',
    },
    {
      id: 'seg_6',
      type: 'CPU',
      duration: cpuFinal,
      remaining: cpuFinal,
      label: 'Torque Wrench Lug Tightening',
    },
  ];
}

/**
 * Builds a fresh PCB from order configuration.
 */
export function buildPCB(cfg: WorkloadOrderConfig, colorIdx: number): PCB {
  const totalCpu = cfg.burstPlan.reduce((acc, s) => acc + (s.type === 'CPU' ? s.duration : 0), 0);
  const totalIo = cfg.burstPlan.reduce((acc, s) => acc + (s.type === 'IO' ? s.duration : 0), 0);

  return {
    pid: cfg.pid,
    name: cfg.name,
    vehicleType: cfg.vehicleTypeId,
    modelName: cfg.modelId,
    tireSpec: cfg.tireSpec,
    tireCount: cfg.tireCount,
    state: 'NEW',
    priority: cfg.priority,
    basePriority: cfg.priority,
    agingBoost: 0,
    arrivalTime: cfg.arrivalTime,
    burstPlan: JSON.parse(JSON.stringify(cfg.burstPlan)),
    currentSegmentIndex: 0,
    totalCpuBurst: totalCpu,
    totalIoBurst: totalIo,
    remainingCpuTime: totalCpu,
    registers: {
      PC: 0x0010,
      SP: 0x7FFF,
      AX: cfg.tireCount,
      BX: cfg.tireCount * 110, // Torque setting in Nm
      CX: 0,
      DX: cfg.pid * 100,
    },
    parentPid: cfg.parentPid ?? null,
    childrenPids: [],
    threads: [
      {
        tid: `${cfg.pid}-t1`,
        ownerPid: cfg.pid,
        name: 'Lead Mechanic',
        role: 'mount',
        state: 'READY',
        pc: 1,
        privateStack: ['mount_bead()', 'set_psi(36)'],
        heldLocks: [],
      },
      {
        tid: `${cfg.pid}-t2`,
        ownerPid: cfg.pid,
        name: 'Service Advisor',
        role: 'bill',
        state: 'READY',
        pc: 0,
        privateStack: ['create_invoice()'],
        heldLocks: [],
      },
    ],
    firstCpuTime: null,
    completionTime: null,
    waitingTime: 0,
    turnaroundTime: 0,
    responseTime: 0,
    heldLocks: [],
    waitingForLock: null,
    waitingForStock: null,
    color: COLOR_PALETTE[colorIdx % COLOR_PALETTE.length],
  };
}

/**
 * Generates synthetic benchmark workloads.
 */
export function createBenchmarkWorkload(
  type: 'cpu-heavy' | 'io-heavy' | 'balanced',
  seed: number = 42
): PCB[] {
  const prng = new Mulberry32(seed);
  const pcbs: PCB[] = [];
  const count = type === 'balanced' ? 20 : 15;

  for (let i = 1; i <= count; i++) {
    let vProfile = prng.choice(DEFAULT_VEHICLE_PROFILES);
    if (type === 'cpu-heavy') {
      // Favor Truck, Bus, SUV
      const heavy = DEFAULT_VEHICLE_PROFILES.filter((p) => p.tires >= 4);
      vProfile = prng.choice(heavy);
    } else if (type === 'io-heavy') {
      // Favor Jeepney, Fleet, Long IO
      const ioHeavy = DEFAULT_VEHICLE_PROFILES.filter((p) => p.ioRange[1] >= 4);
      vProfile = prng.choice(ioHeavy);
    }

    const modelsForType = DEFAULT_VEHICLE_MODELS.filter((m) => m.vehicleTypeId === vProfile.id);
    const model = modelsForType.length > 0 ? prng.choice(modelsForType) : DEFAULT_VEHICLE_MODELS[0];
    const tire = DEFAULT_TIRE_CATALOG.find((t) => t.size === model.tireSpec) || DEFAULT_TIRE_CATALOG[0];

    const arrival = type === 'balanced' ? Math.floor((i - 1) * 1.5) : Math.floor((i - 1) * 2);

    let cpuMultiplier = type === 'cpu-heavy' ? 1.6 : 1.0;
    let ioMultiplier = type === 'io-heavy' ? 2.0 : 1.0;

    const cpuMin = Math.round(vProfile.cpuRange[0] * cpuMultiplier);
    const cpuMax = Math.round(vProfile.cpuRange[1] * cpuMultiplier);
    const ioMin = Math.round(vProfile.ioRange[0] * ioMultiplier);
    const ioMax = Math.round(vProfile.ioRange[1] * ioMultiplier);

    const burstPlan = generateBurstPlan(model.tireCount, cpuMin, cpuMax, ioMin, ioMax, prng);

    const cfg: WorkloadOrderConfig = {
      pid: i,
      name: `${vProfile.name} Order #${i}`,
      vehicleTypeId: vProfile.id,
      modelId: model.name,
      tireSpec: tire.size,
      tireCount: model.tireCount,
      priority: vProfile.defaultPriority,
      arrivalTime: arrival,
      burstPlan,
    };

    pcbs.push(buildPCB(cfg, i - 1));
  }

  return pcbs;
}

/**
 * Generates a burst of Rush Hour arrivals starting at currentClock.
 */
export function generateRushHourArrivals(
  startPid: number,
  currentClock: number,
  seed: number = Date.now()
): PCB[] {
  const prng = new Mulberry32(seed);
  const count = prng.range(5, 8);
  const rushList: PCB[] = [];

  for (let i = 0; i < count; i++) {
    const pid = startPid + i;
    const vProfile = prng.choice(DEFAULT_VEHICLE_PROFILES);
    const modelsForType = DEFAULT_VEHICLE_MODELS.filter((m) => m.vehicleTypeId === vProfile.id);
    const model = modelsForType.length > 0 ? prng.choice(modelsForType) : DEFAULT_VEHICLE_MODELS[0];
    const tire = DEFAULT_TIRE_CATALOG.find((t) => t.size === model.tireSpec) || DEFAULT_TIRE_CATALOG[0];

    // Clustered arrivals over 0 to 3 ticks
    const arrival = currentClock + prng.range(0, 3);
    const burstPlan = generateBurstPlan(
      model.tireCount,
      vProfile.cpuRange[0],
      vProfile.cpuRange[1],
      vProfile.ioRange[0],
      vProfile.ioRange[1],
      prng
    );

    const cfg: WorkloadOrderConfig = {
      pid,
      name: `Rush ${vProfile.name} #${pid}`,
      vehicleTypeId: vProfile.id,
      modelId: model.name,
      tireSpec: tire.size,
      tireCount: model.tireCount,
      priority: vProfile.defaultPriority + prng.range(1, 2), // Rush surcharge priority
      arrivalTime: arrival,
      burstPlan,
    };

    rushList.push(buildPCB(cfg, pid));
  }

  return rushList;
}

/**
 * Creates the classic scripted Deadlock scenario:
 * Order A (PID 101) holds Tire Changer, wants Wheel Balancer.
 * Order B (PID 102) holds Wheel Balancer, wants Tire Changer.
 */
export function createDeadlockScenario(): {
  orders: PCB[];
  locksSetup: { lockId: LockId; heldByPid: number }[];
} {
  const pcbA: PCB = {
    pid: 101,
    name: 'Order A (Sedan / Fleet A)',
    vehicleType: 'sedan',
    modelName: 'Toyota Vios Fleet',
    tireSpec: '185/60 R15',
    tireCount: 4,
    state: 'WAITING',
    priority: 6,
    basePriority: 6,
    agingBoost: 0,
    arrivalTime: 0,
    burstPlan: [
      {
        id: 'da_1',
        type: 'CPU',
        duration: 4,
        remaining: 4,
        label: 'Tire Changer Rim Fit (Holds Changer)',
        requiredLock: 'lock_tire_changer',
      },
      {
        id: 'da_2',
        type: 'CPU',
        duration: 4,
        remaining: 4,
        label: 'Dynamic Balancer Spin (Needs Balancer)',
        requiredLock: 'lock_wheel_balancer',
      },
    ],
    currentSegmentIndex: 1, // Ready to request second lock
    totalCpuBurst: 8,
    totalIoBurst: 0,
    remainingCpuTime: 4,
    registers: { PC: 0x0040, SP: 0x7FFF, AX: 4, BX: 110, CX: 1, DX: 1010 },
    parentPid: null,
    childrenPids: [],
    threads: [],
    firstCpuTime: 0,
    completionTime: null,
    waitingTime: 0,
    turnaroundTime: 0,
    responseTime: 0,
    heldLocks: ['lock_tire_changer'],
    waitingForLock: 'lock_wheel_balancer',
    waitingForStock: null,
    color: '#CC5500',
  };

  const pcbB: PCB = {
    pid: 102,
    name: 'Order B (SUV / Delivery B)',
    vehicleType: 'suv',
    modelName: 'Ford Ranger Cargo',
    tireSpec: '265/65 R17',
    tireCount: 4,
    state: 'WAITING',
    priority: 7,
    basePriority: 7,
    agingBoost: 0,
    arrivalTime: 0,
    burstPlan: [
      {
        id: 'db_1',
        type: 'CPU',
        duration: 4,
        remaining: 4,
        label: 'Dynamic Balancer Spin (Holds Balancer)',
        requiredLock: 'lock_wheel_balancer',
      },
      {
        id: 'db_2',
        type: 'CPU',
        duration: 4,
        remaining: 4,
        label: 'Tire Changer Rim Fit (Needs Changer)',
        requiredLock: 'lock_tire_changer',
      },
    ],
    currentSegmentIndex: 1, // Ready to request second lock
    totalCpuBurst: 8,
    totalIoBurst: 0,
    remainingCpuTime: 4,
    registers: { PC: 0x0044, SP: 0x7F00, AX: 4, BX: 140, CX: 2, DX: 1020 },
    parentPid: null,
    childrenPids: [],
    threads: [],
    firstCpuTime: 0,
    completionTime: null,
    waitingTime: 0,
    turnaroundTime: 0,
    responseTime: 0,
    heldLocks: ['lock_wheel_balancer'],
    waitingForLock: 'lock_tire_changer',
    waitingForStock: null,
    color: '#0284C7',
  };

  return {
    orders: [pcbA, pcbB],
    locksSetup: [
      { lockId: 'lock_tire_changer', heldByPid: 101 },
      { lockId: 'lock_wheel_balancer', heldByPid: 102 },
    ],
  };
}
