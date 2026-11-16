import React, { useState } from 'react';
import { LogEntry, LogLevel } from '../../kernel/kernelLog';
import { Search, Filter, Trash2, Terminal, Info } from 'lucide-react';

interface LogPanelProps {
  entries: LogEntry[];
  onClear: () => void;
  onSelectLogEntry?: (entry: LogEntry) => void;
}

export const LogPanel: React.FC<LogPanelProps> = ({
  entries,
  onClear,
  onSelectLogEntry,
}) => {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [pidFilter, setPidFilter] = useState<string>('ALL');
  const [syscallFilter, setSyscallFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const uniquePids = Array.from(
    new Set(entries.map((e) => e.pid).filter((p): p is number => p !== undefined))
  ).sort((a, b) => a - b);

  const uniqueSyscalls = Array.from(
    new Set(entries.map((e) => e.syscall).filter((s): s is string => s !== undefined))
  );

  const filteredEntries = entries.filter((e) => {
    if (levelFilter !== 'ALL' && e.level !== levelFilter) return false;
    if (pidFilter !== 'ALL' && e.pid !== Number(pidFilter)) return false;
    if (syscallFilter !== 'ALL' && e.syscall !== syscallFilter) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        e.message.toLowerCase().includes(q) ||
        (e.syscall && e.syscall.toLowerCase().includes(q)) ||
        e.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'ERROR':
        return 'text-[#B3261E] bg-[#B3261E]/10 font-bold';
      case 'WARN':
        return 'text-[#D97706] bg-[#D97706]/10 font-semibold';
      case 'DEBUG':
        return 'text-[#475569] bg-[#475569]/10';
      case 'INFO':
      default:
        return 'text-[#1A1A1A] bg-[#1A1A1A]/5';
    }
  };

  return (
    <div className="bg-[#FFFAF0] border border-[#E4D9C3] rounded-xl shadow-xs overflow-hidden flex flex-col h-full">
      {/* Log Header */}
      <div className="px-4 py-2 bg-[#F6EFE0]/70 border-b border-[#E4D9C3] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-display font-semibold text-sm text-[#1A1A1A]">
          <Terminal className="w-4 h-4 text-[#CC5500]" />
          <span>Kernel Audit Log</span>
          <span className="font-mono text-[11px] text-[#1A1A1A]/60">
            ({filteredEntries.length} / {entries.length})
          </span>
        </div>

        <button
          onClick={onClear}
          className="p-1 border border-[#1A1A1A]/20 hover:bg-white rounded text-[#1A1A1A] transition-colors"
          title="Clear Kernel Log"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Strip */}
      <div className="p-2.5 bg-[#F6EFE0]/40 border-b border-[#E4D9C3] grid grid-cols-4 gap-2 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-[#1A1A1A]/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search log messages..."
            className="w-full pl-7 pr-2 py-1 bg-white border border-[#E4D9C3] rounded text-[11px]"
          />
        </div>

        {/* Level Filter */}
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="bg-white border border-[#E4D9C3] rounded px-2 py-1 text-[11px]"
        >
          <option value="ALL">All Levels</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="DEBUG">DEBUG</option>
        </select>

        {/* PID Filter */}
        <select
          value={pidFilter}
          onChange={(e) => setPidFilter(e.target.value)}
          className="bg-white border border-[#E4D9C3] rounded px-2 py-1 text-[11px]"
        >
          <option value="ALL">All PIDs</option>
          {uniquePids.map((pid) => (
            <option key={pid} value={pid}>
              PID #{pid}
            </option>
          ))}
        </select>

        {/* Syscall Filter */}
        <select
          value={syscallFilter}
          onChange={(e) => setSyscallFilter(e.target.value)}
          className="bg-white border border-[#E4D9C3] rounded px-2 py-1 text-[11px]"
        >
          <option value="ALL">All Syscalls</option>
          {uniqueSyscalls.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Log Output Stream */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-1 max-h-[360px] bg-[#FFFAF0]">
        {filteredEntries.length === 0 ? (
          <div className="py-8 text-center text-[#1A1A1A]/40 text-xs">
            No matching log entries found.
          </div>
        ) : (
          filteredEntries.map((e) => (
            <div
              key={e.id}
              onClick={() => onSelectLogEntry && onSelectLogEntry(e)}
              className="p-1 rounded hover:bg-[#F6EFE0] transition-colors flex items-start gap-2 border-b border-[#E4D9C3]/20 cursor-pointer"
            >
              {/* Tick */}
              <span className="text-[#1A1A1A]/50 shrink-0 tabular-nums">
                T+{e.tick.toString().padStart(3, '0')}
              </span>

              {/* Level badge */}
              <span className={`px-1 py-0.2 rounded text-[9px] shrink-0 font-bold ${getLevelColor(e.level)}`}>
                {e.level}
              </span>

              {/* Source & Syscall */}
              <span className="text-[#CC5500] shrink-0 font-bold">
                [{e.source}{e.syscall ? `:${e.syscall}` : ''}]
              </span>

              {/* PID if present */}
              {e.pid !== undefined && (
                <span className="text-[#0284C7] shrink-0 font-bold">
                  (PID #{e.pid})
                </span>
              )}

              {/* Message */}
              <span className="text-[#1A1A1A] break-words flex-1 leading-snug">
                {e.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
