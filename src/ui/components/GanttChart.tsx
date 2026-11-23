import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GanttBlock } from '../../models/snapshot';
import { PCB } from '../../models/pcb';
import { ViewMode } from '../../skin/dictionary';
import { ZoomIn, ZoomOut, Cpu, Info, X, HelpCircle, PlayCircle, Sparkles } from 'lucide-react';

export interface ProcessSchedulingMetrics {
  arrivalTime?: number;
  burstTime?: number;
  completionTime?: number | null;
  turnaroundTime?: number;
  waitingTime?: number;
}

export interface CpuGanttSlice {
  id: string;
  processId: string;
  numericPid?: number;
  startTime: number;
  endTime: number;
  isIdle: boolean;
  label?: string;
  whyReason?: string;
  metrics?: ProcessSchedulingMetrics;
  sourceBlock?: GanttBlock;
}

interface GanttChartProps {
  blocks?: GanttBlock[];
  pcbs?: Record<number, PCB>;
  slices?: CpuGanttSlice[];
  processMetrics?: Record<string, ProcessSchedulingMetrics>;
  currentClock?: number;
  isRunning?: boolean;
  onOpenWhy?: (block: GanttBlock) => void;
  viewMode?: ViewMode;
}

export const SAMPLE_PROCESS_METRICS: Record<string, ProcessSchedulingMetrics> = {
  P1: { arrivalTime: 2, burstTime: 6, completionTime: 13, turnaroundTime: 11, waitingTime: 5 },
  P2: { arrivalTime: 3, burstTime: 2, completionTime: 7, turnaroundTime: 4, waitingTime: 2 },
  P3: { arrivalTime: 4, burstTime: 5, completionTime: 15, turnaroundTime: 11, waitingTime: 6 },
  P4: { arrivalTime: 17, burstTime: 4, completionTime: 21, turnaroundTime: 4, waitingTime: 0 },
};

export const SAMPLE_CPU_SLICES: CpuGanttSlice[] = [
  {
    id: 'sample_idle_0_2',
    processId: 'IDLE',
    startTime: 0,
    endTime: 2,
    isIdle: true,
    label: 'No ready process (waiting for first arrival at 2 ms)',
  },
  {
    id: 'sample_p1_2_5',
    processId: 'P1',
    startTime: 2,
    endTime: 5,
    isIdle: false,
    label: 'Quantum slice 1 (preempted at 5 ms)',
    metrics: SAMPLE_PROCESS_METRICS.P1,
  },
  {
    id: 'sample_p2_5_7',
    processId: 'P2',
    startTime: 5,
    endTime: 7,
    isIdle: false,
    label: 'Sequential burst to completion',
    metrics: SAMPLE_PROCESS_METRICS.P2,
  },
  {
    id: 'sample_p3_7_10',
    processId: 'P3',
    startTime: 7,
    endTime: 10,
    isIdle: false,
    label: 'Quantum slice 1 (preempted at 10 ms)',
    metrics: SAMPLE_PROCESS_METRICS.P3,
  },
  {
    id: 'sample_p1_10_13',
    processId: 'P1',
    startTime: 10,
    endTime: 13,
    isIdle: false,
    label: 'Resumed slice 2 (completed)',
    metrics: SAMPLE_PROCESS_METRICS.P1,
  },
  {
    id: 'sample_p3_13_15',
    processId: 'P3',
    startTime: 13,
    endTime: 15,
    isIdle: false,
    label: 'Resumed slice 2 (completed)',
    metrics: SAMPLE_PROCESS_METRICS.P3,
  },
  {
    id: 'sample_idle_15_17',
    processId: 'IDLE',
    startTime: 15,
    endTime: 17,
    isIdle: true,
    label: 'CPU idle gap before P4 arrives at 17 ms',
  },
  {
    id: 'sample_p4_17_21',
    processId: 'P4',
    startTime: 17,
    endTime: 21,
    isIdle: false,
    label: 'Sequential execution to completion',
    metrics: SAMPLE_PROCESS_METRICS.P4,
  },
];

