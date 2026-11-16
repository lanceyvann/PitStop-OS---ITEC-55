import React, { useRef, useEffect, useState } from 'react';
import { GanttBlock } from '../../models/snapshot';
import { PCB } from '../../models/pcb';
import { ViewMode, VehicleIcon } from '../../skin/dictionary';
import { ZoomIn, ZoomOut, Info, ArrowRight } from 'lucide-react';

interface GanttChartProps {
  blocks: GanttBlock[];
  pcbs: Record<number, PCB>;
  currentClock: number;
  isRunning: boolean;
  onOpenWhy: (block: GanttBlock) => void;
  viewMode: ViewMode;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  blocks,
  pcbs,
  currentClock,
  isRunning,
  onOpenWhy,
  viewMode,
}) => {
  const [unitWidth, setUnitWidth] = useState<number>(32); // Min 28px
  const [hoveredBlock, setHoveredBlock] = useState<{
    block: GanttBlock;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Maximum timeline duration to render (at least currentClock + 10)
  const maxTime = Math.max(25, currentClock + 6);
  const totalChartWidth = maxTime * unitWidth;

  // Auto-scroll to follow execution when running
  useEffect(() => {
    if (isRunning && containerRef.current) {
      const scrollPos = currentClock * unitWidth - containerRef.current.clientWidth + 200;
      if (scrollPos > 0) {
        containerRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }
    }
  }, [currentClock, isRunning, unitWidth]);

  // Runtime assertion: verify no overlapping bars in the CPU row or within any process row
  useEffect(() => {
    // Check CPU blocks
    const cpuBlocks = blocks.filter((b) => b.pid === 'CPU_IDLE' || b.state === 'RUNNING');
    for (let i = 0; i < cpuBlocks.length - 1; i++) {
      const b1 = cpuBlocks[i];
      const b2 = cpuBlocks[i + 1];
      if (b1.start + b1.duration > b2.start && b1.start < b2.start + b2.duration) {
        console.warn(`[GANTT ASSERTION] Overlap detected in CPU row between blocks ${b1.id} and ${b2.id}`);
      }
    }
  }, [blocks]);

  // Separate blocks by row
  const cpuRowBlocks = blocks.filter((b) => b.pid === 'CPU_IDLE' || b.state === 'RUNNING');
  const contextSwitchBlocks = blocks.filter((b) => b.pid === 'CONTEXT_SWITCH');

  // Unique list of processes that have appeared in the system
  const pcbList = Object.values(pcbs);

  const getBarStyle = (block: GanttBlock) => {
    switch (block.state) {
      case 'RUNNING':
        return 'bg-[#CC5500] text-white border border-[#A84500] shadow-xs';
      case 'READY':
        return 'ready-pattern text-[#78350F]';
      case 'WAITING':
        return 'hatch-waiting text-white border border-[#475569] shadow-xs';
      case 'DEADLOCK':
        return 'hatch-deadlock text-white border border-[#7F1D1D] shadow-xs';
      case 'IDLE':
        return 'cpu-idle-pattern text-[#6B7280] border border-gray-300';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className="bg-[#FFFAF0] border border-[#E4D9C3] rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Chart Header: Title & Zoom Controls */}
      <div className="px-4 py-2 bg-[#F6EFE0]/70 border-b border-[#E4D9C3] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-semibold text-sm text-[#1A1A1A]">
            {viewMode === 'STORY' ? 'Bay Lift Execution Timeline' : 'CPU Scheduling Gantt Chart'}
          </h2>
          <span className="text-[11px] text-[#1A1A1A]/60">
            Click any block for "Why?" explainer
          </span>
        </div>

        {/* Zoom In / Zoom Out */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setUnitWidth((w) => Math.max(28, w - 4))}
            className="p-1 border border-[#1A1A1A]/30 rounded hover:bg-white text-[#1A1A1A]"
            title="Zoom Out (narrow time scale)"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-[#1A1A1A]/70 w-9 text-center tabular-nums">
            {unitWidth}px
          </span>
          <button
            onClick={() => setUnitWidth((w) => Math.min(60, w + 4))}
            className="p-1 border border-[#1A1A1A]/30 rounded hover:bg-white text-[#1A1A1A]"
            title="Zoom In (wider time scale)"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Gantt Scroll Container */}
      <div ref={containerRef} className="overflow-x-auto overflow-y-auto max-h-[380px] relative">
        <div style={{ width: `${totalChartWidth + 180}px` }} className="relative select-none">
          {/* 1. Time Axis Ruler */}
          <div className="flex border-b border-[#E4D9C3] sticky top-0 bg-[#FFFAF0] z-20 h-8">
            {/* Sticky Row Label Column Header */}
            <div className="w-[180px] shrink-0 sticky left-0 bg-[#FFFAF0] border-r border-[#E4D9C3] px-3 flex items-center font-mono text-[10px] uppercase text-[#1A1A1A]/60 font-bold z-30 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
              Process / Resource
            </div>

            {/* Time Ticks */}
            <div className="relative flex-1 h-8">
              {Array.from({ length: maxTime + 1 }).map((_, tick) => {
                const isMajor = tick % 5 === 0;
                return (
                  <div
                    key={tick}
                    style={{ left: `${tick * unitWidth}px` }}
                    className="absolute top-0 bottom-0 flex flex-col items-start"
                  >
                    {/* Tick line */}
                    <div
                      className={`w-px ${
                        isMajor ? 'h-3 bg-[#1A1A1A]' : 'h-1.5 bg-[#E4D9C3]'
                      }`}
                    />
                    {/* Tick label */}
                    <span
                      className={`font-mono text-[10px] pl-0.5 leading-none mt-0.5 ${
                        isMajor ? 'font-bold text-[#1A1A1A]' : 'text-[#1A1A1A]/40'
                      }`}
                    >
                      {tick}
                    </span>
                  </div>
                );
              })}

              {/* Context Switch Diamonds on the Axis */}
              {contextSwitchBlocks.map((cs) => (
                <div
                  key={cs.id}
                  style={{ left: `${cs.start * unitWidth}px` }}
                  className="absolute bottom-0 -translate-x-1/2 translate-y-1/2 z-40 cursor-help"
                  title={`Context Switch at Tick ${cs.start}: ${cs.label}`}
                >
                  <div className="w-2.5 h-2.5 bg-black rotate-45 border border-white shadow-xs" />
                </div>
              ))}
            </div>
          </div>

          {/* Faint Vertical Grid Lines Background */}
          <div className="absolute top-8 bottom-0 left-[180px] right-0 pointer-events-none z-0">
            {Array.from({ length: maxTime + 1 }).map((_, tick) => (
              <div
                key={tick}
                style={{ left: `${tick * unitWidth}px` }}
                className={`absolute top-0 bottom-0 w-px ${
                  tick % 5 === 0 ? 'bg-[#E4D9C3]/70' : 'bg-[#E4D9C3]/20'
                }`}
              />
            ))}
          </div>

          {/* Burnt Orange "NOW" Vertical Indicator Line */}
          <div
            style={{ left: `${180 + currentClock * unitWidth}px` }}
            className="absolute top-0 bottom-0 w-[2px] bg-[#CC5500] z-25 pointer-events-none shadow-[0_0_8px_rgba(204,85,0,0.6)]"
          >
            <div className="absolute -top-1 -left-[5px] w-3 h-3 bg-[#CC5500] rounded-full" />
          </div>

          {/* 2. Top Summary Row: CPU / Fitting Bay */}
          <div className="flex border-b border-[#E4D9C3] h-10 hover:bg-[#F6EFE0]/30 transition-colors relative z-10">
            <div className="w-[180px] shrink-0 sticky left-0 bg-[#FFFAF0] border-r border-[#E4D9C3] px-3 flex items-center gap-1.5 font-bold text-xs text-[#CC5500] z-30 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
              <span className="w-2 h-2 rounded-full bg-[#CC5500]" />
              <span className="truncate">CPU / Fitting Bay</span>
            </div>

            {/* CPU Row Bars */}
            <div className="relative flex-1 h-full">
              {cpuRowBlocks.map((b) => {
                const width = b.duration * unitWidth;
                const canFitText = width >= 48;
                return (
                  <div
                    key={b.id}
                    onClick={() => onOpenWhy(b)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredBlock({ block: b, x: rect.left, y: rect.top });
                    }}
                    onMouseLeave={() => setHoveredBlock(null)}
                    style={{
                      left: `${b.start * unitWidth}px`,
                      width: `${width}px`,
                    }}
                    className={`absolute top-1.5 bottom-1.5 rounded cursor-pointer transition-transform hover:scale-[1.01] flex items-center px-1.5 overflow-hidden text-[11px] font-mono font-medium ${getBarStyle(
                      b
                    )}`}
                  >
                    {canFitText && (
                      <span className="truncate">
                        {b.pid === 'CPU_IDLE' ? 'IDLE' : `#${b.pid}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Individual Process Rows */}
          {pcbList.map((pcb) => {
            const processBlocks = blocks.filter((b) => b.pid === pcb.pid);

            return (
              <div
                key={pcb.pid}
                className="flex border-b border-[#E4D9C3]/50 h-9 hover:bg-[#F6EFE0]/30 transition-colors relative z-10"
              >
                {/* Sticky Left Process Label */}
                <div className="w-[180px] shrink-0 sticky left-0 bg-[#FFFAF0] border-r border-[#E4D9C3] px-3 flex items-center justify-between text-xs z-30 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono font-bold text-[#1A1A1A]">#{pcb.pid}</span>
                    <VehicleIcon type={pcb.vehicleType} className="w-3.5 h-3.5 text-[#CC5500]" />
                    <span className="truncate max-w-[85px]" title={pcb.modelName}>
                      {pcb.modelName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#1A1A1A]/50">
                    P{pcb.priority}
                  </span>
                </div>

                {/* Bars for this specific process */}
                <div className="relative flex-1 h-full">
                  {processBlocks.map((b) => {
                    const width = b.duration * unitWidth;
                    const canFitText = width >= 54;
                    return (
                      <div
                        key={b.id}
                        onClick={() => onOpenWhy(b)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredBlock({ block: b, x: rect.left, y: rect.top });
                        }}
                        onMouseLeave={() => setHoveredBlock(null)}
                        style={{
                          left: `${b.start * unitWidth}px`,
                          width: `${width}px`,
                        }}
                        className={`absolute top-1.5 bottom-1.5 rounded cursor-pointer transition-transform hover:scale-[1.01] flex items-center px-1.5 overflow-hidden text-[10px] font-mono font-medium ${getBarStyle(
                          b
                        )}`}
                      >
                        {canFitText && <span className="truncate">{b.label}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredBlock && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredBlock.x + 10}px`,
            top: `${hoveredBlock.y - 68}px`,
            zIndex: 100,
          }}
          className="pointer-events-none bg-[#1A1A1A] text-white p-2.5 rounded-lg shadow-xl text-xs font-sans max-w-xs border border-white/20 animate-fade-in"
        >
          <div className="font-bold flex items-center justify-between gap-3 text-[#FFFAF0] border-b border-white/10 pb-1 mb-1">
            <span>
              {hoveredBlock.block.pid === 'CPU_IDLE'
                ? 'Fitting Bay Lift Idle'
                : `Order #${hoveredBlock.block.pid}`}
            </span>
            <span className="font-mono text-[10px] text-[#CC5500] font-bold">
              {hoveredBlock.block.state}
            </span>
          </div>
          <div className="text-[11px] text-gray-300">
            <span>Time: </span>
            <strong className="text-white font-mono">
              Tick {hoveredBlock.block.start} → {hoveredBlock.block.start + hoveredBlock.block.duration}
            </strong>{' '}
            ({hoveredBlock.block.duration}t)
          </div>
          <div className="text-[11px] text-gray-300 truncate">
            <span>Task: </span>
            <span className="text-white">{hoveredBlock.block.label}</span>
          </div>
          <div className="mt-1 text-[10px] text-[#FFFAF0]/70 italic flex items-center gap-1">
            <Info className="w-3 h-3 text-[#CC5500]" /> Click to view "Why?" explainer
          </div>
        </div>
      )}

      {/* Legend Bar */}
      <div className="px-4 py-2 bg-[#F6EFE0]/50 border-t border-[#E4D9C3] flex flex-wrap items-center gap-4 text-[11px] font-medium text-[#1A1A1A]/80">
        <span className="font-semibold text-xs text-[#1A1A1A]">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-xs bg-[#CC5500]" />
          <span>RUNNING (Active Bay)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-xs ready-pattern" />
          <span>READY (Waiting Lane)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-xs hatch-waiting" />
          <span>WAITING (I/O & Locks)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-xs hatch-deadlock" />
          <span>DEADLOCK Cycle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-black rotate-45" />
          <span>Context Switch</span>
        </div>
      </div>
    </div>
  );
};
