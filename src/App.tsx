import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Kernel } from './kernel/kernel';
import { AlgorithmType } from './scheduler/types';
import { PCB } from './models/pcb';
import { GanttBlock } from './models/snapshot';
import { LockId } from './models/lock';
import { ViewMode } from './skin/dictionary';
import { UserShopSettings, SettingsStorage } from './config/settingsStorage';
import { createDeadlockScenario, generateRushHourArrivals } from './config/workloads';

import { TopBar } from './ui/components/TopBar';
import { ControlBar } from './ui/components/ControlBar';
import { MetricsBar } from './ui/components/MetricsBar';
import { ProcessTable } from './ui/components/ProcessTable';
import { QueuesPanel } from './ui/components/QueuesPanel';
import { GanttChart } from './ui/components/GanttChart';
import { ResourcesPanel } from './ui/components/ResourcesPanel';
import { LogPanel } from './ui/components/LogPanel';
import { TimeMachineSlider } from './ui/components/TimeMachineSlider';
import { WhyModal } from './ui/components/WhyModal';
import { ShopSettingsDrawer } from './ui/components/ShopSettingsDrawer';
import { AddOrderModal } from './ui/components/AddOrderModal';
import { BenchmarkModal } from './ui/components/BenchmarkModal';
import { BeginnerGuideModal } from './ui/components/BeginnerGuideModal';