const PROCESS_PALETTE = [
  { bg: '#CC5500', border: '#9E4200', text: '#FFFFFF', softBg: '#CC5500/12' },
  { bg: '#2563EB', border: '#1D4ED8', text: '#FFFFFF', softBg: '#2563EB/12' },
  { bg: '#0F766E', border: '#115E59', text: '#FFFFFF', softBg: '#0F766E/12' },
  { bg: '#B45309', border: '#92400E', text: '#FFFFFF', softBg: '#B45309/12' },
  { bg: '#6D28D9', border: '#5B21B6', text: '#FFFFFF', softBg: '#6D28D9/12' },
  { bg: '#BE123C', border: '#9F1239', text: '#FFFFFF', softBg: '#BE123C/12' },
  { bg: '#15803D', border: '#166534', text: '#FFFFFF', softBg: '#15803D/12' },
  { bg: '#374151', border: '#1F2937', text: '#FFFFFF', softBg: '#374151/12' },
];

function getProcessColor(processId: string) {
  const numMatch = processId.match(/\d+/);
  if (numMatch) {
    const num = Math.max(0, parseInt(numMatch[0], 10) - 1);
    return PROCESS_PALETTE[num % PROCESS_PALETTE.length];
  }
  let hash = 0;
  for (let i = 0; i < processId.length; i++) {
    hash = (hash * 31 + processId.charCodeAt(i)) >>> 0;
  }
  return PROCESS_PALETTE[hash % PROCESS_PALETTE.length];
}

function derivePcbMetrics(pcb?: PCB): ProcessSchedulingMetrics | undefined {
  if (!pcb) return undefined;
  const arrivalTime = pcb.arrivalTime;
  const burstTime = pcb.totalCpuBurst;
  const completionTime = pcb.completionTime;
  const turnaroundTime =
    completionTime !== null ? Math.max(0, completionTime - arrivalTime) : undefined;
  const waitingTime =
    turnaroundTime !== undefined ? Math.max(0, turnaroundTime - burstTime) : pcb.waitingTime;

  return {
    arrivalTime,
    burstTime,
    completionTime,
    turnaroundTime,
    waitingTime,
  };
}

