/**
 * @file TimeMachineSlider.tsx
 * @description Advanced Time Machine Controller and Snapshot Scrubber.
 * Enables live frame-by-frame inspection of any past tick T, visual scrubbing across
 * simulation history, quick navigation (first, previous, next, live), and deterministic rewind/replay.
 */

import React from 'react';
import { History, RotateCcw, FastForward, SkipBack, SkipForward, ArrowRight, Clock } from 'lucide-react';
import { ViewMode } from '../../skin/dictionary';

interface TimeMachineSliderProps {
  currentClock: number;
  totalSnapshots: number;
  previewTick: number | null;
  onPreviewTickChange: (tick: number | null) => void;
  onRewindToTick: (tick: number) => void;
  isRunning: boolean;
  viewMode: ViewMode;
}

export const TimeMachineSlider: React.FC<TimeMachineSliderProps> = ({
  currentClock,
  totalSnapshots,
  previewTick,
  onPreviewTickChange,
  onRewindToTick,
  isRunning,
  viewMode,
}) => {
  const isPreviewing = previewTick !== null && previewTick < currentClock;
  const activeTick = isPreviewing ? previewTick : currentClock;

  const handleSliderChange = (newTick: number) => {
    if (newTick >= currentClock) {
      onPreviewTickChange(null);
    } else {
      onPreviewTickChange(newTick);
    }
  };

  const handleStepBack = () => {
    const target = Math.max(0, activeTick - 1);
    handleSliderChange(target);
  };

  const handleStepForward = () => {
    const target = activeTick + 1;
    handleSliderChange(target);
  };

  const handleJumpToFirst = () => {
    handleSliderChange(0);
  };

  const handleReturnToLive = () => {
    onPreviewTickChange(null);
  };

  const handleCommitRewind = () => {
    if (previewTick !== null) {
      onRewindToTick(previewTick);
      onPreviewTickChange(null);
    }
  };

  return (
    <div
      className={`border rounded-xl transition-all shadow-xs overflow-hidden ${
        isPreviewing
          ? 'bg-[#FFF9F2] border-[#CC5500]/60 ring-1 ring-[#CC5500]/30'
          : 'bg-[#FFFAF0] border-[#E4D9C3]'
      }`}
    >
      {/* Top Banner if actively inspecting historical frame */}
      {isPreviewing && (
        <div className="bg-[#CC5500]/10 border-b border-[#CC5500]/20 px-4 py-1.5 flex items-center justify-between text-xs text-[#1A1A1A]">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#CC5500]" />
            <span className="font-semibold text-[#CC5500]">
              {viewMode === 'STORY' ? 'Historical Bay Playback' : 'Time Machine Historical Frame'}
            </span>
            <span className="text-slate-500">·</span>
            <span className="font-mono font-medium">
              Showing Tick #{previewTick} (Live clock is at Tick #{currentClock})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCommitRewind}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#CC5500] hover:bg-[#A84500] text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Set simulation clock back to this tick and branch execution"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resume Simulation From Tick #{previewTick}</span>
            </button>

            <button
              onClick={handleReturnToLive}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F6EFE0] border border-[#1A1A1A]/30 text-[#1A1A1A] rounded-md text-xs font-medium transition-colors cursor-pointer"
              title="Return to the live simulation head"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Return to Live (Tick #{currentClock})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Scrubber Row */}
      <div className="p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Left Badge: Title & Snapshot Count */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className={`p-1.5 rounded-lg ${isPreviewing ? 'bg-[#CC5500] text-white' : 'bg-[#CC5500]/10 text-[#CC5500]'}`}>
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xs text-[#1A1A1A]">
                {viewMode === 'STORY' ? 'Shop Time Machine' : 'Time Machine Scrubber'}
              </span>
              <span className="text-[10px] text-[#1A1A1A]/50">
                ({totalSnapshots} ticks recorded)
              </span>
            </div>
            <span className="text-[11px] text-[#1A1A1A]/70 font-mono">
              {isPreviewing ? (
                <span className="text-[#CC5500] font-semibold">Previewing Tick #{previewTick}</span>
              ) : (
                <span className="text-emerald-700 font-medium">Synchronized with Live Simulation</span>
              )}
            </span>
          </div>
        </div>

        {/* Center: Interactive Scrubber Slider with Step Buttons */}
        <div className="flex-1 min-w-[320px] flex items-center gap-2">
          {/* Jump to T=0 */}
          <button
            onClick={handleJumpToFirst}
            disabled={activeTick === 0 || isRunning}
            className="p-1 rounded hover:bg-[#F6EFE0] disabled:opacity-30 disabled:hover:bg-transparent text-[#1A1A1A] cursor-pointer"
            title="Jump to Tick #0 (Boot initialization)"
            aria-label="Jump to First Tick"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Step Back 1 Tick */}
          <button
            onClick={handleStepBack}
            disabled={activeTick === 0 || isRunning}
            className="p-1 rounded hover:bg-[#F6EFE0] disabled:opacity-30 disabled:hover:bg-transparent text-[#1A1A1A] cursor-pointer"
            title="Step backward 1 tick in history"
            aria-label="Step Back 1 Tick"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>

          <span className="font-mono text-[11px] text-[#1A1A1A]/60 shrink-0">T+0</span>

          {/* Scrub Track */}
          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min="0"
              max={Math.max(1, currentClock)}
              value={activeTick}
              disabled={isRunning || currentClock === 0}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full accent-[#CC5500] cursor-pointer disabled:opacity-50 h-2 bg-[#E4D9C3] rounded-lg"
              aria-label="Time Machine Tick Scrubber"
            />
          </div>

          <span className="font-mono text-[11px] text-[#1A1A1A]/60 shrink-0">
            T+{currentClock}
          </span>

          {/* Step Forward 1 Tick */}
          <button
            onClick={handleStepForward}
            disabled={activeTick >= currentClock || isRunning}
            className="p-1 rounded hover:bg-[#F6EFE0] disabled:opacity-30 disabled:hover:bg-transparent text-[#1A1A1A] cursor-pointer"
            title="Step forward 1 tick"
            aria-label="Step Forward 1 Tick"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Jump to Live Head */}
          <button
            onClick={handleReturnToLive}
            disabled={!isPreviewing || isRunning}
            className="p-1 rounded hover:bg-[#F6EFE0] disabled:opacity-30 disabled:hover:bg-transparent text-[#1A1A1A] cursor-pointer"
            title="Jump to latest live tick"
            aria-label="Jump to Live Head"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-2.5 py-1 bg-black/5 border border-[#1A1A1A]/10 rounded-md font-mono text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#CC5500]" />
            <span className="text-[#1A1A1A]/70 text-[11px]">DISPLAY:</span>
            <span className="font-bold text-[#1A1A1A] tabular-nums">
              Tick #{activeTick}
            </span>
          </div>

          {!isPreviewing && currentClock > 0 && (
            <button
              onClick={() => handleSliderChange(Math.max(0, currentClock - 1))}
              disabled={isRunning}
              className="px-2.5 py-1 border border-[#1A1A1A]/30 hover:bg-[#F6EFE0] disabled:opacity-40 rounded-md font-medium text-xs text-[#1A1A1A] transition-colors cursor-pointer"
              title="Scrub backward into past simulation frames"
            >
              Scrub History
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
