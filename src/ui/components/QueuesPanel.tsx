/**
 * @file QueuesPanel.tsx
 * @description OS Queues visualization panel.
 * Displays the Active Fitting Bay (CPU), Waiting Lane (Ready Queue), and Blocked I/O / Mutex Queue.
 */

import React from 'react';
import { PCB } from '../../models/pcb';
import { ViewMode, VehicleIcon, getTerm } from '../../skin/dictionary';
import { ArrowRight, Lock, Package, Clock, ShieldAlert } from 'lucide-react';

interface QueuesPanelProps {
  runningPcb: PCB | null;
  readyQueue: PCB[];
  waitingQueue: PCB[];
  onSelectPcb: (pcb: PCB) => void;
  viewMode: ViewMode;
}

export const QueuesPanel: React.FC<QueuesPanelProps> = ({
  runningPcb,
  readyQueue,
  waitingQueue,
  onSelectPcb,
  viewMode,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* 1. Active CPU: Fitting Bay with Hydraulic Lift */}
      <div className="bg-[#FFFAF0] border border-[#E4D9C3] rounded-xl p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-display font-bold text-[#1A1A1A] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#CC5500]" />
            {viewMode === 'STORY' ? 'Fitting Bay Hydraulic Lift (CPU)' : 'CPU Execution Slot'}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#CC5500]/10 text-[#CC5500] font-bold">
            {runningPcb ? 'OCCUPIED' : 'IDLE'}
          </span>
        </div>

        {runningPcb ? (
          <div
            onClick={() => onSelectPcb(runningPcb)}
            className="bg-[#CC5500]/10 border border-[#CC5500]/30 rounded-lg p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#CC5500]/15 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#CC5500] text-white flex items-center justify-center font-bold text-xs font-mono">
                #{runningPcb.pid}
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#1A1A1A]">
                  <VehicleIcon type={runningPcb.vehicleType} className="w-3.5 h-3.5 text-[#CC5500]" />
                  <span>{runningPcb.modelName}</span>
                </div>
                <div className="text-[10px] text-[#1A1A1A]/70">
                  {runningPcb.burstPlan[runningPcb.currentSegmentIndex]?.label || 'Fitting Tires'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono text-xs font-bold text-[#CC5500]">
                {runningPcb.remainingCpuTime} ticks left
              </span>
              <div className="text-[10px] font-mono text-[#1A1A1A]/60">
                Pri: {runningPcb.priority + (runningPcb.agingBoost || 0)}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-[#1A1A1A]/50 bg-[#F6EFE0]/40 rounded-lg border border-dashed border-[#E4D9C3]">
            Fitting Bay Lift is currently empty.
          </div>
        )}
      </div>

      {/* 2. Ready Queue: Waiting Vehicle Lane */}
      <div className="bg-[#FFFAF0] border border-[#E4D9C3] rounded-xl p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-display font-bold text-[#1A1A1A]">
            {viewMode === 'STORY' ? 'Waiting Vehicle Lane (Ready Queue)' : 'Ready Queue'}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#D9A441]/20 text-[#78350F] font-bold">
            {readyQueue.length} queued
          </span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
          {readyQueue.length === 0 ? (
            <div className="py-3 text-center text-xs text-[#1A1A1A]/50 bg-[#F6EFE0]/40 rounded-lg">
              No vehicles waiting in ready queue.
            </div>
          ) : (
            readyQueue.map((pcb, idx) => (
              <div
                key={pcb.pid}
                onClick={() => onSelectPcb(pcb)}
                className="flex items-center justify-between p-2 rounded-lg bg-[#FBF4DE] border border-[#D9A441]/40 text-xs cursor-pointer hover:bg-[#F7ECC7] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-[#78350F] font-bold w-4">
                    #{idx + 1}
                  </span>
                  <span className="font-mono font-bold text-[#1A1A1A]">#{pcb.pid}</span>
                  <VehicleIcon type={pcb.vehicleType} className="w-3.5 h-3.5 text-[#CC5500]" />
                  <span className="truncate max-w-[90px]">{pcb.modelName}</span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-[#1A1A1A]/70" title="Remaining CPU Burst">
                    {pcb.remainingCpuTime}t
                  </span>
                  <span
                    className="font-bold text-[#CC5500] px-1 bg-white/60 rounded"
                    title="Effective Priority"
                  >
                    P{pcb.priority + (pcb.agingBoost || 0)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Waiting Queue: Blocked (I/O, Mutex, Stock) */}
      <div className="bg-[#FFFAF0] border border-[#E4D9C3] rounded-xl p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-display font-bold text-[#1A1A1A]">
            {viewMode === 'STORY' ? 'Awaiting Parts / Balancer / Payment' : 'Waiting Queue (Blocked I/O / Mutex)'}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#5B6C7A]/20 text-[#5B6C7A] font-bold">
            {waitingQueue.length} blocked
          </span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
          {waitingQueue.length === 0 ? (
            <div className="py-3 text-center text-xs text-[#1A1A1A]/50 bg-[#F6EFE0]/40 rounded-lg">
              No orders currently blocked.
            </div>
          ) : (
            waitingQueue.map((pcb) => (
              <div
                key={pcb.pid}
                onClick={() => onSelectPcb(pcb)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  pcb.isDeadlocked
                    ? 'bg-[#B3261E]/10 border border-[#B3261E]/40 text-[#B3261E]'
                    : 'bg-[#5B6C7A]/10 border border-[#5B6C7A]/30 text-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold">#{pcb.pid}</span>
                  <VehicleIcon type={pcb.vehicleType} className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[85px]">{pcb.modelName}</span>
                </div>

                <div className="flex items-center gap-1 text-[10px] truncate max-w-[120px]">
                  {pcb.isDeadlocked ? (
                    <span className="font-bold flex items-center gap-0.5 text-[#B3261E]">
                      <ShieldAlert className="w-3 h-3" /> Deadlock
                    </span>
                  ) : pcb.waitingForLock ? (
                    <span className="flex items-center gap-0.5 text-[#CC5500]">
                      <Lock className="w-3 h-3" /> Wait Lock
                    </span>
                  ) : pcb.waitingForStock ? (
                    <span className="flex items-center gap-0.5 text-[#D97706]">
                      <Package className="w-3 h-3" /> Out of Stock
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[#5B6C7A]">
                      <Clock className="w-3 h-3" /> I/O Burst
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
