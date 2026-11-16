# Tire Shop Kernel 

> **A GUI-based Operating System Simulator for ITEC 55 (Platform Technologies)**  
> University Course Project mapping Tire Retail & Fitting Shop Operations to Core Operating System Concepts.

---

## 🛠️ Prerequisites & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Package Manager**: `npm` (v9+)

### Exact Setup Commands

```bash
# 1. Install dependencies
npm install

# 2. Start development server (Port 3000)
npm run dev

# 3. Execute unit test suite (Vitest)
npm test

# 4. Compile & build production bundle
npm run build
```

---

## The Scenario Metaphor (Shop View ⇄ OS View)

Every workshop operation in the tire retail store maps 1:1 to a fundamental operating system construct:

| Shop Concept | Operating System Concept | Description |
| :--- | :--- | :--- |
| **Shop Manager's Desk** | Kernel Core | Central controller managing memory, dispatching, and equipment. |
| **Sales Counter / Office** | Kernel Mode (Privileged) | Privileged execution state handling system calls & interrupts. |
| **Showroom / Waiting Lounge** | User Mode (Restricted) | Unprivileged customer state before bay entry. |
| **Fitting Bay with Hydraulic Lift** | Central Processing Unit (CPU) | Single active execution slot where tires are fitted onto vehicles. |
| **Customer Tire Order** | Process | Independent unit of work with private registers and PCB. |
| **Sales Ticket / Order Slip** | Process Control Block (PCB) | Data structure holding PID, state, vehicle type, and burst plan. |
| **Staff Task (Mount, Balance, Bill)** | Thread | Lightweight execution stream within an order. |
| **Mechanic Task Card** | Thread Control Block (TCB) | Tracking record for task PC and private stack. |
| **Waiting Vehicle Lane** | Ready Queue | Queue of orders eligible to run on the CPU. |
| **Customer On Hydraulic Lift** | `RUNNING` State | Active process executing its CPU burst segment. |
| **Awaiting Stock / Balancer / POS** | `WAITING` State | Blocked process waiting on I/O, mutex lock, or tire replenishment. |
| **Customer Leaves with New Tires** | `TERMINATED` State | Finished process; all locks, lift, and memory freed. |
| **Bay Lift Time Allocation** | Time Quantum | Maximum continuous execution duration in Round Robin. |
| **Vehicle Swap on Lift** | Context Switch | State save of current vehicle, restoring the next vehicle's PCB. |
| **Fleet / Express Commuter Order** | High Priority | Priority process with expedited bay scheduling. |
| **Tire Changer, Balancer, Register** | Mutex Hardware Locks | Mutual exclusion devices allowing only one order at a time. |
| **Tire Stock Room Inventory** | Shared Resource Pool | Shared semaphore counters for tire sizes and brands. |

---

## Key Features

1. **Dual View Toggle**: Switch instantly between **Story View** (tire workshop terminology) and **OS View** (standard operating system terminology) without altering runtime state.
2. **Four Scheduling Strategies**:
   - **FCFS**: First-Come, First-Served (non-preemptive, arrival tie-break).
   - **SJF**: Shortest Job First (non-preemptive, shortest remaining CPU burst).
   - **Round Robin**: Time-sliced execution with configurable quantum.
   - **Priority Scheduling**: Priority-based preemption with optional **Aging** (+1 priority per 5 waiting ticks).
3. **Interactive Gantt Chart**:
   - Single-unit ruler with bold markers every 5 ticks.
   - Distinct hatch patterns for `WAITING` and `DEADLOCK`.
   - Context switch diamond indicators on the time axis.
   - Live "now" line, zoom controls, and click-to-explain **"Why?"** modal.
4. **Time Machine Scrubber**:
   - Deep snapshots taken at every single clock tick.
   - Rewind to any past tick T and resume playback deterministically.
5. **Deadlock Detection & Recovery**:
   - Wait-For Graph (WFG) cycle detection.
   - Scripted "Deadlock Demo" (Order A holds Tire Changer, wants Balancer; Order B holds Balancer, wants Changer).
   - Recovery tools: **Abort Victim Process** or **Force-Release Mutex**.
6. **Shared Tire Inventory & Supplier Restock**:
   - Live catalog with stock and reservation counters.
   - Out-of-stock orders block into `WAITING` until supplier delivery occurs.
7. **Rush Hour Generator & Benchmark Suite**:
   - Burst generator driven by seeded `Mulberry32` PRNG.
   - Benchmark matrix running 4 algorithms against 3 workloads (CPU-heavy, I/O-heavy, balanced) with CSV export.
8. **Shop Settings & Profile Management**:
   - Add, edit, and delete vehicle types, vehicle models, and tire catalog items.
   - Form validation (no negative values, min $\le$ max).
   - Persistent `localStorage` with a **"Reset to Defaults"** option.
9. **Beginner Walkthrough Guide**:
   - Step-by-step onboarding walkthrough accessible via the `?` button.

---

## Running Unit Tests

The test suite runs with **Vitest**:

```bash
npm test
```

Test coverage includes:
- Hand-computed 5-process scheduling verification (FCFS, SJF, RR, Priority) with exact arithmetic.
- 5-state lifecycle transition matrix and rejection of illegal transitions.
- Deadlock detection cycle identification and recovery.
- Shared stock depletion blocking and supplier restock unblocking.
- PRNG Mulberry32 determinism and Time Machine rewind equality.
- 50+ process scale and stress tests with zero queue leakage.
- Gantt chart non-overlap invariant assertions.
- User profile settings validation and localStorage persistence.
