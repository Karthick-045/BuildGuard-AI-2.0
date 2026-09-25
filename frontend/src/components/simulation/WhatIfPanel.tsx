import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, ShieldCheck, Flame, Ban } from 'lucide-react';
import { SimulationResponse } from '../../types';
import { projectApi } from '../../services/api';
import { SimulationResult } from './SimulationResult';

interface WhatIfPanelProps {
  projectId: number;
  onSimulationUpdated: (res: SimulationResponse | null) => void;
  currentResult: SimulationResponse | null;
}

export const WhatIfPanel: React.FC<WhatIfPanelProps> = ({
  projectId,
  onSimulationUpdated,
  currentResult,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const scenarioActions = [
    { id: 'exit_b', label: 'Block Exit B', type: 'EXIT', color: 'hover:border-rose-500 hover:bg-rose-500/10' },
    { id: 'exit_a', label: 'Block Exit A', type: 'EXIT', color: 'hover:border-rose-500 hover:bg-rose-500/10' },
    { id: 'corridor_c', label: 'Block Corridor C', type: 'CORRIDOR', color: 'hover:border-amber-500 hover:bg-amber-500/10' },
    { id: 'stair_1', label: 'Disable Stair 1', type: 'STAIR', color: 'hover:border-amber-500 hover:bg-amber-500/10' },
    { id: 'ramp_1', label: 'Disable Ramp 1', type: 'RAMP', color: 'hover:border-purple-500 hover:bg-purple-500/10' },
  ];

  const handleSimulate = async (elementId: string) => {
    setLoadingAction(elementId);
    try {
      const response = await projectApi.simulate(projectId, {
        action: 'BLOCK',
        target_element: elementId,
      });
      onSimulationUpdated(response);
    } catch (err) {
      console.error('Simulation error', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await projectApi.resetSimulation(projectId);
      onSimulationUpdated(null);
    } catch (err) {
      console.error('Reset error', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            What-If Scenario Simulation & Failure Modes
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulate emergency blockages to test topological resilience and redundant egress paths.
          </p>
        </div>

        {currentResult && (
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-all self-start sm:self-auto disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Baseline</span>
          </button>
        )}
      </div>

      {/* Scenario Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {scenarioActions.map((action) => {
          const isActive = currentResult?.target.toLowerCase().includes(action.id.replace('_', ' '));
          const isLoading = loadingAction === action.id;

          return (
            <button
              key={action.id}
              onClick={() => handleSimulate(action.id)}
              disabled={isLoading || resetting}
              className={`p-3 rounded-lg border text-xs font-medium transition-all flex flex-col items-center justify-center space-y-1 ${
                isActive
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
              } disabled:opacity-50 active:scale-[0.98]`}
            >
              <div className="flex items-center space-x-1.5">
                <Ban className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                <span className="font-semibold">{action.label}</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase font-mono">
                {isLoading ? 'Simulating...' : `Simulate ${action.type}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Simulation Result Presentation */}
      {currentResult && (
        <SimulationResult
          result={currentResult}
          onReset={handleReset}
          resetting={resetting}
        />
      )}
    </div>
  );
};
