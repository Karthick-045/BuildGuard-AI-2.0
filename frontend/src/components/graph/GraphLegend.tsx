import React from 'react';

export const GraphLegend: React.FC = () => {
  const items = [
    { label: 'Room', color: 'bg-sky-500 border-sky-400' },
    { label: 'Door', color: 'bg-indigo-500 border-indigo-400' },
    { label: 'Corridor', color: 'bg-cyan-500 border-cyan-400' },
    { label: 'Stair', color: 'bg-amber-500 border-amber-400' },
    { label: 'Ramp', color: 'bg-purple-500 border-purple-400' },
    { label: 'Emergency Exit', color: 'bg-emerald-500 border-emerald-400' },
    { label: 'Blocked / Articulation', color: 'bg-rose-500 border-rose-400 animate-pulse' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-slate-900/90 border border-slate-700/60 rounded-lg text-[11px] text-slate-300">
      <span className="font-semibold text-slate-400 uppercase tracking-wider mr-1">Legend:</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center space-x-1.5">
          <span className={`w-2.5 h-2.5 rounded-full border ${item.color}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};
