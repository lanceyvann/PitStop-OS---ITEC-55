import React, { useState } from 'react';
import {
  BookOpen,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Eye,
  ShieldAlert,
  Cpu,
  Layers,
  Activity,
  Lock,
  Package,
  History,
  Calculator,
  Compass,
  Zap,
} from 'lucide-react';

interface BeginnerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BeginnerGuideModal: React.FC<BeginnerGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  if (!isOpen) return null;

  const chapters = [
    {
      id: 'mapping',
      title: '1. Shop Scenario Mapping',
      icon: Compass,
      subtitle: 'How a tire fitting workshop maps 1:1 to an operating system',
      content: (
        <div className="space-y-4 text-xs text-[#1A1A1A] leading-relaxed">
          <p>
            In <strong>Tire Shop Kernel</strong>, every real-world workshop activity represents a fundamental concept of modern operating systems. The shop sells and fits tires for 5 vehicle categories: <em>Motorcycle, Sedan, SUV/Pickup, Jeepney/Van,</em> and <em>Truck/Bus</em>.
          </p>

          <div className="overflow-x-auto border border-[#E4D9C3] rounded-lg">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#F6EFE0] text-[#1A1A1A] font-semibold border-b border-[#E4D9C3]">
                <tr>
                  <th className="py-2 px-3">Tire Shop Concept (Story View)</th>
                  <th className="py-2 px-3">Operating System Concept (OS View)</th>
                  <th className="py-2 px-3">Simulator Functionality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4D9C3]/60 bg-[#FFFAF0]">
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#CC5500]">Shop Manager’s Desk</td>
                  <td className="py-2 px-3 font-mono">Kernel Core</td>
                  <td className="py-2 px-3">Coordinates clock ticks, syscall traps, and subsystems</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#CC5500]">Sales Counter</td>
                  <td className="py-2 px-3 font-mono">Kernel Mode (Privileged Ring 0)</td>
                  <td className="py-2 px-3">Restricted mode running syscalls and scheduler routines</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#CC5500]">Showroom Lounge</td>
                  <td className="py-2 px-3 font-mono">User Mode (Ring 3)</td>
                  <td className="py-2 px-3">Normal unprivileged customer order execution state</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#CC5500]">Fitting Bay with Lift</td>
                  <td className="py-2 px-3 font-mono">Central Processing Unit (CPU)</td>
                  <td className="py-2 px-3">Single-core servicing unit executing burst instructions</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#CC5500]">Customer Tire Order</td>
                  <td className="py-2 px-3 font-mono">Operating System Process</td>
                  <td className="py-2 px-3">Unique PID, priority, burst plan, and lifecycle state</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#CC5500]">Sales Ticket / Order Slip</td>
                  <td className="py-2 px-3 font-mono">Process Control Block (PCB)</td>
                  <td className="py-2 px-3">Complete process descriptor (registers, burst times, parent PID)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#CC5500]">Staff Task Card</td>
                  <td className="py-2 px-3 font-mono">Thread Control Block (TCB)</td>
                  <td className="py-2 px-3">Sub-tasks (Consult, Mount, Balance, Bill) with private stack</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#CC5500]">Waiting Vehicle Lane</td>
                  <td className="py-2 px-3 font-mono">Ready Queue</td>
                  <td className="py-2 px-3">Vehicles waiting to be dispatched to the fitting bay</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#CC5500]">Waiting for Stock / POS</td>
                  <td className="py-2 px-3 font-mono">WAITING State (I/O & Locks)</td>
                  <td className="py-2 px-3">Processes blocked on restock or contested hardware mutexes</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#CC5500]">Bay Time Slice</td>
                  <td className="py-2 px-3 font-mono">Time Quantum</td>
                  <td className="py-2 px-3">Max consecutive ticks on lift before Round Robin preemption</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#CC5500]">Vehicle Swap on Lift</td>
                  <td className="py-2 px-3 font-mono">Context Switch</td>
                  <td className="py-2 px-3">Saving register state of outgoing process & loading incoming</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#CC5500]">Changer / Balancer / POS</td>
                  <td className="py-2 px-3 font-mono">Mutex Locks</td>
                  <td className="py-2 px-3">Single-occupancy machines subject to mutual exclusion</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#CC5500]">Tire Stock Room</td>
                  <td className="py-2 px-3 font-mono">Shared Resource Pool</td>
                  <td className="py-2 px-3">Counting semaphore-like resource with inventory depletion</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: 'syscalls',
      title: '2. Dual-Mode & System Calls',
      icon: Cpu,
      subtitle: 'Privilege rings, software traps, and kernel service routines',
      content: (
        <div className="space-y-4 text-xs text-[#1A1A1A] leading-relaxed">
          <p>
            An operating system protects hardware and shared memory by enforcing <strong>dual-mode execution</strong>. User programs run in unprivileged User Mode, switching to Kernel Mode only via a <strong>software interrupt (TRAP)</strong> when requesting services.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border border-[#E4D9C3] space-y-1.5">
              <span className="font-bold text-xs text-[#CC5500] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#CC5500]" />
                <span>Kernel Mode (Sales Counter)</span>
              </span>
              <p className="text-[11px] text-[#1A1A1A]/80">
                Privileged execution ring. The CPU has unrestricted access to hardware, memory management, the scheduler, and mutex locks. Indicated by the orange glowing badge in the top bar.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#E4D9C3] space-y-1.5">
              <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-slate-500" />
                <span>User Mode (Customer Lounge)</span>
              </span>
              <p className="text-[11px] text-[#1A1A1A]/80">
                Restricted execution ring. Processes cannot directly manipulate locks or access other processes' memory. They must issue a System Call to request shop services.
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#F6EFE0] rounded-lg border border-[#E4D9C3] space-y-2">
            <span className="font-bold text-xs text-[#1A1A1A] block">Available System Calls in Simulator:</span>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
              <li className="p-2 bg-white rounded border border-[#E4D9C3]/70">
                <strong className="text-[#CC5500]">sys_create_process()</strong>
                <span className="block text-[10px] text-[#1A1A1A]/70 font-sans">Allocates PCB and admits customer order into Ready queue.</span>
              </li>
              <li className="p-2 bg-white rounded border border-[#E4D9C3]/70">
                <strong className="text-[#CC5500]">sys_terminate_process()</strong>
                <span className="block text-[10px] text-[#1A1A1A]/70 font-sans">Reclaims locks, stock reservations, records turnaround metrics, and frees PCB.</span>
              </li>
              <li className="p-2 bg-white rounded border border-[#E4D9C3]/70">
                <strong className="text-[#CC5500]">sys_acquire_lock(lockId)</strong>
                <span className="block text-[10px] text-[#1A1A1A]/70 font-sans">Requests mutual exclusion on Changer, Balancer, or POS Cash Register.</span>
              </li>
              <li className="p-2 bg-white rounded border border-[#E4D9C3]/70">
                <strong className="text-[#CC5500]">sys_release_lock(lockId)</strong>
                <span className="block text-[10px] text-[#1A1A1A]/70 font-sans">Unlocks machine and wakes up highest-priority waiting process.</span>
              </li>
              <li className="p-2 bg-white rounded border border-[#E4D9C3]/70">
                <strong className="text-[#CC5500]">sys_io_request()</strong>
                <span className="block text-[10px] text-[#1A1A1A]/70 font-sans">Relinquishes CPU to wait for tire delivery, wheel balancing, or invoice payment.</span>
              </li>
              <li className="p-2 bg-white rounded border border-[#E4D9C3]/70">
                <strong className="text-[#CC5500]">sys_yield()</strong>
                <span className="block text-[10px] text-[#1A1A1A]/70 font-sans">Voluntarily yields CPU fitting bay back to ready queue.</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'lifecycle',
      title: '3. 5-State Process Lifecycle',
      icon: Activity,
      subtitle: 'State transition table, illegal transitions, and PCB registers',
      content: (
        <div className="space-y-4 text-xs text-[#1A1A1A] leading-relaxed">
          <p>
            Every customer order follows the textbook 5-state process lifecycle enforced by a transition table:
          </p>

          <div className="p-3 bg-white rounded-lg border border-[#E4D9C3] flex items-center justify-between flex-wrap gap-2 text-center text-[11px] font-mono">
            <span className="px-3 py-1.5 rounded bg-[#8A7F6B] text-white font-bold">NEW</span>
            <span className="text-[#1A1A1A]/40 font-bold">➔</span>
            <span className="px-3 py-1.5 rounded bg-[#D9A441] text-white font-bold">READY</span>
            <span className="text-[#1A1A1A]/40 font-bold">⇄</span>
            <span className="px-3 py-1.5 rounded bg-[#CC5500] text-white font-bold">RUNNING</span>
            <span className="text-[#1A1A1A]/40 font-bold">⇄</span>
            <span className="px-3 py-1.5 rounded bg-[#5B6C7A] text-white font-bold">WAITING</span>
            <span className="text-[#1A1A1A]/40 font-bold">➔</span>
            <span className="px-3 py-1.5 rounded bg-[#2B2B2B] text-white font-bold">TERMINATED</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 bg-[#F6EFE0] rounded-lg border border-[#E4D9C3] space-y-1">
              <span className="font-bold text-[#CC5500] block">Legal Transitions:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                <li><code>NEW ➔ READY</code>: Customer order registered and vehicle arrives at lane.</li>
                <li><code>READY ➔ RUNNING</code>: Scheduler dispatches vehicle to fitting bay lift.</li>
                <li><code>RUNNING ➔ READY</code>: Preempted by quantum expiration or higher priority.</li>
                <li><code>RUNNING ➔ WAITING</code>: Blocked on I/O, missing tire stock, or mutex lock.</li>
                <li><code>WAITING ➔ READY</code>: I/O completes, stock delivered, or lock acquired.</li>
                <li><code>RUNNING ➔ TERMINATED</code>: All burst stages completed; tires fitted and paid.</li>
              </ul>
            </div>

            <div className="p-3 bg-[#FFF5F5] rounded-lg border border-[#B3261E]/30 space-y-1 text-[#7F1D1D]">
              <span className="font-bold block">Illegal Transitions (Rejected by Kernel):</span>
              <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                <li><code>READY ➔ WAITING</code>: Cannot block without first executing instructions!</li>
                <li><code>TERMINATED ➔ *</code>: Cannot resurrect a departed order.</li>
                <li><code>NEW ➔ RUNNING</code>: Must pass through the Ready queue first.</li>
                <li><code>WAITING ➔ RUNNING</code>: Must re-enter Ready queue to be scheduled.</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-[#E4D9C3] space-y-1.5">
            <span className="font-bold text-xs text-[#1A1A1A] block">Process Control Block (PCB) Contents:</span>
            <p className="text-[11px] text-[#1A1A1A]/80">
              Each PCB contains: PID, Name, Vehicle Type, Tire Spec, Lifecycle State, Priority, Arrival Time, Burst Plan, Remaining Burst, and simulated hardware registers:
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] font-mono">
              <span className="px-2 py-1 bg-[#F6EFE0] rounded border border-[#E4D9C3]">PC (Program Counter)</span>
              <span className="px-2 py-1 bg-[#F6EFE0] rounded border border-[#E4D9C3]">SP (Stack Pointer)</span>
              <span className="px-2 py-1 bg-[#F6EFE0] rounded border border-[#E4D9C3]">AX (Accumulator: Burst Progress)</span>
              <span className="px-2 py-1 bg-[#F6EFE0] rounded border border-[#E4D9C3]">BX (Tire Stock Count)</span>
              <span className="px-2 py-1 bg-[#F6EFE0] rounded border border-[#E4D9C3]">CX (Thread Counter)</span>
              <span className="px-2 py-1 bg-[#F6EFE0] rounded border border-[#E4D9C3]">DX (Lock Status Bitmask)</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'scheduling',
      title: '4. Scheduling Algorithms & Math',
      icon: Calculator,
      subtitle: 'FCFS, SJF, Round Robin, Priority with Aging, and metric formulas',
      content: (
        <div className="space-y-4 text-xs text-[#1A1A1A] leading-relaxed">
          <p>
            The scheduler selects which waiting vehicle from the Ready queue gets the Fitting Bay lift next:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 bg-white rounded-lg border border-[#E4D9C3] space-y-1">
              <strong className="text-[#CC5500]">1. First-Come, First-Served (FCFS)</strong>
              <p className="text-[10px] text-[#1A1A1A]/80">
                Non-preemptive FIFO queue. Simple, but vulnerable to the <em>Convoy Effect</em> where a large Truck (28 ticks) delays a quick Motorcycle (2 ticks).
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#E4D9C3] space-y-1">
              <strong className="text-[#CC5500]">2. Shortest Job First (SJF)</strong>
              <p className="text-[10px] text-[#1A1A1A]/80">
                Chooses the order with the shortest remaining CPU burst. Mathematically minimizes average waiting time across all orders.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#E4D9C3] space-y-1">
              <strong className="text-[#CC5500]">3. Round Robin (RR)</strong>
              <p className="text-[10px] text-[#1A1A1A]/80">
                Preemptive time slicing. Each vehicle receives up to <em>q</em> ticks on the lift before being placed back at the tail of the waiting lane.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#E4D9C3] space-y-1">
              <strong className="text-[#CC5500]">4. Priority Scheduling with Aging</strong>
              <p className="text-[10px] text-[#1A1A1A]/80">
                Prioritizes fleet and rush orders (1 = lowest, 5 = rush). To prevent starvation of low-priority vehicles, <em>Aging</em> increments priority by +1 for every 5 ticks spent waiting.
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#F6EFE0] rounded-lg border border-[#E4D9C3] space-y-2">
            <span className="font-bold text-xs text-[#1A1A1A] block">Documented Performance Metric Formulas:</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 bg-white rounded border border-[#E4D9C3]">
                <span className="text-[#CC5500] font-bold block">Turnaround Time:</span>
                <code>Turnaround = Completion Time - Arrival Time</code>
              </div>
              <div className="p-2 bg-white rounded border border-[#E4D9C3]">
                <span className="text-[#CC5500] font-bold block">Waiting Time:</span>
                <code>Waiting = Turnaround Time - Total CPU Burst</code>
              </div>
              <div className="p-2 bg-white rounded border border-[#E4D9C3]">
                <span className="text-[#CC5500] font-bold block">Response Time:</span>
                <code>Response = First CPU Start Time - Arrival Time</code>
              </div>
              <div className="p-2 bg-white rounded border border-[#E4D9C3]">
                <span className="text-[#CC5500] font-bold block">CPU Utilization %:</span>
                <code>Utilization = (Busy Ticks / Total Ticks) * 100</code>
              </div>
            </div>
            <p className="text-[10px] text-[#1A1A1A]/70 italic">
              *Tie-breaking rule everywhere: Earlier Arrival Time first, then Lower PID number.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'locks',
      title: '5. Mutexes & Deadlock (WFG)',
      icon: Lock,
      subtitle: 'Exclusive workshop equipment, circular wait, and recovery tools',
      content: (
        <div className="space-y-4 text-xs text-[#1A1A1A] leading-relaxed">
          <p>
            The shop has 3 single-occupancy machines that cannot be shared simultaneously:
          </p>

          <ul className="list-disc list-inside space-y-1 text-[11px]">
            <li><strong>Pneumatic Tire Changer (0x01)</strong>: Required when bead-mounting tires to rims.</li>
            <li><strong>Dynamic Wheel Balancer (0x02)</strong>: Required for spin-balancing assembled wheels.</li>
            <li><strong>POS Cash Register (0x03)</strong>: Required for billing and card authorization.</li>
          </ul>

          <div className="p-3 bg-[#FFF5F5] border border-[#B3261E]/30 rounded-lg space-y-2 text-[#7F1D1D]">
            <span className="font-bold text-xs flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#B3261E]" />
              <span>Deadlock & The 4 Coffman Conditions:</span>
            </span>
            <p className="text-[11px]">
              A deadlock occurs when all 4 conditions are satisfied simultaneously:
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-[10px]">
              <li><strong>Mutual Exclusion</strong>: Only 1 order can use the machine at a time.</li>
              <li><strong>Hold and Wait</strong>: An order holds one machine while requesting another.</li>
              <li><strong>No Preemption</strong>: Machines cannot be forcefully confiscated from customers.</li>
              <li><strong>Circular Wait</strong>: Order A holds Changer & needs Balancer; Order B holds Balancer & needs Changer!</li>
            </ol>
          </div>

          <div className="p-3 bg-white rounded-lg border border-[#E4D9C3] space-y-2">
            <span className="font-bold text-xs text-[#1A1A1A] block">Deadlock Detection & Recovery in Simulator:</span>
            <p className="text-[11px] text-[#1A1A1A]/80">
              The engine builds a live <strong>Wait-For Graph (WFG)</strong> where edges represent <code>Process ➔ Lock ➔ Holding Process</code>. Depth-First Search (DFS) detects cycles and flashes the red Deadlock Alert Banner.
            </p>
            <div className="flex gap-2">
              <div className="flex-1 p-2 bg-[#F6EFE0] rounded border border-[#E4D9C3]">
                <strong className="text-[#CC5500] text-[11px] block">Recovery Action 1: Abort Victim</strong>
                <span className="text-[10px] text-[#1A1A1A]/70">Terminates the selected process and releases all its held equipment.</span>
              </div>
              <div className="flex-1 p-2 bg-[#F6EFE0] rounded border border-[#E4D9C3]">
                <strong className="text-[#CC5500] text-[11px] block">Recovery Action 2: Force-Release Lock</strong>
                <span className="text-[10px] text-[#1A1A1A]/70">Preempts the lock and grants it to the waiting order, breaking circular wait.</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'inventory',
      title: '6. Shared Tire Stockroom',
      icon: Package,
      subtitle: 'Resource allocation, out-of-stock blocking, and supplier delivery',
      content: (
        <div className="space-y-4 text-xs text-[#1A1A1A] leading-relaxed">
          <p>
            The <strong>Tire Stockroom</strong> is a shared resource pool functioning similarly to a <strong>counting semaphore</strong>.
          </p>

          <div className="p-3 bg-white rounded-lg border border-[#E4D9C3] space-y-2 text-[11px]">
            <span className="font-bold text-[#CC5500] block">Resource Allocation Protocol:</span>
            <ul className="list-disc list-inside space-y-1 text-[#1A1A1A]/80">
              <li>When a customer arrives, they request tires of a specific brand, model, and size (e.g. Michelin Pilot Sport 205/55R16).</li>
              <li>If sufficient stock exists, the stock counter is decremented and reserved.</li>
              <li>If the item is <strong>out of stock (count = 0)</strong>, the order cannot run and is moved to the <strong>WAITING queue</strong> with the status: <em>"Waiting for Tire Delivery"</em>.</li>
              <li>Clicking the <strong>"+10 Restock"</strong> button on the inventory item simulates a supplier truck delivery, immediately waking up all blocked orders and transitioning them to <strong>READY</strong>!</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'missions',
      title: '7. Simulator Lab Missions',
      icon: Zap,
      subtitle: 'Hands-on practice missions to master operating systems concepts',
      content: (
        <div className="space-y-4 text-xs text-[#1A1A1A] leading-relaxed">
          <p>
            Put your learning into practice! Try these 4 student missions directly in the simulator:
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-white rounded-lg border border-[#E4D9C3] space-y-1">
              <span className="font-bold text-xs text-[#CC5500] block">Mission 1: Observe the Convoy Effect</span>
              <p className="text-[11px] text-[#1A1A1A]/80">
                Set the strategy to <strong>FCFS</strong>. Add a Truck order (CPU 24) arriving at T=0, followed by 3 Motorcycle orders (CPU 2). Observe how the motorcycles wait over 20 ticks. Now switch to <strong>SJF</strong> and reset: see average waiting time drop significantly!
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#E4D9C3] space-y-1">
              <span className="font-bold text-xs text-[#CC5500] block">Mission 2: Break a Real Deadlock</span>
              <p className="text-[11px] text-[#1A1A1A]/80">
                Click <strong>"Deadlock Demo"</strong> on the control bar. Observe the red banner showing the Wait-For Graph cycle. Try both recovery methods: <em>Abort Victim</em> vs <em>Force Release Lock</em>. Check the audit log to see the syscall trap!
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#E4D9C3] space-y-1">
              <span className="font-bold text-xs text-[#CC5500] block">Mission 3: Master the Time Machine</span>
              <p className="text-[11px] text-[#1A1A1A]/80">
                Click <strong>"Rush Hour"</strong>, run for 15 ticks, then pause. Use the <strong>Time Machine Scrubber</strong> to scrub back to Tick #5. Notice how all queues, locks, and bay states preview tick #5 in real time! Click <em>"Resume Simulation From Tick #5"</em> to branch history!
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#E4D9C3] space-y-1">
              <span className="font-bold text-xs text-[#CC5500] block">Mission 4: Run the Algorithm Benchmark</span>
              <p className="text-[11px] text-[#1A1A1A]/80">
                Click <strong>"Benchmark"</strong> to run all 4 algorithms across 3 standardized workloads (CPU-heavy, I/O-heavy, balanced). Inspect which algorithm achieves highest throughput and export the CSV report!
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = chapters[activeTab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#FFFAF0] rounded-xl shadow-2xl border border-[#E4D9C3] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3.5 bg-[#F6EFE0] border-b border-[#E4D9C3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#CC5500] text-white flex items-center justify-center font-bold text-base shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-[#1A1A1A]">
                Tire Shop Kernel — Comprehensive Student & Lab Guide
              </h2>
              <p className="text-xs text-[#1A1A1A]/60">
                ITEC 55 Platform Technologies · Operating System Theory in Workshop Metaphor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close comprehensive guide"
            className="p-1.5 rounded-lg border border-[#1A1A1A]/20 hover:bg-white text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: 2-column sidebar navigation & chapter content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chapter Navigation Sidebar */}
          <nav className="w-64 bg-[#F6EFE0]/60 border-r border-[#E4D9C3] p-3 flex flex-col gap-1 overflow-y-auto">
            <span className="text-[10px] uppercase font-bold text-[#1A1A1A]/50 tracking-wider px-2 py-1">
              Course Modules
            </span>
            {chapters.map((ch, idx) => {
              const Icon = ch.icon;
              const isActive = idx === activeTab;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#CC5500] text-white shadow-xs'
                      : 'text-[#1A1A1A]/80 hover:bg-[#FFFAF0] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#CC5500]'}`} />
                  <span className="truncate">{ch.title}</span>
                </button>
              );
            })}
          </nav>

          {/* Chapter Content Area */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col">
            <div className="border-b border-[#E4D9C3] pb-3 mb-4">
              <h3 className="font-display font-bold text-lg text-[#1A1A1A]">
                {current.title}
              </h3>
              <p className="text-xs text-[#1A1A1A]/60 mt-0.5">
                {current.subtitle}
              </p>
            </div>

            <div className="flex-1">{current.content}</div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-3 bg-[#F6EFE0] border-t border-[#E4D9C3] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span>Module {activeTab + 1} of {chapters.length}</span>
            <span>·</span>
            <span className="font-mono">{current.title}</span>
          </div>

          <div className="flex items-center gap-2">
            {activeTab > 0 && (
              <button
                onClick={() => setActiveTab(activeTab - 1)}
                className="flex items-center gap-1 px-3 py-1.5 border border-[#1A1A1A]/30 rounded-lg font-medium hover:bg-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous Module</span>
              </button>
            )}

            {activeTab < chapters.length - 1 ? (
              <button
                onClick={() => setActiveTab(activeTab + 1)}
                className="flex items-center gap-1 px-4 py-1.5 bg-[#CC5500] hover:bg-[#A84500] text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Next Module</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-1 px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Close & Return to Simulator</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
