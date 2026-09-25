import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  Plus, 
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { StatCard } from '../components/dashboard/StatCard';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { projectApi } from '../services/api';
import { Project, ProjectListResponse } from '../types';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<ProjectListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [seedingDemo, setSeedingDemo] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectApi.getProjects();
      setData(res);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateDemo = async () => {
    setSeedingDemo(true);
    try {
      // 1. Create project
      const newProj = await projectApi.createProject({
        name: 'Demo Commercial Facility A',
        building_type: 'Commercial',
        floors: 2,
      });

      // 2. Run analysis
      await projectApi.analyzeProject(newProj.id);

      // 3. Refresh
      await fetchProjects();
    } catch (err) {
      console.error('Failed to create demo project', err);
    } finally {
      setSeedingDemo(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Facility overview and egress compliance monitoring"
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchProjects}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/projects/new"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </Link>
          </div>
        }
      />

      <PageContainer>
        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Projects"
            value={data?.total_projects ?? 0}
            icon={Building2}
            color="sky"
          />
          <StatCard
            label="Total Findings"
            value={data?.total_findings ?? 0}
            icon={AlertTriangle}
            color="amber"
          />
          <StatCard
            label="Critical Bottlenecks"
            value={data?.critical_findings ?? 0}
            icon={ShieldAlert}
            color="rose"
          />
          <StatCard
            label="Buildings Analyzed"
            value={data?.buildings_analyzed ?? 0}
            icon={Layers}
            color="emerald"
          />
        </div>

        {/* Recent Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Architectural Projects
              </h3>
              <p className="text-xs text-slate-400">
                Active facilities audited for evacuation bottlenecks and egress safety.
              </p>
            </div>

            {(!data?.projects || data.projects.length === 0) && (
              <button
                onClick={handleCreateDemo}
                disabled={seedingDemo}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{seedingDemo ? 'Creating Demo...' : 'Create Sample Project'}</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
              Loading projects...
            </div>
          ) : !data?.projects || data.projects.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-base">No Projects Found</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Get started by creating your first architectural facility, or load the preconfigured demo building with 8 rooms, 12 doors, and 2 emergency exits.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleCreateDemo}
                  disabled={seedingDemo}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{seedingDemo ? 'Generating...' : 'Load Demo Building'}</span>
                </button>
                <Link
                  to="/projects/new"
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Custom Project</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.projects.map((proj) => (
                <ProjectCard key={proj.id} project={proj} />
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
};
