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
  const rooms = summary ? summary.rooms : 0;
  const doors = summary ? summary.doors : 0;
  const corridors = summary ? summary.corridors : 0;
  const stairs = summary ? summary.stairs : 0;
  const exits = summary ? summary.exits : 0;
  const ramps = summary ? summary.ramps : 0;
  const totalElements = summary ? summary.total_elements : 0;

  const cards = [
    { label: 'Rooms', count: rooms, icon: DoorClosed },
    { label: 'Doors', count: doors, icon: DoorOpen },
    { label: 'Corridors', count: corridors, icon: GitFork },
    { label: 'Stairs', count: stairs, icon: ArrowUpRight },
    { label: 'Emergency Exits', count: exits, icon: LogOut },
    { label: 'Ramp (ADA)', count: ramps, icon: Accessibility },
  ];

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <h3 className="font-semibold text-white text-xs uppercase tracking-wider">Structural Elements Inventory</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {totalElements} Detected Elements
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-center flex flex-col items-center justify-center space-y-1 hover:border-slate-700 transition-colors"
            >
              <div className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-base font-bold font-mono text-white tracking-tight">{c.count}</span>
              <span className="text-[10px] text-slate-400 font-medium truncate w-full">{c.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