export function buildCpuSlicesFromKernelBlocks(
  blocks: GanttBlock[],
  pcbs: Record<number, PCB> = {},
  externalMetrics?: Record<string, ProcessSchedulingMetrics>
): CpuGanttSlice[] {
  const cpuBlocks = blocks
    .filter((b) => (b.pid === 'CPU_IDLE' || b.state === 'RUNNING') && b.duration > 0)
    .sort((a, b) => a.start - b.start);

  if (cpuBlocks.length === 0) return [];

  const slices: CpuGanttSlice[] = [];
  let cursor = 0;

  for (const block of cpuBlocks) {
    const startTime = Math.max(cursor, block.start);
    const endTime = block.start + block.duration;
    if (endTime <= startTime) continue;

    if (startTime > cursor) {
      slices.push({
        id: `idle_gap_${cursor}_${startTime}`,
        processId: 'IDLE',
        startTime: cursor,
        endTime: startTime,
        isIdle: true,
        label: 'CPU idle (no ready process)',
      });
    }

    const isIdle = block.pid === 'CPU_IDLE' || block.state === 'IDLE';
    const numericPid = typeof block.pid === 'number' ? block.pid : undefined;
    const processId = isIdle ? 'IDLE' : `P${block.pid}`;
    const pcb = numericPid !== undefined ? pcbs[numericPid] : undefined;
    const metrics = isIdle
      ? undefined
      : externalMetrics?.[processId] ?? derivePcbMetrics(pcb);

    const prev = slices[slices.length - 1];
    if (prev && prev.isIdle && isIdle && prev.endTime === startTime) {
      prev.endTime = endTime;
    } else if (
      prev &&
      !prev.isIdle &&
      !isIdle &&
      prev.processId === processId &&
      prev.endTime === startTime
    ) {
      prev.endTime = endTime;
    } else {
      slices.push({
        id: block.id,
        processId,
        numericPid,
        startTime,
        endTime,
        isIdle,
        label: block.label,
        whyReason: block.whyReason,
        metrics,
        sourceBlock: block,
      });
    }

    cursor = endTime;
  }

  return slices;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  blocks = [],
  pcbs = {},
  slices: explicitSlices,
  processMetrics,
  currentClock = 0,
  isRunning = false,
  onOpenWhy,
  viewMode = 'OS',
}) => {
  const [unitWidth, setUnitWidth] = useState<number>(36);
  const [manualMode, setManualMode] = useState<'auto' | 'sample' | 'live'>('auto');
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);
  const [hoveredProcessId, setHoveredProcessId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const liveSlices = useMemo(() => {
    if (explicitSlices) {
      return [...explicitSlices]
        .filter((s) => s.endTime > s.startTime)
        .sort((a, b) => a.startTime - b.startTime)
        .map((s) => ({
          ...s,
          metrics: s.metrics ?? (!s.isIdle ? processMetrics?.[s.processId] : undefined),
        }));
    }
    return buildCpuSlicesFromKernelBlocks(blocks, pcbs, processMetrics);
  }, [explicitSlices, blocks, pcbs, processMetrics]);

  const hasLiveData = liveSlices.length > 0;
  const showingSample =
    !explicitSlices && (manualMode === 'sample' || (manualMode === 'auto' && !hasLiveData));

  const activeSlices = showingSample ? SAMPLE_CPU_SLICES : liveSlices;

  useEffect(() => {
    if (isRunning && manualMode === 'sample') {
      setManualMode('auto');
    }
  }, [isRunning, manualMode]);

  const selectedSlice = useMemo(
    () => activeSlices.find((s) => s.id === selectedSliceId) || null,
    [activeSlices, selectedSliceId]
  );

  const hoveredSlice = useMemo(
    () => activeSlices.find((s) => s.id === hoveredSliceId) || null,
    [activeSlices, hoveredSliceId]
  );

  const processOccurrenceMap = useMemo(() => {
    const counts: Record<string, number> = {};
    const indexById: Record<string, number> = {};
    for (const s of activeSlices) {
      if (s.isIdle) continue;
      counts[s.processId] = (counts[s.processId] || 0) + 1;
      indexById[s.id] = counts[s.processId];
    }
    return { counts, indexById };
  }, [activeSlices]);

  const legendProcesses = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ processId: string; sliceCount: number }> = [];
    for (const s of activeSlices) {
      if (s.isIdle || seen.has(s.processId)) continue;
      seen.add(s.processId);
      list.push({
        processId: s.processId,
        sliceCount: processOccurrenceMap.counts[s.processId] || 1,
      });
    }
    return list;
  }, [activeSlices, processOccurrenceMap]);

  const boundaryTicks = useMemo(() => {
    if (activeSlices.length === 0) return [0];
    const set = new Set<number>();
    set.add(0);
    for (const s of activeSlices) {
      set.add(s.startTime);
      set.add(s.endTime);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [activeSlices]);

  const timelineEnd = useMemo(() => {
    const lastSliceEnd = activeSlices.length > 0 ? activeSlices[activeSlices.length - 1].endTime : 0;
    return Math.max(lastSliceEnd, showingSample ? 21 : currentClock, 10);
  }, [activeSlices, showingSample, currentClock]);

  const chartPixelWidth = Math.max(timelineEnd * unitWidth, 320);

  useEffect(() => {
    if (isRunning && !showingSample && containerRef.current) {
      const scrollPos = currentClock * unitWidth - containerRef.current.clientWidth + 160;
      if (scrollPos > 0) {
        containerRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }
    }
  }, [currentClock, isRunning, showingSample, unitWidth]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSliceId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const renderMetricGrid = (metrics?: ProcessSchedulingMetrics) => {
    if (!metrics) return null;
    const items = [
      { label: 'AT', title: 'Arrival Time', value: metrics.arrivalTime !== undefined ? `${metrics.arrivalTime} ms` : '—' },
      { label: 'BT', title: 'Burst Time', value: metrics.burstTime !== undefined ? `${metrics.burstTime} ms` : '—' },
      {
        label: 'CT',
        title: 'Completion Time',
        value:
          metrics.completionTime !== null && metrics.completionTime !== undefined
            ? `${metrics.completionTime} ms`
            : 'In progress',
      },
      { label: 'TAT', title: 'Turnaround Time', value: metrics.turnaroundTime !== undefined ? `${metrics.turnaroundTime} ms` : '—' },
      { label: 'WT', title: 'Waiting Time', value: metrics.waitingTime !== undefined ? `${metrics.waitingTime} ms` : '—' },
    ];

    return (
      <div className="grid grid-cols-5 gap-1.5 pt-1.5 mt-1.5 border-t border-current/15 font-mono text-[10px]">
        {items.map((item) => (
          <div key={item.label} title={item.title} className="flex flex-col">
            <span className="opacity-65 text-[9px] uppercase tracking-wider">{item.label}</span>
            <span className="font-semibold tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const tickLayout = useMemo(() => {
    let lastPrimaryPx = -Infinity;
    return boundaryTicks.map((t, idx) => {
      const px = t * unitWidth;
      const isFirst = idx === 0;
      const isLast = idx === boundaryTicks.length - 1;
      const tooClose = !isFirst && px - lastPrimaryPx < 24;
      if (!tooClose) {
        lastPrimaryPx = px;
      }
      return { tick: t, px, isFirst, isLast, staggered: tooClose };
    });
  }, [boundaryTicks, unitWidth]);

  const computeClampedTooltipStyle = (x: number, y: number): React.CSSProperties => {
    const tooltipWidth = 280;
    const clampedLeft =
      typeof window !== 'undefined'
        ? Math.min(Math.max(12, x - tooltipWidth / 2), window.innerWidth - tooltipWidth - 12)
        : x;
    const showBelow = y < 175;
    return {
      position: 'fixed',
      left: `${clampedLeft}px`,
      top: showBelow ? `${y + 72}px` : `${y - 12}px`,
      transform: showBelow ? 'none' : 'translateY(-100%)',
      zIndex: 100,
    };
  };

  const busyMs = activeSlices.reduce(
    (sum, s) => (s.isIdle ? sum : sum + (s.endTime - s.startTime)),
    0
  );
  const idleMs = activeSlices.reduce(
    (sum, s) => (s.isIdle ? sum + (s.endTime - s.startTime) : sum),
    0
  );

  return (
    <div className="bg-[#FFFAF0] border border-[#E4D9C3] rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="px-4 py-2.5 bg-[#F6EFE0]/70 border-b border-[#E4D9C3] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-md bg-[#CC5500]/15 text-[#CC5500] flex items-center justify-center shrink-0">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold text-sm text-[#1A1A1A] truncate">
                {viewMode === 'STORY'
                  ? 'Single-Bay Lift CPU Gantt Chart'
                  : 'CPU Scheduling Gantt Chart'}
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-[#1A1A1A]/8 text-[#1A1A1A]/75 font-mono text-[10px] font-semibold">
                1 Core · ms
              </span>
              {showingSample && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#CC5500]/12 text-[#CC5500] font-mono text-[10px] font-semibold">
                  <Sparkles className="w-2.5 h-2.5" />
                  Sample Preview
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#1A1A1A]/60 truncate">
              Single-core sequential execution timeline — hover or click any slice for timing &amp; metrics
            </p>
          </div>
        </div>

        {/* Controls: Sample/Live Switch + Zoom */}
        <div className="flex items-center gap-2">
          {!explicitSlices && (
            <div className="inline-flex rounded-md border border-[#E4D9C3] bg-[#F6EFE0] p-0.5 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => {
                  setManualMode('live');
                  setSelectedSliceId(null);
                }}
                className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                  !showingSample
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#1A1A1A]/70 hover:text-[#1A1A1A]'
                }`}
                title="View live kernel CPU execution"
              >
                <PlayCircle className="w-3 h-3" />
                Live
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualMode('sample');
                  setSelectedSliceId(null);
                }}
                className={`px-2 py-0.5 rounded transition-colors ${
                  showingSample
                    ? 'bg-[#CC5500] text-white'
                    : 'text-[#1A1A1A]/70 hover:text-[#1A1A1A]'
                }`}
                title="Preview sample sequential + preemptive schedule with idle gaps"
              >
                Sample
              </button>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setUnitWidth((w) => Math.max(18, w - 4))}
              className="p-1 border border-[#1A1A1A]/25 rounded hover:bg-white text-[#1A1A1A] transition-colors"
              title="Zoom Out (narrow ms scale)"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-[#1A1A1A]/70 w-10 text-center tabular-nums">
              {unitWidth}px
            </span>
            <button
              type="button"
              onClick={() => setUnitWidth((w) => Math.min(72, w + 4))}
              className="p-1 border border-[#1A1A1A]/25 rounded hover:bg-white text-[#1A1A1A] transition-colors"
              title="Zoom In (wider ms scale)"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Single-Core Sequential Timeline Body */}
      <div className="px-4 pt-4 pb-3">
        {/* Core Summary Strip */}
        <div className="flex items-center justify-between text-[11px] mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#CC5500]" />
            <span className="font-mono font-bold text-[#1A1A1A] uppercase tracking-wide text-[10px]">
              CPU Core 0
            </span>
            <span className="text-[#1A1A1A]/50 font-mono text-[10px]">
              ({activeSlices.length} {activeSlices.length === 1 ? 'slice' : 'slices'})
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-[#1A1A1A]/70 tabular-nums">
            <span>
              Busy: <strong className="text-[#1A1A1A]">{busyMs} ms</strong>
            </span>
            <span>
              Idle: <strong className="text-[#1A1A1A]">{idleMs} ms</strong>
            </span>
          </div>
        </div>

        {/* Scrollable Single Timeline Container */}
        <div
          ref={containerRef}
          className="overflow-x-auto pb-2"
        >
          {activeSlices.length === 0 ? (
            <div className="h-24 rounded-lg border border-dashed border-[#D6C7AA] bg-[#F6EFE0]/40 flex flex-col items-center justify-center text-center px-4">
              <p className="text-xs font-medium text-[#1A1A1A]/70">
                No CPU execution slices recorded yet.
              </p>
              <p className="text-[11px] text-[#1A1A1A]/50 mt-0.5">
                Press Play or Step to execute orders on CPU Core 0, or switch to Sample to preview preemption &amp; idle gaps.
              </p>
            </div>
          ) : (
            <div
              style={{ width: `${chartPixelWidth + 32}px` }}
              className="relative select-none pr-8"
            >
              {/* Execution Bar Track */}
              <div
                style={{ width: `${chartPixelWidth}px` }}
                className="relative h-16 bg-[#F6EFE0]/60 border border-[#D6C7AA] rounded-lg overflow-hidden"
              >
                {/* Live Clock Cursor */}
                {!showingSample && currentClock > 0 && (
                  <div
                    style={{ left: `${currentClock * unitWidth}px` }}
                    className="absolute top-0 bottom-0 w-[2px] bg-[#CC5500] z-20 pointer-events-none shadow-[0_0_6px_rgba(204,85,0,0.55)]"
                  />
                )}

                {/* Sequential Execution Slices */}
                {activeSlices.map((slice) => {
                  const duration = slice.endTime - slice.startTime;
                  const leftPx = slice.startTime * unitWidth;
                  const widthPx = duration * unitWidth;
                  const color = slice.isIdle ? null : getProcessColor(slice.processId);
                  const isSelected = selectedSliceId === slice.id;
                  const isSameProcessHovered =
                    !slice.isIdle && hoveredProcessId === slice.processId;
                  const isDimmed =
                    hoveredProcessId !== null &&
                    !slice.isIdle &&
                    hoveredProcessId !== slice.processId;

                  const sliceIndex = processOccurrenceMap.indexById[slice.id];
                  const totalSlicesForPid = processOccurrenceMap.counts[slice.processId] || 1;
                  const isPreemptedSegment = !slice.isIdle && totalSlicesForPid > 1;

                  const showPrimaryLabel = widthPx >= 26;
                  const showDuration = widthPx >= 46;
                  const showRange = widthPx >= 92;

                  return (
                    <button
                      key={slice.id}
                      type="button"
                      onClick={() =>
                        setSelectedSliceId((prev) => (prev === slice.id ? null : slice.id))
                      }
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredSliceId(slice.id);
                        setHoveredProcessId(slice.isIdle ? null : slice.processId);
                        setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                      }}
                      onMouseLeave={() => {
                        setHoveredSliceId(null);
                        setHoveredProcessId(null);
                        setTooltipPos(null);
                      }}
                      style={{
                        left: `${leftPx}px`,
                        width: `${widthPx}px`,
                        ...(color
                          ? {
                              backgroundColor: color.bg,
                              borderColor: color.border,
                              color: color.text,
                            }
                          : {}),
                      }}
                      className={`absolute top-0 bottom-0 flex flex-col items-center justify-center px-1 border-r transition-all cursor-pointer focus:outline-none ${
                        slice.isIdle
                          ? 'cpu-idle-pattern text-[#52525B] border-[#CBD5E1]'
                          : 'border-white/30'
                      } ${
                        isSelected
                          ? 'ring-2 ring-inset ring-[#1A1A1A] brightness-105 z-10'
                          : isSameProcessHovered
                          ? 'brightness-110 z-10'
                          : isDimmed
                          ? 'opacity-55'
                          : 'hover:brightness-105'
                      }`}
                      aria-label={
                        slice.isIdle
                          ? `IDLE from ${slice.startTime} to ${slice.endTime} ms`
                          : `${slice.processId} from ${slice.startTime} to ${slice.endTime} ms (${duration} ms)`
                      }
                    >
                      {showPrimaryLabel && (
                        <div className="flex items-center gap-1 leading-tight max-w-full">
                          <span
                            className={`font-mono font-bold truncate ${
                              slice.isIdle ? 'text-[10px] tracking-wider' : 'text-xs'
                            }`}
                          >
                            {slice.isIdle ? 'IDLE' : slice.processId}
                          </span>
                          {isPreemptedSegment && widthPx >= 52 && (
                            <span className="text-[9px] font-mono px-1 rounded bg-black/20 leading-tight">
                              #{sliceIndex}
                            </span>
                          )}
                        </div>
                      )}
                      {showDuration && (
                        <span
                          className={`font-mono text-[10px] leading-tight tabular-nums ${
                            slice.isIdle ? 'text-[#52525B]/80' : 'text-white/85'
                          }`}
                        >
                          {showRange
                            ? `${slice.startTime}–${slice.endTime} ms (${duration})`
                            : `${duration} ms`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Time Axis with Exact Slice Boundaries */}
              <div
                style={{ width: `${chartPixelWidth}px` }}
                className="relative h-9 border-t border-[#1A1A1A]/35 mt-0.5"
              >
                {tickLayout.map(({ tick, px, isFirst, isLast, staggered }) => (
                  <div
                    key={tick}
                    style={{ left: `${px}px` }}
                    className="absolute top-0 flex flex-col items-center pointer-events-none"
                  >
                    <div
                      className={`w-px bg-[#1A1A1A]/75 ${
                        staggered ? 'h-4' : 'h-2'
                      }`}
                    />
                    <span
                      className={`font-mono text-[11px] font-semibold text-[#1A1A1A] tabular-nums leading-none mt-0.5 whitespace-nowrap ${
                        isFirst
                          ? 'translate-x-0 self-start'
                          : isLast
                          ? '-translate-x-1/2'
                          : '-translate-x-1/2'
                      }`}
                    >
                      {tick}
                      {isLast ? ' ms' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pinned Click Tooltip / Slice Inspector */}
      {selectedSlice && (
        <div className="mx-4 mb-3 p-3 rounded-lg bg-[#F6EFE0] border border-[#CC5500]/40 text-xs flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                  selectedSlice.isIdle
                    ? 'bg-[#E5E7EB] text-[#374151]'
                    : 'text-white'
                }`}
                style={
                  selectedSlice.isIdle
                    ? undefined
                    : { backgroundColor: getProcessColor(selectedSlice.processId).bg }
                }
              >
                {selectedSlice.isIdle ? 'IDLE' : selectedSlice.processId}
              </span>
              <span className="font-mono font-semibold text-[#1A1A1A] tabular-nums">
                {selectedSlice.startTime} ms → {selectedSlice.endTime} ms
              </span>
              <span className="font-mono text-[11px] text-[#1A1A1A]/70 tabular-nums">
                (Duration: {selectedSlice.endTime - selectedSlice.startTime} ms)
              </span>
              {!selectedSlice.isIdle &&
                (processOccurrenceMap.counts[selectedSlice.processId] || 1) > 1 && (
                  <span className="px-1.5 py-0.5 rounded bg-[#1A1A1A]/10 text-[#1A1A1A] font-mono text-[10px]">
                    Preempted · Slice {processOccurrenceMap.indexById[selectedSlice.id]} of{' '}
                    {processOccurrenceMap.counts[selectedSlice.processId]}
                  </span>
                )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {selectedSlice.sourceBlock && onOpenWhy && (
                <button
                  type="button"
                  onClick={() => onOpenWhy(selectedSlice.sourceBlock!)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#CC5500] hover:bg-[#A84500] text-white text-[11px] font-medium transition-colors"
                >
                  <HelpCircle className="w-3 h-3" />
                  Why?
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedSliceId(null)}
                className="p-1 rounded hover:bg-black/10 text-[#1A1A1A]/70"
                aria-label="Close slice details"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {selectedSlice.label && (
            <p className="text-[11px] text-[#1A1A1A]/75">{selectedSlice.label}</p>
          )}

          {!selectedSlice.isIdle && renderMetricGrid(selectedSlice.metrics)}
        </div>
      )}

      {/* Floating Hover Tooltip */}
      {hoveredSlice && tooltipPos && (
        <div
          style={computeClampedTooltipStyle(tooltipPos.x, tooltipPos.y)}
          className="pointer-events-none bg-[#1A1A1A] text-[#FFFAF0] p-2.5 rounded-lg shadow-xl text-xs font-sans w-[280px] border border-white/15"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{
                  backgroundColor: hoveredSlice.isIdle
                    ? '#9CA3AF'
                    : getProcessColor(hoveredSlice.processId).bg,
                }}
              />
              <span className="font-mono font-bold text-xs">
                {hoveredSlice.isIdle ? 'CPU IDLE' : `Process ${hoveredSlice.processId}`}
              </span>
            </div>
            {!hoveredSlice.isIdle &&
              (processOccurrenceMap.counts[hoveredSlice.processId] || 1) > 1 && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[#FCD34D]">
                  Slice {processOccurrenceMap.indexById[hoveredSlice.id]}/
                  {processOccurrenceMap.counts[hoveredSlice.processId]}
                </span>
              )}
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono text-[11px] tabular-nums">
            <div>
              <span className="text-[9px] uppercase text-white/55 block">Start</span>
              <span className="font-semibold text-white">{hoveredSlice.startTime} ms</span>
            </div>
            <div>
              <span className="text-[9px] uppercase text-white/55 block">End</span>
              <span className="font-semibold text-white">{hoveredSlice.endTime} ms</span>
            </div>
            <div>
              <span className="text-[9px] uppercase text-white/55 block">Duration</span>
              <span className="font-semibold text-[#FDBA74]">
                {hoveredSlice.endTime - hoveredSlice.startTime} ms
              </span>
            </div>
          </div>

          {hoveredSlice.label && (
            <div className="mt-1.5 text-[11px] text-white/75 truncate">
              {hoveredSlice.label}
            </div>
          )}

          {!hoveredSlice.isIdle && renderMetricGrid(hoveredSlice.metrics)}

          <div className="mt-1.5 pt-1 border-t border-white/10 text-[10px] text-white/60 flex items-center gap-1">
            <Info className="w-3 h-3 text-[#CC5500]" />
            <span>Click slice to pin timing &amp; scheduling metrics</span>
          </div>
        </div>
      )}

      {/* Legend Bar */}
      <div className="px-4 py-2 bg-[#F6EFE0]/50 border-t border-[#E4D9C3] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-[#1A1A1A]/80">
        <span className="font-semibold text-xs text-[#1A1A1A]">Legend:</span>
        {legendProcesses.map(({ processId, sliceCount }) => {
          const color = getProcessColor(processId);
          return (
            <div
              key={processId}
              onMouseEnter={() => setHoveredProcessId(processId)}
              onMouseLeave={() => setHoveredProcessId(null)}
              className="flex items-center gap-1.5 cursor-default"
            >
              <div
                className="w-3 h-3 rounded-xs border"
                style={{ backgroundColor: color.bg, borderColor: color.border }}
              />
              <span className="font-mono font-semibold text-[#1A1A1A]">{processId}</span>
              {sliceCount > 1 && (
                <span className="text-[10px] font-mono text-[#1A1A1A]/55">
                  ({sliceCount}× preempted)
                </span>
              )}
            </div>
          );
        })}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-xs cpu-idle-pattern border border-[#CBD5E1]" />
          <span>IDLE (CPU Free)</span>
        </div>
      </div>
    </div>
  );
};
