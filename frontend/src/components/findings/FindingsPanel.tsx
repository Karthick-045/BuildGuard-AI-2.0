import React, { useState } from 'react';
import { AlertTriangle, Filter, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Finding } from '../../types';
import { FindingCard } from './FindingCard';

interface FindingsPanelProps {
  findings: Finding[];
}

export const FindingsPanel: React.FC<FindingsPanelProps> = ({ findings }) => {
  const [filter, setFilter] = useState<string>('ALL');

  const filteredFindings = findings.filter((f) => {
    if (filter === 'ALL') return true;
    if (filter === 'CRITICAL_HIGH') return f.severity === 'CRITICAL' || f.severity === 'HIGH';
    if (filter === 'WARNING') return f.status === 'WARNING';
    if (filter === 'PASS') return f.status === 'PASS';
    return true;
  });

  const criticalHighCount = findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
        <div>
          <h3 className="font-semibold text-white text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Safety & Egress Findings ({findings.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic graph audit results for bottlenecks, egress dead-ends, and articulation points.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="inline-flex rounded-lg bg-slate-900/60 p-1 border border-slate-700/60">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                filter === 'ALL'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({findings.length})
            </button>
            <button
              onClick={() => setFilter('CRITICAL_HIGH')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                filter === 'CRITICAL_HIGH'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Critical ({criticalHighCount})
            </button>
            <button
              onClick={() => setFilter('PASS')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                filter === 'PASS'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Compliant
            </button>
          </div>
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-8 text-center text-slate-400 text-sm">
          No findings match the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFindings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      )}
    </div>
  );
};
