# Tire Shop Kernel Architecture Specification 

> **Course**: ITEC 55 Platform Technologies  
> **Topic**: Operating System Micro-Architecture, CPU Scheduling, Resource Management & Concurrency

---

## 1. System Directory Structure

The codebase is organized into cleanly decoupled layers separating core OS logic, scheduling algorithms, data models, and the user interface:

```
tire-shop-kernel/
├── src/
│   ├── config/
│   │   ├── defaults.ts          # Default vehicle profiles, models, tire catalog, locks
│   │   ├── prng.ts              # Mulberry32 seeded deterministic PRNG
│   │   ├── settingsStorage.ts   # LocalStorage profile persistence, schema & validation
│   │   └── workloads.ts         # Benchmark workloads, rush hour & deadlock scripts
│   ├── kernel/
│   │   ├── deadlockDetector.ts  # Wait-For Graph (WFG) & DFS cycle detector
│   │   ├── inventoryManager.ts  # Shared tire inventory resource pool
│   │   ├── kernel.ts            # Central OS engine, clock ticks & Time Machine
│   │   ├── kernelLog.ts         # Filterable audit logger with boot sequence
│   │   ├── lockManager.ts       # Mutex equipment locks (Changer, Balancer, Register)
│   │   ├── processManager.ts    # PCB table, 5-state lifecycle & queue tracking
│   │   ├── syscalls.ts          # System call interrupt traps & mode elevation
│   │   └── threadManager.ts     # TCB execution, program counters & private stacks
│   ├── models/
│   │   ├── lock.ts              # Mutex Lock interface & waiting queues
│   │   ├── pcb.ts               # Process Control Block & CPU registers
│   │   ├── snapshot.ts          # Simulation snapshot & Gantt blocks
│   │   ├── stateTransitions.ts  # 5-State lifecycle legal transition matrix
│   │   ├── tcb.ts               # Thread Control Block model
│   │   ├── tireStockItem.ts     # Tire inventory item schema
│   │   └── vehicleProfile.ts    # Vehicle profiles & model specifications
│   ├── scheduler/
│   │   ├── fcfs.ts              # First-Come, First-Served strategy
│   │   ├── priority.ts          # Priority strategy with aging mechanism
│   │   ├── roundRobin.ts        # Round Robin preemptive strategy
│   │   ├── scheduler.ts         # Strategy coordinator & dispatcher
│   │   ├── sjf.ts               # Shortest Job First strategy
│   │   └── types.ts             # Strategy interface & scheduling context
│   ├── skin/
│   │   └── dictionary.ts        # OS View <-> Story View translation & SVG icons
│   ├── tests/
│   │   ├── deadlock.test.ts     # WFG cycle detection & recovery tests
│   │   ├── determinism.test.ts  # PRNG & Time Machine rewind tests
│   │   ├── ganttNoOverlap.test.ts # Timeline non-overlap invariant assertions
│   │   ├── inventory.test.ts    # Stock depletion blocking & restock wakeup tests
│   │   ├── lifecycle.test.ts    # 5-state lifecycle transition rejections
│   │   ├── scheduling.test.ts   # Hand-calculated 5-process benchmarks
│   │   ├── settings.test.ts     # Settings validation & persistence tests
│   │   └── stress.test.ts       # 50+ process scale & queue leakage tests
│   ├── ui/
│   │   └── components/          # TopBar, ControlBar, GanttChart, Tables, Modals
│   ├── App.tsx                  # Main application orchestrator
│   ├── index.css                # Tailwind CSS v4, theme tokens & hatch patterns
│   └── main.tsx                 # React DOM mount entry
├── ARCHITECTURE.md
├── package.json
└── README.md
```

---

## 2. Scheduling Metric Mathematical Formulas

The simulator records execution metrics according to standard operating system textbook definitions:

### 1. Turnaround Time ($T_{\text{turnaround}}$)
The elapsed time from the moment an order enters the system (arrives) until it completely finishes and departs:
$$T_{\text{turnaround}} = T_{\text{completion}} - T_{\text{arrival}}$$

