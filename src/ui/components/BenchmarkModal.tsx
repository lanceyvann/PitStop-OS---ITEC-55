/**
 * @file BenchmarkModal.tsx
 * @description Benchmark Suite Matrix Runner.
 * Executes 4 scheduling algorithms (FCFS, SJF, RR, Priority) against 3 deterministic workloads
 * (CPU-heavy, I/O-heavy, balanced; 15-20 orders each) and exports results to CSV.
 */

import React, { useState } from 'react';
import { AlgorithmType } from '../../scheduler/types';
import { createBenchmarkWorkload } from '../../config/workloads';
import { Kernel } from '../../kernel/kernel';
import { X, Play, Download, CheckCircle, BarChart2 } from 'lucide-react';

interface BenchmarkResult {
  algorithm: AlgorithmType;
  workload: 'cpu-heavy' | 'io-heavy' | 'balanced';
  avgWaiting: number;
  avgTurnaround: number;
  avgResponse: number;
  cpuUtil: number;
  contextSwitches: number;
  totalTicks: number;
}

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({ isOpen, onClose }) => {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<string>('');

  if (!isOpen) return null;

  const runAllBenchmarks = () => {
    setIsRunning(true);
    setProgress('Initializing benchmark suite...');

    setTimeout(() => {
      const algos: AlgorithmType[] = ['FCFS', 'SJF', 'RR', 'PRIORITY'];
      const workloads: Array<'cpu-heavy' | 'io-heavy' | 'balanced'> = ['cpu-heavy', 'io-heavy', 'balanced'];
      const newResults: BenchmarkResult[] = [];

      for (const w of workloads) {
        for (const algo of algos) {
          setProgress(`Simulating ${algo} on ${w} workload...`);
          const kernel = new Kernel(42);
          kernel.scheduler.setAlgorithm(algo);
          kernel.scheduler.quantum = 3;

          // Generate identical seed orders
          const orders = createBenchmarkWorkload(w, 42);
          for (const order of orders) {
            kernel.submitOrder(order);
          }

          // Run simulation until all processes terminate or safety limit (1500 ticks)
          let steps = 0;
          while (steps < 1500) {
            const pcbs = Object.values(kernel.processManager.getAllPcbs());
            const allDone = pcbs.length > 0 && pcbs.every((p) => p.state === 'TERMINATED');
            if (allDone) break;

            kernel.step();
            steps += 1;
          }

          const metrics = kernel.calculateMetrics();
          newResults.push({
            algorithm: algo,
            workload: w,
            avgWaiting: metrics.avgWaitingTime,
            avgTurnaround: metrics.avgTurnaroundTime,
            avgResponse: metrics.avgResponseTime,
            cpuUtil: metrics.cpuUtilization,
            contextSwitches: metrics.contextSwitchCount,
            totalTicks: kernel.clock,
          });
        }
      }

      setResults(newResults);
      setIsRunning(false);
      setProgress('Benchmark completed!');
    }, 50);
  };

  const exportCsv = () => {
    if (results.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Algorithm,Workload,Avg Waiting Time,Avg Turnaround Time,Avg Response Time,CPU Util %,Context Switches,Total Ticks\n';

    results.forEach((r) => {
      csvContent += `${r.algorithm},${r.workload},${r.avgWaiting},${r.avgTurnaround},${r.avgResponse},${r.cpuUtil}%,${r.contextSwitches},${r.totalTicks}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'tire_shop_scheduler_benchmark_results.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#FFFAF0] rounded-xl shadow-2xl border border-[#E4D9C3] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F6EFE0] border-b border-[#E4D9C3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-bold">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#1A1A1A]">
                Scheduling Benchmark Suite (4 Algorithms × 3 Workloads)
              </h3>
              <p className="text-xs text-[#1A1A1A]/70">
                Deterministic comparison across CPU-Heavy, I/O-Heavy, and Balanced workloads
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg border border-[#1A1A1A]/20 hover:bg-white text-[#1A1A1A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action strip */}
        <div className="px-6 py-3 bg-[#F6EFE0]/50 border-b border-[#E4D9C3] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={runAllBenchmarks}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#CC5500] hover:bg-[#A84500] text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isRunning ? 'Running Simulation...' : 'Run Benchmark Suite (12 Runs)'}</span>
            </button>
            {progress && <span className="font-mono text-[#1A1A1A]/70">{progress}</span>}
          </div>

          {results.length > 0 && (
            <button
              onClick={exportCsv}
              className="flex items-center gap-1 px-3 py-2 border border-[#1A1A1A] hover:bg-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {/* Results Matrix Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {results.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#1A1A1A]/60">
              Click <strong>"Run Benchmark Suite"</strong> to simulate 12 standardized runs and compare performance.
            </div>
          ) : (
            <div className="border border-[#E4D9C3] rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-[#F6EFE0] border-b border-[#E4D9C3] text-[10px] uppercase font-mono tracking-wider text-[#1A1A1A]/80">
                  <tr>
                    <th className="py-2.5 px-3">Algorithm</th>
                    <th className="py-2.5 px-3">Workload</th>
                    <th className="py-2.5 px-3 text-right">Avg Waiting</th>
                    <th className="py-2.5 px-3 text-right">Avg Turnaround</th>
                    <th className="py-2.5 px-3 text-right">Avg Response</th>
                    <th className="py-2.5 px-3 text-right">CPU Util %</th>
                    <th className="py-2.5 px-3 text-right">Context Switches</th>
                    <th className="py-2.5 px-3 text-right">Total Ticks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4D9C3]/50 font-mono text-[11px]">
                  {results.map((r, idx) => (
                    <tr key={idx} className="hover:bg-[#F6EFE0]/40 transition-colors">
                      <td className="py-2 px-3 font-bold text-[#1A1A1A]">{r.algorithm}</td>
                      <td className="py-2 px-3 capitalize text-[#1A1A1A]/80">{r.workload}</td>
                      <td className="py-2 px-3 text-right font-semibold text-[#CC5500]">
                        {r.avgWaiting}t
                      </td>
                      <td className="py-2 px-3 text-right">{r.avgTurnaround}t</td>
                      <td className="py-2 px-3 text-right">{r.avgResponse}t</td>
                      <td className="py-2 px-3 text-right text-[#059669] font-semibold">
                        {r.cpuUtil}%
                      </td>
                      <td className="py-2 px-3 text-right text-[#1A1A1A]/70">{r.contextSwitches}</td>
                      <td className="py-2 px-3 text-right text-[#1A1A1A]/60">{r.totalTicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
