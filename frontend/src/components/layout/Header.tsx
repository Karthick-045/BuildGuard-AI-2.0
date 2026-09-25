import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Plus, Sparkles } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  const location = useLocation();
  const isWorkspace = location.pathname.includes('/projects/') && !location.pathname.includes('/new');

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        <div className="flex items-center text-xs text-slate-400 font-medium">
          <Link to="/" className="hover:text-slate-200 transition-colors">
            BuildGuard AI
          </Link>
          {isWorkspace && (
            <>
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />
              <span className="text-slate-300">Project Workspace</span>
            </>
          )}
          {location.pathname === '/projects/new' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />
              <span className="text-slate-300">Create Project</span>
            </>
          )}
        </div>

        {title && (
          <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />
        )}

        {title && (
          <div>
            <h2 className="text-sm font-semibold text-slate-100 hidden sm:block">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-slate-400 hidden md:block">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {actions ? (
          actions
        ) : (
          <Link
            to="/projects/new"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </Link>
        )}
      </div>
    </header>
  );
};
