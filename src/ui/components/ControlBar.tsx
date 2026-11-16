import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, Zap, AlertTriangle, BarChart3, Settings, Plus } from 'lucide-react';
import { AlgorithmType } from '../../scheduler/types';
import { ViewMode, getTerm } from '../../skin/dictionary';

interface ControlBarProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  speedMs: number;
  onChangeSpeed: (ms: number) => void;
  currentAlgo: AlgorithmType;
  onChangeAlgo: (algo: AlgorithmType) => void;
  quantum: number;
  onChangeQuantum: (q: number) => void;
  agingEnabled: boolean;
  onToggleAging: () => void;
  onTriggerRushHour: () => void;
  onTriggerDeadlockDemo: () => void;
  onOpenBenchmark: () => void;
  onOpenSettings: () => void;
  onOpenAddOrder: () => void;
  viewMode: ViewMode;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isRunning,
  onTogglePlay,
  onStep,
  onReset,
  speedMs,
  onChangeSpeed,
  currentAlgo,
  onChangeAlgo,
  quantum,
  onChangeQuantum,
  agingEnabled,
  onToggleAging,
  onTriggerRushHour,
  onTriggerDeadlockDemo,
  onOpenBenchmark,
  onOpenSettings,
  onOpenAddOrder,
  viewMode,
}) => {
  return (
    <div className="bg-[#FFFAF0] border-b border-[#E4D9C3] px-6 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Primary Action Button: Burnt Orange */}
          <button
            onClick={onTogglePlay}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#CC5500] hover:bg-[#A84500] text-white font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap"
            title={isRunning ? 'Pause simulation (P)' : 'Start continuous simulation (Space)'}
            aria-label={isRunning ? 'Pause Simulation' : 'Start Simulation'}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isRunning ? 'Pause' : 'Start'}</span>
          </button>

          {/* Secondary: Step Button */}
          <button
            onClick={onStep}
            disabled={isRunning}
            className="flex items-center gap-1 px-3 py-2 border border-[#1A1A1A] hover:bg-[#F6EFE0] disabled:opacity-40 disabled:hover:bg-transparent rounded-lg font-medium transition-colors whitespace-nowrap"
            title="Step simulation forward by exactly 1 tick"
            aria-label="Step 1 Tick Forward"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step (1 Tick)</span>
          </button>

          {/* Secondary: Reset Button */}
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-2 border border-[#1A1A1A] hover:bg-[#F6EFE0] rounded-lg font-medium transition-colors whitespace-nowrap"
            title="Reset simulation to initial boot state"
            aria-label="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Speed Slider */}
          <div className="flex items-center gap-2 pl-3 border-l border-[#E4D9C3]">
            <span className="text-[#1A1A1A]/70 font-medium">Speed:</span>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={speedMs}
              onChange={(e) => onChangeSpeed(Number(e.target.value))}
              className="w-20 accent-[#CC5500] cursor-pointer"
              title={`Simulation tick delay: ${speedMs}ms`}
              aria-label="Simulation speed slider in milliseconds"
            />
            <span className="font-mono text-[11px] text-[#1A1A1A] w-12 tabular-nums">{speedMs}ms</span>
          </div>
        </div>

        {/* Center: Scheduling Strategy Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[#1A1A1A]/70 font-medium whitespace-nowrap">
            {viewMode === 'STORY' ? 'Bay Queue Rule:' : 'Scheduling Strategy:'}
          </span>
          <select
            value={currentAlgo}
            onChange={(e) => onChangeAlgo(e.target.value as AlgorithmType)}
            className="bg-[#F6EFE0] border border-[#E4D9C3] text-[#1A1A1A] rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#CC5500] cursor-pointer"
            aria-label="Select Scheduling Algorithm"
          >
            <option value="FCFS">FCFS (First-Come, First-Served)</option>
            <option value="SJF">SJF (Shortest Job First)</option>
            <option value="RR">Round Robin (Time Quantum)</option>
            <option value="PRIORITY">Priority (Fleet/Urgency + Aging)</option>
          </select>

          {/* If Round Robin: Quantum Input */}
          {currentAlgo === 'RR' && (
            <div className="flex items-center gap-1 pl-2">
              <span className="text-[#1A1A1A]/70">Quantum:</span>
              <input
                type="number"
                min="1"
                max="10"
                value={quantum}
                onChange={(e) => onChangeQuantum(Math.max(1, Number(e.target.value)))}
                className="w-12 bg-[#F6EFE0] border border-[#E4D9C3] text-center font-mono py-1 rounded text-xs"
                title="Round Robin Time Slice (ticks)"
                aria-label="Round Robin Quantum in ticks"
              />
              <span className="text-[#1A1A1A]/60">ticks</span>
            </div>
          )}

          {/* If Priority: Aging Toggle */}
          {currentAlgo === 'PRIORITY' && (
            <label className="flex items-center gap-1.5 pl-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={agingEnabled}
                onChange={onToggleAging}
                className="accent-[#CC5500] rounded"
              />
              <span>Aging (+1 pri / 5 ticks)</span>
            </label>
          )}
        </div>

        {/* Right: Actions (Rush Hour, Deadlock Demo, Benchmark, Add Order, Settings) */}
        <div className="flex items-center gap-2">
          {/* Add Order Button */}
          <button
            onClick={onOpenAddOrder}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#1A1A1A] text-white hover:bg-[#333333] rounded-lg font-medium transition-colors"
            title="Create and admit a new customer tire order"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Order</span>
          </button>

          {/* Rush Hour Generator */}
          <button
            onClick={onTriggerRushHour}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-[#1A1A1A]/30 hover:bg-[#F6EFE0] rounded-lg font-medium text-[#1A1A1A] transition-colors"
            title="Inject a burst of 5-8 arriving vehicles"
          >
            <Zap className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Rush Hour</span>
          </button>

          {/* Deadlock Demo Scenario */}
          <button
            onClick={onTriggerDeadlockDemo}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-[#B3261E]/40 hover:bg-[#B3261E]/10 rounded-lg font-medium text-[#B3261E] transition-colors"
            title="Load scripted circular-wait deadlock scenario (Tire Changer vs Wheel Balancer)"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Deadlock Demo</span>
          </button>

          {/* Benchmark Runner */}
          <button
            onClick={onOpenBenchmark}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-[#1A1A1A]/30 hover:bg-[#F6EFE0] rounded-lg font-medium text-[#1A1A1A] transition-colors"
            title="Run 4 algorithms x 3 workloads benchmark matrix"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>Benchmark</span>
          </button>

          {/* Shop Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 border border-[#1A1A1A]/30 hover:bg-[#F6EFE0] rounded-lg text-[#1A1A1A] transition-colors"
            title="Configure vehicle types, models, and tire catalog"
            aria-label="Shop Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
