import React from 'react';
import { ViewMode } from '../../skin/dictionary';
import { ShieldCheck, HelpCircle, RefreshCw, Eye } from 'lucide-react';

interface TopBarProps {
  mode: 'USER' | 'KERNEL';
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  clock: number;
  onOpenHelp: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  mode,
  viewMode,
  onToggleViewMode,
  clock,
  onOpenHelp,
}) => {
  return (
    <header className="tire-tread-pattern text-cream px-6 py-3 border-b border-[#E4D9C3]/20 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        {/* Brand Zone: Single element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#CC5500] flex items-center justify-center font-bold text-lg text-white shadow-inner font-display tracking-wider">
            JW
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#FFFAF0] font-display leading-tight whitespace-nowrap">
              PITSTOP OS
            </h1>
            <p className="text-xs text-[#E4D9C3]/70 font-sans whitespace-nowrap">
              Mini-OS Simulator
            </p>
          </div>
        </div>

        {/* Center Zone: Mode Indicator & Dual View Toggle */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Mode Indicator: User Mode vs Kernel Mode */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
              mode === 'KERNEL'
                ? 'bg-[#CC5500]/20 border-[#CC5500] text-[#FF9E59] shadow-[0_0_12px_rgba(204,85,0,0.3)]'
                : 'bg-white/5 border-white/10 text-[#E4D9C3]'
            }`}
            title={
              mode === 'KERNEL'
                ? 'Privileged Kernel Mode: Executing Syscall / Scheduler Routine'
                : 'User Mode: Waiting Lounge / Normal Customer Order Execution'
            }
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${mode === 'KERNEL' ? 'text-[#CC5500]' : 'text-slate-400'}`} />
            <span>
              {mode === 'KERNEL'
                ? viewMode === 'STORY'
                  ? 'MANAGER OFFICE (Privileged)'
                  : 'KERNEL MODE (Privileged)'
                : viewMode === 'STORY'
                ? 'SHOWROOM LOUNGE (User Mode)'
                : 'USER MODE (Restricted)'}
            </span>
          </div>

          {/* Dual View Toggle */}
          <button
            onClick={onToggleViewMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E4D9C3]/30 bg-white/5 hover:bg-white/10 text-xs font-medium text-[#FFFAF0] transition-colors whitespace-nowrap"
            title="Switch between OS technical concepts and Tire Shop scenario terminology"
            aria-label="Toggle between OS View and Story View"
          >
            <Eye className="w-3.5 h-3.5 text-[#CC5500]" />
            <span>View: <strong className="text-[#CC5500]">{viewMode === 'STORY' ? 'Story View' : 'OS View'}</strong></span>
          </button>
        </div>

        {/* Right Zone: Digital Clock & Comprehensive Guide CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Simulation Clock Tick */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-[#E4D9C3]/20 font-mono text-xs text-[#FFFAF0]">
            <span className="text-[#E4D9C3]/60">CLOCK:</span>
            <span className="font-bold text-[#CC5500] text-sm tabular-nums">Tick #{clock}</span>
          </div>

          {/* Guide & Course Theory CTA Button */}
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#CC5500] hover:bg-[#A84500] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            title="Open comprehensive student guide and lab theory manual"
            aria-label="Open Course Guide and Lab Manual"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Course Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
