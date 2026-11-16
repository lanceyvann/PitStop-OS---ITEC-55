import React from 'react';
import { SystemMetrics } from '../../models/snapshot';
import { ViewMode } from '../../skin/dictionary';
import { Activity, Clock, Zap, CheckCircle2, RefreshCw } from 'lucide-react';

interface MetricsBarProps {
  metrics: SystemMetrics;
  clock: number;
  viewMode: ViewMode;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics, clock, viewMode }) => {
  return (
    <div className="bg-[#FFFAF0] border border-[#E4D9C3] rounded-xl p-3 shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* CPU Utilization */}
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#1A1A1A]/60 font-semibold">
          {viewMode === 'STORY' ? 'Bay Lift Active' : 'CPU Utilization'}
        </span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-display font-bold text-xl text-[#CC5500] tabular-nums">
            {metrics.cpuUtilization}%
          </span>
          <span className="text-[10px] text-[#1A1A1A]/50 font-mono">
            ({metrics.totalBusyTicks}/{clock}t)
          </span>
        </div>
      </div>

      {/* Throughput */}
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#1A1A1A]/60 font-semibold">
          Throughput
        </span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-display font-bold text-xl text-[#059669] tabular-nums">
            {metrics.throughput}
          </span>
          <span className="text-[10px] text-[#1A1A1A]/50 font-mono">orders/tick</span>
        </div>
      </div>

      {/* Avg Waiting Time */}
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#1A1A1A]/60 font-semibold">
          {viewMode === 'STORY' ? 'Avg Lane Wait' : 'Avg Waiting Time'}
        </span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-display font-bold text-xl text-[#1A1A1A] tabular-nums">
            {metrics.avgWaitingTime}
          </span>
          <span className="text-[10px] text-[#1A1A1A]/50 font-mono">ticks</span>
        </div>
      </div>

      {/* Avg Turnaround Time */}
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#1A1A1A]/60 font-semibold">
          {viewMode === 'STORY' ? 'Avg Total Time' : 'Avg Turnaround'}
        </span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-display font-bold text-xl text-[#1A1A1A] tabular-nums">
            {metrics.avgTurnaroundTime}
          </span>
          <span className="text-[10px] text-[#1A1A1A]/50 font-mono">ticks</span>
        </div>
      </div>

      {/* Avg Response Time */}
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#1A1A1A]/60 font-semibold">
          {viewMode === 'STORY' ? 'First Bay Access' : 'Avg Response Time'}
        </span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-display font-bold text-xl text-[#0284C7] tabular-nums">
            {metrics.avgResponseTime}
          </span>
          <span className="text-[10px] text-[#1A1A1A]/50 font-mono">ticks</span>
        </div>
      </div>

      {/* Context Switches & Completed */}
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#1A1A1A]/60 font-semibold">
          Switches / Departed
        </span>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="font-display font-bold text-lg text-[#1A1A1A] tabular-nums">
            {metrics.contextSwitchCount} <span className="text-xs font-normal text-[#1A1A1A]/60">sw</span>
          </span>
          <span className="text-sm font-bold text-[#059669] font-mono tabular-nums">
            {metrics.completedCount} <span className="text-xs font-normal text-[#1A1A1A]/60">done</span>
          </span>
        </div>
      </div>
    </div>
  );
};
