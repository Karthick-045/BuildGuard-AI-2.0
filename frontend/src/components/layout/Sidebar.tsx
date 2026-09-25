import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  FolderPlus, 
  Layers, 
  GitBranch, 
  Activity,
  CheckCircle2,
  Server,
  Compass,
  Radio
} from 'lucide-react';
import { api } from '../../services/api';

export const Sidebar: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.get('/health', { timeout: 3000 });
        setBackendStatus('online');
      } catch (e) {
        setBackendStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
            BuildGuard <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30">AI</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">Safety & Egress Graph</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4 text-sky-400" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/projects/new"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`
          }
        >
          <FolderPlus className="w-4 h-4 text-indigo-400" />
          <span>New Project</span>
        </NavLink>

        <div className="pt-6 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Core Engine
        </div>

        <div className="flex items-center space-x-3 px-3.5 py-2 rounded-lg text-xs text-slate-400 bg-slate-800/40 border border-slate-800">
          <Layers className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="font-semibold text-slate-300">Phase 1 Engine</div>
            <div className="text-[10px] text-slate-400">NetworkX Graph Theory</div>
          </div>
        </div>

        <div className="flex items-center space-x-3 px-3.5 py-2 rounded-lg text-xs text-slate-400 bg-slate-800/40 border border-slate-800">
          <GitBranch className="w-4 h-4 text-amber-400" />
          <div>
            <div className="font-semibold text-slate-300">Bottleneck Audit</div>
            <div className="text-[10px] text-slate-400">Articulation Points</div>
          </div>
        </div>

        <div className="flex items-center space-x-3 px-3.5 py-2 rounded-lg text-xs text-slate-400 bg-slate-800/40 border border-slate-800">
          <Compass className="w-4 h-4 text-sky-400" />
          <div>
            <div className="font-semibold text-slate-300">Dynamic Route Finder</div>
            <div className="text-[10px] text-slate-400">Sensor-Guided Egress</div>
          </div>
        </div>

        <div className="flex items-center space-x-3 px-3.5 py-2 rounded-lg text-xs text-slate-400 bg-slate-800/40 border border-slate-800">
          <Radio className="w-4 h-4 text-rose-400" />
          <div>
            <div className="font-semibold text-slate-300">IoT Safety Sensors</div>
            <div className="text-[10px] text-slate-400">Smoke, Temp & Door Contact</div>
          </div>
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60 space-y-3">
        {/* Backend health */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs">
          <div className="flex items-center space-x-2">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300 font-medium">FastAPI + DB</span>
          </div>
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-emerald-400 animate-pulse'
                  : backendStatus === 'offline'
                  ? 'bg-rose-500'
                  : 'bg-amber-400'
              }`}
            />
            <span
              className={`text-[11px] font-semibold uppercase ${
                backendStatus === 'online'
                  ? 'text-emerald-400'
                  : backendStatus === 'offline'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {backendStatus}
            </span>
          </span>
        </div>

        <div className="text-[11px] text-slate-400 text-center leading-relaxed">
          Phase 1: Deterministic Reasoner<br />
          No External AI Dependencies
        </div>
      </div>
    </aside>
  );
};
