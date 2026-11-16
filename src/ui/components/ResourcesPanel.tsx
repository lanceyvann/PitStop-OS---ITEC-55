import React, { useState } from 'react';
import { Lock, LockId } from '../../models/lock';
import { TireStockItem } from '../../models/tireStockItem';
import { PCB } from '../../models/pcb';
import { DeadlockReport } from '../../kernel/deadlockDetector';
import { ViewMode } from '../../skin/dictionary';
import { Lock as LockIcon, Unlock, AlertTriangle, ShieldAlert, Package, Plus, Layers, Cpu } from 'lucide-react';

interface ResourcesPanelProps {
  locks: Record<LockId, Lock>;
  inventory: TireStockItem[];
  deadlockReport: DeadlockReport;
  selectedPcb: PCB | null;
  onAbortVictim: (pid: number) => void;
  onForceReleaseLock: (lockId: LockId) => void;
  onRestock: (tireId: string, count: number) => void;
  viewMode: ViewMode;
}

export const ResourcesPanel: React.FC<ResourcesPanelProps> = ({
  locks,
  inventory,
  deadlockReport,
  selectedPcb,
  onAbortVictim,
  onForceReleaseLock,
  onRestock,
  viewMode,
}) => {
  const [activeTab, setActiveTab] = useState<'locks' | 'stock' | 'private'>('locks');

  const lockList = Object.values(locks);

  return (
    <div className="bg-[#FFFAF0] border border-[#E4D9C3] rounded-xl shadow-xs overflow-hidden flex flex-col gap-3 p-3">
      {/* 1. DEADLOCK ALERT BANNER (If Deadlock cycle detected) */}
      {deadlockReport.hasDeadlock && (
        <div className="p-3 bg-[#B3261E] text-white rounded-xl shadow-md border border-[#7F1D1D] animate-pulse">
          <div className="flex items-center gap-2 mb-1.5 font-bold font-display text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>CIRCULAR WAIT DEADLOCK DETECTED!</span>
          </div>
          <p className="text-[11px] leading-relaxed text-red-100 mb-2">
            Orders <strong>[{deadlockReport.cyclePids.map((p) => `#${p}`).join(' ⇄ ')}]</strong> are in mutual hold-and-wait dependency.
          </p>

          {/* Recovery Options */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-red-700/60">
            {deadlockReport.suggestedVictimPid && (
              <button
                onClick={() => onAbortVictim(deadlockReport.suggestedVictimPid!)}
                className="px-2.5 py-1 bg-white text-[#B3261E] hover:bg-red-50 rounded text-xs font-bold transition-colors shadow-xs"
              >
                Abort Victim (#{deadlockReport.suggestedVictimPid})
              </button>
            )}

            <button
              onClick={() => onForceReleaseLock('lock_tire_changer')}
              className="px-2 py-1 bg-black/40 hover:bg-black/60 text-white rounded text-xs font-mono transition-colors"
            >
              Force-Release Changer
            </button>
            <button
              onClick={() => onForceReleaseLock('lock_wheel_balancer')}
              className="px-2 py-1 bg-black/40 hover:bg-black/60 text-white rounded text-xs font-mono transition-colors"
            >
              Force-Release Balancer
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#E4D9C3] pb-1 gap-2 text-xs">
        <button
          onClick={() => setActiveTab('locks')}
          className={`pb-1 px-1.5 font-medium border-b-2 transition-colors ${
            activeTab === 'locks'
              ? 'border-[#CC5500] text-[#CC5500] font-bold'
              : 'border-transparent text-[#1A1A1A]/70 hover:text-[#1A1A1A]'
          }`}
        >
          {viewMode === 'STORY' ? 'Equipment Locks' : 'Mutex Locks'}
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-1 px-1.5 font-medium border-b-2 transition-colors ${
            activeTab === 'stock'
              ? 'border-[#CC5500] text-[#CC5500] font-bold'
              : 'border-transparent text-[#1A1A1A]/70 hover:text-[#1A1A1A]'
          }`}
        >
          {viewMode === 'STORY' ? 'Tire Stock Room' : 'Shared Resources'}
        </button>
        <button
          onClick={() => setActiveTab('private')}
          className={`pb-1 px-1.5 font-medium border-b-2 transition-colors ${
            activeTab === 'private'
              ? 'border-[#CC5500] text-[#CC5500] font-bold'
              : 'border-transparent text-[#1A1A1A]/70 hover:text-[#1A1A1A]'
          }`}
        >
          Private Registers / Stacks
        </button>
      </div>

      {/* TAB 1: MUTEX LOCKS & WAIT-FOR GRAPH */}
      {activeTab === 'locks' && (
        <div className="space-y-2.5">
          {lockList.map((lock) => {
            const isHeld = lock.heldByPid !== null;
            return (
              <div
                key={lock.id}
                className={`p-2.5 rounded-lg border text-xs transition-colors ${
                  isHeld
                    ? 'bg-[#CC5500]/5 border-[#CC5500]/40'
                    : 'bg-[#F6EFE0]/50 border-[#E4D9C3]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#1A1A1A]">
                    {isHeld ? (
                      <LockIcon className="w-3.5 h-3.5 text-[#CC5500]" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-[#059669]" />
                    )}
                    <span>{viewMode === 'STORY' ? lock.shopName : lock.osName}</span>
                  </div>

                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isHeld
                        ? 'bg-[#CC5500] text-white'
                        : 'bg-[#059669]/10 text-[#059669]'
                    }`}
                  >
                    {isHeld ? `HELD BY #${lock.heldByPid}` : 'AVAILABLE'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#1A1A1A]/70 font-mono">
                  <span>
                    Waiting Queue: {lock.waitingPids.length > 0 ? lock.waitingPids.map((p) => `#${p}`).join(', ') : 'None'}
                  </span>
                  {isHeld && (
                    <button
                      onClick={() => onForceReleaseLock(lock.id)}
                      className="text-[10px] text-[#B3261E] hover:underline"
                    >
                      Force Release
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Wait-For Graph SVG if edges exist */}
          {deadlockReport.edges.length > 0 && (
            <div className="p-2 bg-[#F6EFE0] rounded-lg border border-[#E4D9C3] mt-2">
              <span className="font-mono text-[10px] uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                Wait-For Graph (WFG) Edges:
              </span>
              <div className="space-y-1">
                {deadlockReport.edges.map((e, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-[11px] font-mono text-[#1A1A1A]">
                    <span className="font-bold text-[#B3261E]">Order #{e.fromPid}</span>
                    <span>──(waiting for {e.lockName})──▶</span>
                    <span className="font-bold text-[#CC5500]">Order #{e.toPid}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TIRE INVENTORY (SHARED RESOURCE POOL) */}
      {activeTab === 'stock' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#1A1A1A]/70">
            <span>Tire Stock Room (Shared Semaphores)</span>
            <span className="font-mono">{inventory.length} items cataloged</span>
          </div>

          <div className="max-h-[220px] overflow-y-auto divide-y divide-[#E4D9C3] border border-[#E4D9C3] rounded-lg bg-white">
            {inventory.map((item) => {
              const isDepleted = item.stock <= 0;
              return (
                <div key={item.id} className="p-2 flex items-center justify-between text-xs hover:bg-[#F6EFE0]/40">
                  <div>
                    <div className="font-bold text-[#1A1A1A]">
                      {item.brand} {item.model}{' '}
                      <span className="font-mono text-[11px] text-[#CC5500]">({item.size})</span>
                    </div>
                    <div className="text-[11px] text-[#1A1A1A]/60">
                      Stock: <strong className={isDepleted ? 'text-[#B3261E]' : 'text-[#059669]'}>{item.stock}</strong> units{' '}
                      ({item.reserved} reserved)
                    </div>
                  </div>

                  <button
                    onClick={() => onRestock(item.id, 10)}
                    className="flex items-center gap-0.5 px-2 py-1 bg-[#F6EFE0] hover:bg-[#CC5500] hover:text-white border border-[#E4D9C3] rounded text-[11px] font-medium transition-colors"
                    title="Simulate supplier restock delivery (+10 units)"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+10</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PRIVATE PROCESS REGISTERS & STACKS */}
      {activeTab === 'private' && (
        <div className="text-xs space-y-2">
          {selectedPcb ? (
            <div className="space-y-2">
              <div className="font-bold font-display text-sm text-[#1A1A1A] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#CC5500]" />
                <span>Process #{selectedPcb.pid} Private Memory Context</span>
              </div>

              {/* Registers Grid */}
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px] bg-white p-2 rounded-lg border border-[#E4D9C3]">
                <div>
                  <span className="text-[#1A1A1A]/60">PC: </span>0x{selectedPcb.registers.PC.toString(16).toUpperCase()}
                </div>
                <div>
                  <span className="text-[#1A1A1A]/60">SP: </span>0x{selectedPcb.registers.SP.toString(16).toUpperCase()}
                </div>
                <div>
                  <span className="text-[#1A1A1A]/60">AX: </span>{selectedPcb.registers.AX} (Wheels)
                </div>
                <div>
                  <span className="text-[#1A1A1A]/60">BX: </span>{selectedPcb.registers.BX} Nm (Torque)
                </div>
                <div>
                  <span className="text-[#1A1A1A]/60">CX: </span>{selectedPcb.registers.CX} (Balance)
                </div>
                <div>
                  <span className="text-[#1A1A1A]/60">DX: </span>{selectedPcb.registers.DX} (Invoice)
                </div>
              </div>

              {/* Thread Stacks */}
              <div className="space-y-1.5">
                <span className="font-bold text-[11px] text-[#1A1A1A]">Thread Execution Stacks (TCBs):</span>
                {selectedPcb.threads.map((t) => (
                  <div key={t.tid} className="p-2 bg-white rounded border border-[#E4D9C3]">
                    <div className="flex justify-between font-bold text-[11px] mb-1">
                      <span>{t.name} ({t.role})</span>
                      <span className="font-mono text-[#CC5500]">{t.state}</span>
                    </div>
                    <div className="font-mono text-[10px] text-[#1A1A1A]/70 space-y-0.5">
                      {t.privateStack.map((frame, i) => (
                        <div key={i} className="pl-2 border-l-2 border-[#CC5500]/40">
                          {frame}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#1A1A1A]/60 bg-[#F6EFE0]/50 rounded-lg">
              Click any customer order in the table or timeline to inspect its private registers and stack frames.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
