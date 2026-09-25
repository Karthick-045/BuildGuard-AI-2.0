import React from 'react';
import { 
  DoorOpen, 
  DoorClosed, 
  GitFork, 
  ArrowUpRight, 
  LogOut, 
  Accessibility, 
  Layers,
  Sparkles
} from 'lucide-react';
import { BuildingSummary as BuildingSummaryType } from '../../types';

interface BuildingSummaryProps {
  summary: BuildingSummaryType | null;
  onAnalyze?: () => void;
  analyzing?: boolean;
}

export const BuildingSummary: React.FC<BuildingSummaryProps> = ({
  summary,
  onAnalyze,
  analyzing = false,
}) => {
  const rooms = summary?.rooms ?? 8;
  const doors = summary?.doors ?? 12;
  const corridors = summary?.corridors ?? 4;
  const stairs = summary?.stairs ?? 2;
  const exits = summary?.exits ?? 2;
  const ramps = summary?.ramps ?? 1;

  const cards = [
    { label: 'Rooms', count: rooms, icon: DoorClosed, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { label: 'Doors', count: doors, icon: DoorOpen, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Corridors', count: corridors, icon: GitFork, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Stairs', count: stairs, icon: ArrowUpRight, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { label: 'Emergency Exits', count: exits, icon: LogOut, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Ramp (ADA)', count: ramps, icon: Accessibility, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  ];

  return (
    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-sky-400" />
          <h3 className="font-semibold text-white text-sm">Building Structural Summary</h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          {(summary?.total_elements || 29)} Detected Elements
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3 text-center flex flex-col items-center justify-center space-y-1 hover:border-slate-600 transition-colors"
            >
              <div className={`p-1.5 rounded-md border ${c.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white">{c.count}</span>
              <span className="text-[11px] text-slate-400 font-medium">{c.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
