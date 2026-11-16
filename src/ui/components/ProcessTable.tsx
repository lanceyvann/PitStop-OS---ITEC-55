import React, { useState } from 'react';
import { PCB } from '../../models/pcb';
import { ViewMode, VehicleIcon, getTerm } from '../../skin/dictionary';
import { ChevronRight, ChevronDown, Cpu, GitFork, User, Wrench, ShieldAlert } from 'lucide-react';

interface ProcessTableProps {
  pcbs: Record<number, PCB>;
  runningPid: number | null;
  onSelectPcb: (pcb: PCB) => void;
  selectedPid: number | null;
  viewMode: ViewMode;
}

export const ProcessTable: React.FC<ProcessTableProps> = ({
  pcbs,
  runningPid,
  onSelectPcb,
  selectedPid,
  viewMode,
}) => {
  const [treeView, setTreeView] = useState<boolean>(false);
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({});

  const allList = Object.values(pcbs);

  const toggleParent = (pid: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedParents((prev) => ({ ...prev, [pid]: !prev[pid] }));
  };

  const getStateBadge = (pcb: PCB) => {
    if (pcb.isDeadlocked) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#B3261E] text-white">
          <ShieldAlert className="w-3 h-3" />
          <span>DEADLOCK</span>
        </span>
      );
    }

    switch (pcb.state) {
      case 'RUNNING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#CC5500] text-white">
            RUNNING
          </span>
        );
      case 'READY':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#D9A441] text-[#1A1A1A]">
            READY
          </span>
        );
      case 'WAITING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#5B6C7A] text-white">
            WAITING
          </span>
        );
      case 'TERMINATED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2B2B2B] text-[#E4D9C3]">
            DONE
          </span>
        );
      case 'NEW':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#8A7F6B] text-white">
            NEW
          </span>
        );
    }
  };
  const rootOrders = allList.filter((p) => p.parentPid === null);

  const renderRow = (pcb: PCB, indent: number = 0) => {
    const isSelected = selectedPid === pcb.pid;
    const hasChildren = pcb.childrenPids && pcb.childrenPids.length > 0;
    const isExpanded = Boolean(expandedParents[pcb.pid]);

    return (
      <React.Fragment key={pcb.pid}>
        <tr
          onClick={() => onSelectPcb(pcb)}
          className={`border-b border-[#E4D9C3]/40 cursor-pointer text-xs transition-colors hover:bg-[#F6EFE0] ${
            isSelected ? 'bg-[#CC5500]/10 font-medium' : ''
          }`}
        >
          {/* PID & Vehicle */}
          <td className="py-2 px-3 whitespace-nowrap">
            <div className="flex items-center gap-1.5" style={{ paddingLeft: `${indent * 16}px` }}>
              {hasChildren && (
                <button
                  onClick={(e) => toggleParent(pcb.pid, e)}
                  className="p-0.5 hover:bg-black/10 rounded"
                  title="Toggle sub-orders"
                >
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              )}
              <span className="font-mono font-bold text-[#1A1A1A]">#{pcb.pid}</span>
              <VehicleIcon type={pcb.vehicleType} className="w-3.5 h-3.5 text-[#CC5500]" />
              <span className="truncate max-w-[110px]" title={pcb.modelName}>
                {pcb.modelName}
              </span>
            </div>
          </td>

          {/* State */}
          <td className="py-2 px-2 whitespace-nowrap">{getStateBadge(pcb)}</td>

          {/* Priority */}
          <td className="py-2 px-2 whitespace-nowrap text-center font-mono">
            <span
              className={`font-semibold ${
                pcb.priority >= 7 ? 'text-[#CC5500]' : 'text-[#1A1A1A]'
              }`}
            >
              {pcb.priority + (pcb.agingBoost || 0)}
            </span>
            {pcb.agingBoost > 0 && <span className="text-[10px] text-[#059669]"> (+{pcb.agingBoost})</span>}
          </td>

          {/* Burst / Remaining */}
          <td className="py-2 px-2 whitespace-nowrap font-mono text-center">
            <span>{pcb.remainingCpuTime}</span>
            <span className="text-[#1A1A1A]/50"> / {pcb.totalCpuBurst}</span>
          </td>

          {/* Locks / Wait info */}
          <td className="py-2 px-2 whitespace-nowrap text-[11px] text-[#1A1A1A]/70 truncate max-w-[120px]">
            {pcb.heldLocks.length > 0 && (
              <span className="text-[#CC5500] font-mono mr-1" title={`Holds: ${pcb.heldLocks.join(', ')}`}>
                [{pcb.heldLocks.length}L]
              </span>
            )}
            {pcb.waitingReason ? pcb.waitingReason : pcb.state === 'TERMINATED' ? 'Departed' : '-'}
          </td>
        </tr>

        {/* Indented children if expanded */}
        {hasChildren &&
          isExpanded &&
          pcb.childrenPids.map((childPid) => {
            const childPcb = pcbs[childPid];
            return childPcb ? renderRow(childPcb, indent + 1) : null;
          })}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-[#FFFAF0] border border-[#E4D9C3] rounded-xl shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header strip */}
      <div className="px-4 py-2.5 bg-[#F6EFE0]/60 border-b border-[#E4D9C3] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-semibold text-sm text-[#1A1A1A]">
            {viewMode === 'STORY' ? 'Customer Order Slips' : 'Process Control Blocks (PCBs)'}
          </h2>
          <span className="text-xs font-mono px-1.5 py-0.2 bg-[#1A1A1A]/10 rounded text-[#1A1A1A]">
            {allList.length} orders
          </span>
        </div>

        {/* Tree View Toggle */}
        <button
          onClick={() => setTreeView(!treeView)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
            treeView
              ? 'bg-[#CC5500] text-white border-[#CC5500]'
              : 'border-[#1A1A1A]/20 text-[#1A1A1A] hover:bg-white'
          }`}
          title="Toggle hierarchical tree view for fleet parent/child orders"
        >
          <GitFork className="w-3 h-3" />
          <span>Tree</span>
        </button>
      </div>

      {/* Table container */}
      <div className="flex-1 overflow-y-auto max-h-[480px]">
        {allList.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#1A1A1A]/60">
            No active orders in shop. Click "Add Order" or "Rush Hour" to submit customers.
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="bg-[#F6EFE0]/40 sticky top-0 border-b border-[#E4D9C3] text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 font-mono">
              <tr>
                <th className="py-1.5 px-3">Order / Model</th>
                <th className="py-1.5 px-2">State</th>
                <th className="py-1.5 px-2 text-center">Pri</th>
                <th className="py-1.5 px-2 text-center">CPU (Rem/Tot)</th>
                <th className="py-1.5 px-2">Locks / Status</th>
              </tr>
            </thead>
            <tbody>
              {treeView
                ? rootOrders.map((p) => renderRow(p, 0))
                : allList.map((p) => renderRow(p, 0))}
            </tbody>
          </table>
        )}
      </div>

      {/* Selected PCB Register / TCB preview footer */}
      {selectedPid && pcbs[selectedPid] && (
        <div className="p-3 bg-[#F6EFE0] border-t border-[#E4D9C3] text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold font-display text-xs text-[#1A1A1A]">
              PCB #{selectedPid} Hardware Context & Registers:
            </span>
            <span className="font-mono text-[10px] text-[#1A1A1A]/70">
              Arrival: Tick #{pcbs[selectedPid].arrivalTime}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1 font-mono text-[10px] bg-white/70 p-1.5 rounded border border-[#E4D9C3]">
            <div>
              <span className="text-[#1A1A1A]/60">PC:</span> 0x{pcbs[selectedPid].registers.PC.toString(16).toUpperCase()}
            </div>
            <div>
              <span className="text-[#1A1A1A]/60">SP:</span> 0x{pcbs[selectedPid].registers.SP.toString(16).toUpperCase()}
            </div>
            <div>
              <span className="text-[#1A1A1A]/60">AX:</span> {pcbs[selectedPid].registers.AX}
            </div>
            <div>
              <span className="text-[#1A1A1A]/60">BX:</span> {pcbs[selectedPid].registers.BX}Nm
            </div>
            <div>
              <span className="text-[#1A1A1A]/60">CX:</span> {pcbs[selectedPid].registers.CX}
            </div>
            <div>
              <span className="text-[#1A1A1A]/60">DX:</span> {pcbs[selectedPid].registers.DX}
            </div>
          </div>
          {pcbs[selectedPid].threads.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#1A1A1A]/80">
              <span className="font-semibold">Staff Threads (TCBs):</span>
              {pcbs[selectedPid].threads.map((t) => (
                <span key={t.tid} className="px-1.5 py-0.5 bg-[#E4D9C3]/50 rounded font-mono">
                  {t.name} ({t.state})
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
