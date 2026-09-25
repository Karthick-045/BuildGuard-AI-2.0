import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Layers, AlertTriangle, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const isAnalyzed = (project.total_elements || 0) > 0;
  const criticalCount = project.critical_findings || 0;
  const totalFindings = project.total_findings || 0;

  return (
    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-sm hover:border-sky-500/50 hover:shadow-sky-500/5 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between">
          <div className="p-2.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-sky-400">
            <Building2 className="w-5 h-5" />
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              isAnalyzed
                ? criticalCount > 0
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-700/40 text-slate-400 border-slate-600/40'
            }`}
          >
            {isAnalyzed
              ? criticalCount > 0
                ? `${criticalCount} Critical Alert${criticalCount > 1 ? 's' : ''}`
                : 'Compliant'
              : 'Pending Analysis'}
          </span>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-white group-hover:text-sky-400 transition-colors text-base line-clamp-1">
            {project.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>{project.building_type}</span>
            <span>•</span>
            <span>{project.floors} Floor{project.floors > 1 ? 's' : ''}</span>
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-700/40">
          <div className="flex items-center space-x-2 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{project.total_elements || 0} Elements</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{totalFindings} Findings</span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-1 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Created {new Date(project.created_at).toLocaleDateString()}
        </span>
        <Link
          to={`/projects/${project.id}`}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors group-hover:translate-x-0.5 transform duration-150"
        >
          <span>Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
