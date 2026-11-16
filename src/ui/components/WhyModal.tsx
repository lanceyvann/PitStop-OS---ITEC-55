/**
 * @file WhyModal.tsx
 * @description Plain-Language "Why?" Explainer Modal.
 * Deconstructs operating system scheduling decisions, mutual exclusion,
 * and state transitions into natural language for students.
 */

import React from 'react';
import { GanttBlock } from '../../models/snapshot';
import { PCB } from '../../models/pcb';
import { ViewMode } from '../../skin/dictionary';
import { HelpCircle, X, CheckCircle, Clock, Cpu } from 'lucide-react';

interface WhyModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: GanttBlock | null;
  pcb: PCB | null;
  currentAlgo: string;
  viewMode: ViewMode;
}

export const WhyModal: React.FC<WhyModalProps> = ({
  isOpen,
  onClose,
  block,
  pcb,
  currentAlgo,
  viewMode,
}) => {
  if (!isOpen || !block) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[#FFFAF0] rounded-xl shadow-2xl border border-[#E4D9C3] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F6EFE0] border-b border-[#E4D9C3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#CC5500]/15 text-[#CC5500] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#1A1A1A]">
                Scheduling Decision & State Explainer
              </h3>
              <p className="text-[11px] text-[#1A1A1A]/70">
                Algorithm rationale: <strong className="font-mono text-[#CC5500]">{currentAlgo}</strong>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg border border-[#1A1A1A]/20 hover:bg-white text-[#1A1A1A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Target Block Summary */}
          <div className="p-3 bg-[#F6EFE0]/50 rounded-lg border border-[#E4D9C3] space-y-1">
            <div className="flex justify-between font-bold text-xs text-[#1A1A1A]">
              <span>
                {block.pid === 'CPU_IDLE'
                  ? 'Fitting Bay Lift Idle'
                  : `Order #${block.pid} (${pcb?.modelName || 'Customer'})`}
              </span>
              <span className="font-mono text-[#CC5500]">{block.state}</span>
            </div>
            <div className="text-[11px] text-[#1A1A1A]/70 flex gap-4 font-mono">
              <span>Time: Tick {block.start} → {block.start + block.duration}</span>
              <span>Duration: {block.duration} ticks</span>
            </div>
          </div>

          {/* Educational Plain-Language "Why?" */}
          <div className="space-y-2">
            <span className="font-bold text-xs text-[#1A1A1A] block">
              Why was this action taken?
            </span>
            <div className="p-3.5 bg-white rounded-lg border border-[#E4D9C3] leading-relaxed text-[#1A1A1A] text-xs">
              {block.whyReason || (
                <span>
                  Order #{block.pid} was executed according to {currentAlgo} scheduling criteria.
                  Its state was {block.state} based on CPU allocation and lock availability.
                </span>
              )}
            </div>
          </div>

          {/* Context Metrics */}
          {pcb && (
            <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
              <div className="p-2 bg-[#F6EFE0] rounded border border-[#E4D9C3]">
                <span className="text-[#1A1A1A]/60 block text-[10px]">Effective Pri:</span>
                <strong className="text-[#CC5500]">{pcb.priority + (pcb.agingBoost || 0)}</strong>
              </div>
              <div className="p-2 bg-[#F6EFE0] rounded border border-[#E4D9C3]">
                <span className="text-[#1A1A1A]/60 block text-[10px]">Arrival:</span>
                <strong>Tick #{pcb.arrivalTime}</strong>
              </div>
              <div className="p-2 bg-[#F6EFE0] rounded border border-[#E4D9C3]">
                <span className="text-[#1A1A1A]/60 block text-[10px]">Remaining CPU:</span>
                <strong>{pcb.remainingCpuTime}t</strong>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F6EFE0] border-t border-[#E4D9C3] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1A1A1A] text-white rounded-lg font-medium hover:bg-[#333333] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
