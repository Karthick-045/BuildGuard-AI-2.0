import React from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { SimulationResponse } from '../../types';

interface SimulationResultProps {
  result: SimulationResponse;
  onReset: () => void;
  resetting?: boolean;
}

export const SimulationResult: React.FC<SimulationResultProps> = ({
  result,
  onReset,
  resetting = false,
}) => {
  const isFailed = result.lost_connectivity;

  return (
    <div
      className={`rounded-xl p-5 border-2 transition-all space-y-4 shadow-lg ${
        isFailed
          ? 'bg-rose-950/40 border-rose-500/80 shadow-rose-500/10'
          : 'bg-emerald-950/40 border-emerald-500/80 shadow-emerald-500/10'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg border ${
              isFailed
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isFailed ? <AlertOctagon className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="font-bold text-white text-base">
              Simulation Result: {result.target} {result.action}ED
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              {result.message}
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          disabled={resetting}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          {resetting ? 'Restoring...' : 'Reset Simulation'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
        <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Escape Connectivity Status
          </span>
          <span
            className={`text-lg font-black tracking-wide inline-flex items-center gap-1.5 ${
              isFailed ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {isFailed ? 'FAILED — ISOLATED ZONES' : 'PASSED — ALL REACHABLE'}
          </span>
        </div>

        <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Affected Rooms Count
          </span>
          <span className="text-lg font-black text-white">
            {result.affected_rooms.length} room{result.affected_rooms.length !== 1 ? 's' : ''} affected
          </span>
        </div>
      </div>

      {result.affected_rooms.length > 0 && (
        <div className="bg-slate-900/80 p-4 rounded-lg border border-rose-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Disconnected Rooms (No Emergency Escape Path):</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {result.affected_rooms.map((room) => (
              <span
                key={room}
                className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-sm"
              >
                {room}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