### 2. Waiting Time ($T_{\text{waiting}}$)
The total time the process spent waiting in queues (Ready queue or blocked waiting for locks/stock), excluding the time actively executing on the CPU:
$$T_{\text{waiting}} = T_{\text{turnaround}} - T_{\text{totalCpuBurst}}$$
*(Note: As defined in standard operating systems literature, waiting time equals total turnaround time minus the total CPU burst time).*

### 3. Response Time ($T_{\text{response}}$)
The elapsed time from order arrival until the process first gains access to the CPU (Fitting Bay lift):
$$T_{\text{response}} = T_{\text{firstCpuStart}} - T_{\text{arrival}}$$

### 4. CPU Utilization ($\text{Util}_{\text{CPU}}$)
The percentage of elapsed simulation clock ticks that the CPU was actively executing work:
$$\text{Util}_{\text{CPU}} = \left( \frac{T_{\text{totalBusyTicks}}}{T_{\text{clock}}} \right) \times 100\%$$

### 5. Throughput
The rate of completed processes per unit time:
$$\text{Throughput} = \frac{\text{Completed Orders Count}}{T_{\text{clock}}}$$

---

## 3. Process 5-State Lifecycle Matrix

Every process exists in exactly one of five states. State transitions are strictly validated at runtime against the following legal matrix:

```
        ┌───────────────────────────────────────────────┐
        │                                               │
        ▼                                               │
    [ NEW ] ──► [ READY ] ◄──────────────► [ RUNNING ] ─┴─► [ TERMINATED ]
                    ▲                           │
                    │                           ▼
                    └───────────────────── [ WAITING ]
```

### Transition Validity Rules:
| From State | Allowed Target States | Illegal Target States (Rejected & Logged) |
| :--- | :--- | :--- |
| `NEW` | `READY` | `RUNNING`, `WAITING`, `TERMINATED` |
| `READY` | `RUNNING`, `TERMINATED` (Abort) | `NEW`, `WAITING` |
| `RUNNING` | `READY` (Preempt), `WAITING` (I/O/Lock), `TERMINATED` | `NEW` |
| `WAITING` | `READY` (Unblocked), `TERMINATED` (Abort) | `NEW`, `RUNNING` (Must re-enter `READY`) |
| `TERMINATED` | *None (Sink State)* | *All transitions out of `TERMINATED` rejected* |

---

## 4. Mutex Locks & Deadlock Detection

### Mutex Hardware Locks:
1. **Pneumatic Tire Changer** (`lock_tire_changer`): Single-occupancy rim mounting device.
2. **Dynamic Wheel Balancer** (`lock_wheel_balancer`): Single-occupancy harmonic balancing device.
3. **POS Cash Register** (`lock_cash_register`): Single-occupancy transaction terminal.

### Wait-For Graph (WFG) & Cycle Detection:
- The detector constructs a directed graph $G = (V, E)$ where nodes $V$ are active processes (PIDs).
- A directed edge $P_i \to P_j$ is added if process $P_i$ is in `WAITING` state requesting a mutex currently held by process $P_j$.
- Cycle detection executes Depth-First Search (DFS) with a recursion stack.
- When a cycle is detected, the kernel identifies participating PIDs and flags `isDeadlocked = true`.

### Recovery Mechanism:
1. **Abort Victim**: The administrator terminates a participating order (prioritizing the lowest priority or latest arrival), releasing all its held locks and unblocking dependent orders.
2. **Force-Release Mutex**: The administrator forcibly clears the holder of a contested lock, automatically granting the lock to the next order waiting in that lock's queue.

---

## 5. Seeded Determinism & Time Machine

- **PRNG**: Driven by the `Mulberry32` 32-bit generator algorithm. For any integer seed $S$, the sequence of vehicle types, burst durations, and tie-breaks is 100% reproducible.
- **Deep Snapshots**: At every tick, `kernel.captureSnapshot()` deep-clones all PCB tables, registers, queues, locks, and PRNG internal states into a snapshot vector.
- **Time Machine Rewind**: Scrubbing the slider restores the exact snapshot at tick $T$, truncating future Gantt blocks and enabling students to step through edge cases repeatedly.
