import React from 'react';

export const GraphLegend: React.FC = () => {
  const items = [
    { label: 'Room / Space', dot: 'bg-slate-300 border-slate-200' },
    { label: 'Passage Door', dot: 'bg-slate-500 border-slate-400' },
    { label: 'Corridor Spine', dot: 'bg-teal-400 border-teal-300' },
    { label: 'Stair / Ramp', dot: 'bg-amber-400 border-amber-300' },
    { label: 'Emergency Exit', dot: 'bg-emerald-400 border-emerald-300 ring-2 ring-emerald-500/30' },
    { label: 'Hazard / Blocked', dot: 'bg-rose-500 border-rose-400 animate-pulse' },
    { label: 'Egress Route', line: 'w-4 h-0.5 bg-emerald-400' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-[11px] text-slate-300">
      <span className="font-semibold text-slate-400 uppercase tracking-wider mr-1 text-[10px]">Legend:</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center space-x-1.5">
          {item.line ? (
            <span className={item.line} />
          ) : (
            <span className={`w-2 h-2 rounded-full border ${item.dot}`} />
          )}
          <span className="text-slate-300 text-[11px]">{item.label}</span>
        </div>
      ))}
    </div>
  );
};