export default function App() {
  const [settings, setSettings] = useState<UserShopSettings>(() => SettingsStorage.load());
  const [viewMode, setViewMode] = useState<ViewMode>(settings.viewMode || 'OS');
  const [speedMs, setSpeedMs] = useState<number>(settings.speedMs || 250);

  const kernelRef = useRef<Kernel>(new Kernel(1337));
  const [, setRenderTrigger] = useState<number>(0);
  const forceUpdate = useCallback(() => setRenderTrigger((n) => n + 1), []);

  const kernel = kernelRef.current;

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  const [previewTick, setPreviewTick] = useState<number | null>(null);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [selectedWhyBlock, setSelectedWhyBlock] = useState<GanttBlock | null>(null);
  const [isWhyOpen, setIsWhyOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAddOrderOpen, setIsAddOrderOpen] = useState<boolean>(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);

  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(() => {
    return !localStorage.getItem('tire_shop_kernel_guided_v1');
  });

  const closeHelp = () => {
    localStorage.setItem('tire_shop_kernel_guided_v1', 'true');
    setIsHelpOpen(false);
  };

  useEffect(() => {
    kernel.scheduler.quantum = settings.quantum;
    kernel.scheduler.agingEnabled = settings.agingEnabled;
    kernel.inventoryManager.restoreState(settings.tireCatalog);
    forceUpdate();
  }, [settings, forceUpdate, kernel]);

  useEffect(() => {
    const starterOrders = generateRushHourArrivals(1, 0, 100);
    starterOrders.slice(0, 4).forEach((order) => {
      kernel.submitOrder(order);
    });
    forceUpdate();
  }, [kernel, forceUpdate]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        kernel.step();
        forceUpdate();
      }, speedMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, speedMs, kernel, forceUpdate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isRunning && previewTick !== null) {
          kernel.rewindToTick(previewTick);
          setPreviewTick(null);
        }
        setIsRunning((prev) => !prev);
      } else if (e.code === 'ArrowRight' && !isRunning) {
        e.preventDefault();
        if (previewTick !== null) {
          kernel.rewindToTick(previewTick);
          setPreviewTick(null);
        }
        kernel.step();
        forceUpdate();
      } else if (e.code === 'KeyR' && !isRunning) {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, kernel, forceUpdate, previewTick]);

  const handleTogglePlay = () => {
    if (!isRunning && previewTick !== null) {
      kernel.rewindToTick(previewTick);
      setPreviewTick(null);
    }
    setIsRunning((prev) => !prev);
  };

  const handleStep = () => {
    if (previewTick !== null) {
      kernel.rewindToTick(previewTick);
      setPreviewTick(null);
    }
    kernel.step();
    forceUpdate();
  };

  const handleReset = () => {
    setIsRunning(false);
    setPreviewTick(null);
    setSelectedPid(null);
    setSelectedWhyBlock(null);
    setIsWhyOpen(false);

    const previousKernel = kernelRef.current;
    const newKernel = new Kernel(1337);

    newKernel.scheduler.setAlgorithm(
      previousKernel.scheduler.getAlgorithm()
    );

    newKernel.scheduler.quantum = settings.quantum;
    newKernel.scheduler.agingEnabled = settings.agingEnabled;

    newKernel.inventoryManager.restoreState(settings.tireCatalog);

    kernelRef.current = newKernel;

    const starterOrders = generateRushHourArrivals(1, 0, 100);

    starterOrders.slice(0, 4).forEach((order) => {
      newKernel.submitOrder(order);
    });

    forceUpdate();
  };

  const handleChangeAlgo = (algo: AlgorithmType) => {
    kernel.scheduler.setAlgorithm(algo);
    forceUpdate();
  };

  const handleChangeQuantum = (q: number) => {
    kernel.scheduler.quantum = q;
    setSettings((prev) => {
      const next = { ...prev, quantum: q };
      SettingsStorage.save(next);
      return next;
    });
    forceUpdate();
  };

  const handleToggleAging = () => {
    kernel.scheduler.agingEnabled = !kernel.scheduler.agingEnabled;
    setSettings((prev) => {
      const next = { ...prev, agingEnabled: kernel.scheduler.agingEnabled };
      SettingsStorage.save(next);
      return next;
    });
    forceUpdate();
  };

  const handleChangeSpeed = (ms: number) => {
    setSpeedMs(ms);
    setSettings((prev) => {
      const next = { ...prev, speedMs: ms };
      SettingsStorage.save(next);
      return next;
    });
  };

  const handleToggleViewMode = () => {
    const nextMode: ViewMode = viewMode === 'OS' ? 'STORY' : 'OS';
    setViewMode(nextMode);
    setSettings((prev) => {
      const next = { ...prev, viewMode: nextMode };
      SettingsStorage.save(next);
      return next;
    });
  };

  const handleTriggerRushHour = () => {
    const nextPid = Object.keys(kernel.processManager.getAllPcbs()).length + 1;
    const rushArrivals = generateRushHourArrivals(nextPid, kernel.clock, Date.now());
    rushArrivals.forEach((order) => {
      kernel.submitOrder(order);
    });
    forceUpdate();
  };

  const handleTriggerDeadlockDemo = () => {
    setIsRunning(false);
    const { orders, locksSetup } = createDeadlockScenario();

    orders.forEach((o) => {
      kernel.processManager.registerProcess(o);
      kernel.processManager.transitionState(o.pid, 'WAITING', 'Waiting for contested mutex equipment');
    });

    locksSetup.forEach((ls) => {
      const lock = kernel.lockManager.getLock(ls.lockId);
      if (lock) {
        lock.heldByPid = ls.heldByPid;
        const waiterPid = orders.find((o) => o.pid !== ls.heldByPid)?.pid;
        if (waiterPid && !lock.waitingPids.includes(waiterPid)) {
          lock.waitingPids.push(waiterPid);
        }
      }
    });

    kernel.logger.warn(
      'LOCK',
      'DEADLOCK SCRIPT TRIGGERED: Order #101 holds Tire Changer (needs Balancer), Order #102 holds Balancer (needs Changer).',
      kernel.clock
    );
    kernel.checkDeadlocks();
    forceUpdate();
  };

  const handleAbortVictim = (victimPid: number) => {
    kernel.abortVictimProcess(victimPid);
    forceUpdate();
  };

  const handleForceReleaseLock = (lockId: LockId) => {
    kernel.forceReleaseLock(lockId);
    forceUpdate();
  };

  const handleRestock = (tireId: string, count: number) => {
    kernel.restockTires(tireId, count);
    forceUpdate();
  };

  const handleOpenWhy = (block: GanttBlock) => {
    setSelectedWhyBlock(block);
    setIsWhyOpen(true);
  };

  const handleRewindToTick = (tick: number) => {
    setIsRunning(false);
    kernel.rewindToTick(tick);
    setPreviewTick(null);
    forceUpdate();
  };

  const handleSaveSettings = (newSettings: UserShopSettings) => {
    setSettings(newSettings);
    kernel.scheduler.quantum = newSettings.quantum;
    kernel.scheduler.agingEnabled = newSettings.agingEnabled;
    kernel.inventoryManager.restoreState(newSettings.tireCatalog);
    forceUpdate();
  };

  const handleNewOrderSubmit = (newPcb: PCB) => {
    kernel.submitOrder(newPcb);
    forceUpdate();
  };

  const activeSnapshot =
    previewTick !== null && kernel.snapshots[previewTick]
      ? kernel.snapshots[previewTick]
      : null;

  const allPcbs = activeSnapshot ? activeSnapshot.pcbs : kernel.processManager.getAllPcbs();
  const runningPid = activeSnapshot ? activeSnapshot.runningPid : kernel.processManager.getRunningPid();
  const runningPcb = runningPid !== null ? allPcbs[runningPid] || null : null;
  const readyQueue = activeSnapshot
    ? activeSnapshot.readyQueuePids.map((pid) => allPcbs[pid]).filter(Boolean)
    : kernel.processManager.getReadyQueue();
  const waitingQueue = activeSnapshot
    ? activeSnapshot.waitingQueuePids.map((pid) => allPcbs[pid]).filter(Boolean)
    : kernel.processManager.getWaitingQueue();
  const locks = activeSnapshot ? activeSnapshot.locks : kernel.lockManager.getLocks();
  const inventory = activeSnapshot ? activeSnapshot.inventory : kernel.inventoryManager.getItems();
  const metrics = activeSnapshot ? activeSnapshot.metrics : kernel.calculateMetrics();
  const ganttBlocks = activeSnapshot ? activeSnapshot.ganttBlocks : kernel.ganttBlocks;
  const displayClock = activeSnapshot ? activeSnapshot.tick : kernel.clock;
  const displayMode = activeSnapshot ? activeSnapshot.mode : kernel.mode;
  const deadlockReport = activeSnapshot?.deadlockReport || kernel.latestDeadlockReport;
  const logEntries = activeSnapshot
    ? kernel.logger.getEntries().slice(0, activeSnapshot.logsCount)
    : kernel.logger.getEntries();
  const selectedPcb = selectedPid ? allPcbs[selectedPid] || null : null;

  return (
    <div className="min-h-screen bg-[#F6EFE0] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#CC5500]/20 selection:text-[#CC5500]">
      {/* 1. Top Bar */}
      <TopBar
        mode={displayMode}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        clock={displayClock}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* 2. Control Bar */}
      <ControlBar
        isRunning={isRunning}
        onTogglePlay={handleTogglePlay}
        onStep={handleStep}
        onReset={handleReset}
        speedMs={speedMs}
        onChangeSpeed={handleChangeSpeed}
        currentAlgo={kernel.scheduler.getAlgorithm()}
        onChangeAlgo={handleChangeAlgo}
        quantum={kernel.scheduler.quantum}
        onChangeQuantum={handleChangeQuantum}
        agingEnabled={kernel.scheduler.agingEnabled}
        onToggleAging={handleToggleAging}
        onTriggerRushHour={handleTriggerRushHour}
        onTriggerDeadlockDemo={handleTriggerDeadlockDemo}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAddOrder={() => setIsAddOrderOpen(true)}
        viewMode={viewMode}
      />

      {/* 3. Main Workspace Layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 flex flex-col gap-4">
        {/* Time Machine Slider */}
        <TimeMachineSlider
          currentClock={kernel.clock}
          totalSnapshots={kernel.snapshots.length}
          previewTick={previewTick}
          onPreviewTickChange={setPreviewTick}
          onRewindToTick={handleRewindToTick}
          isRunning={isRunning}
          viewMode={viewMode}
        />

        {/* 3-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT COLUMN: Process Table & Queues (3 cols on desktop) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <ProcessTable
              pcbs={allPcbs}
              runningPid={runningPid}
              onSelectPcb={(p) => setSelectedPid(p.pid)}
              selectedPid={selectedPid}
              viewMode={viewMode}
            />

            <QueuesPanel
              runningPcb={runningPcb}
              readyQueue={readyQueue}
              waitingQueue={waitingQueue}
              onSelectPcb={(p) => setSelectedPid(p.pid)}
              viewMode={viewMode}
            />
          </div>

          {/* CENTER COLUMN: Metrics & Gantt Chart (6 cols on desktop) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <MetricsBar metrics={metrics} clock={displayClock} viewMode={viewMode} />

            <GanttChart
              blocks={ganttBlocks}
              pcbs={allPcbs}
              currentClock={displayClock}
              isRunning={isRunning}
              onOpenWhy={handleOpenWhy}
              viewMode={viewMode}
            />
          </div>

          {/* RIGHT COLUMN: Locks / Resources & Audit Log (3 cols on desktop) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <ResourcesPanel
              locks={locks}
              inventory={inventory}
              deadlockReport={deadlockReport}
              selectedPcb={selectedPcb}
              onAbortVictim={handleAbortVictim}
              onForceReleaseLock={handleForceReleaseLock}
              onRestock={handleRestock}
              viewMode={viewMode}
            />

            <LogPanel
              entries={logEntries}
              onClear={() => {
                kernel.logger.clear();
                forceUpdate();
              }}
              onSelectLogEntry={(entry) => {
                if (entry.pid) setSelectedPid(entry.pid);
              }}
            />
          </div>
        </div>
      </main>

      {/* Modals & Drawers */}
      <WhyModal
        isOpen={isWhyOpen}
        onClose={() => setIsWhyOpen(false)}
        block={selectedWhyBlock}
        pcb={selectedWhyBlock && typeof selectedWhyBlock.pid === 'number' ? allPcbs[selectedWhyBlock.pid] || null : null}
        currentAlgo={kernel.scheduler.getStrategy().label}
        viewMode={viewMode}
      />

      <ShopSettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      <AddOrderModal
        isOpen={isAddOrderOpen}
        onClose={() => setIsAddOrderOpen(false)}
        onSubmitOrder={handleNewOrderSubmit}
        nextPid={Object.keys(allPcbs).length + 1}
        currentClock={kernel.clock}
        settings={settings}
        existingPcbs={allPcbs}
      />

      <BenchmarkModal isOpen={isBenchmarkOpen} onClose={() => setIsBenchmarkOpen(false)} />

      <BeginnerGuideModal isOpen={isHelpOpen} onClose={closeHelp} />
    </div>
  );
}
