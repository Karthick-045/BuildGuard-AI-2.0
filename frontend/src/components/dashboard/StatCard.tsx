import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'sky' | 'indigo' | 'amber' | 'emerald' | 'rose';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  color = 'sky',
  trend,
}) => {
  const colorMap = {
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-sm hover:border-slate-600 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
        {trend && (
          <span className="text-xs text-slate-400 font-medium">{trend}</span>
        )}
      </div>
    </div>
  );
};
