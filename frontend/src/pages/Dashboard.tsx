import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  Plus, 
  RefreshCw,
  Sparkles,
  ArrowRight,
  Mic,
  Activity,
  Flame,
  ExternalLink,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { StatCard } from '../components/dashboard/StatCard';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { SafetyGraph } from '../components/graph/SafetyGraph';
import { projectApi } from '../services/api';
import { Project, ProjectListResponse, SafetyGraph as SafetyGraphType } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ProjectListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [launchingSensorLab, setLaunchingSensorLab] = useState(false);

  // Live Dashboard Safety Graph State
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [dashboardGraph, setDashboardGraph] = useState<SafetyGraphType | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);

  const loadDashboardGraph = useCallback(async (projectId: number) => {
    setGraphLoading(true);
    try {
      const g = await projectApi.getGraph(projectId);
      setDashboardGraph(g);
    } catch (e) {
      console.error('Failed to load dashboard graph', e);
    } finally {
      setGraphLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async (preferredId?: number) => {
    setLoading(true);
    try {
      const res = await projectApi.getProjects();
      setData(res);

      // Determine active project for Safety Graph
      const targetId = preferredId || selectedProjectId || (res.projects && res.projects.length > 0 ? res.projects[0].id : null);
      if (targetId) {
        setSelectedProjectId(targetId);
        loadDashboardGraph(targetId);
        const pObj = res.projects?.find(p => p.id === targetId);
        window.dispatchEvent(new CustomEvent('buildguard_project_changed', {
          detail: { projectId: targetId, projectName: pObj?.name }
        }));
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, loadDashboardGraph]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateDemo = async () => {
    setSeedingDemo(true);
    try {
      const newProj = await projectApi.createProject({
        name: 'Demo Commercial Facility A',
        building_type: 'Commercial',
        floors: 2,
      });
      await projectApi.analyzeProject(newProj.id);
      await fetchProjects(newProj.id);
    } catch (err) {
      console.error('Failed to create demo project', err);
    } finally {
      setSeedingDemo(false);
    }
  };

  const handleLaunchSensorWorkspace = async () => {
    setLaunchingSensorLab(true);
    try {
      const res = await projectApi.createSampleSensorWorkspace();
      navigate(`/projects/${res.project_id}`);
    } catch (err) {
      console.error('Failed to launch sensor lab', err);
    } finally {
      setLaunchingSensorLab(false);
    }
  };

  const selectedProject = data?.projects?.find(p => p.id === selectedProjectId);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Facility overview, topological safety graphs, and IoT sensor telemetry"
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchProjects()}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLaunchSensorWorkspace}
              disabled={launchingSensorLab}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 hover:border-slate-700 transition-all active:scale-[0.98] disabled:opacity-50"
              title="Open sample workspace preloaded with 13 IoT sensors for real-time graph recalculation"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>{launchingSensorLab ? 'Opening Lab...' : 'Sensor Lab'}</span>
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open_chatbot_voice_mode'))}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 hover:border-slate-700 transition-all active:scale-[0.98]"
              title="Build Safety Graph by speaking building layout in AI Chatbot"
            >
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              <span>Build by Voice</span>
            </button>
            <Link
              to="/projects/new"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium shadow-sm transition-all active:scale-[0.98]"
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

        {/* Live Safety Graph & Dynamic Sensor Recalculation Command Center */}
        {data?.projects && data.projects.length > 0 && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-sky-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-sm tracking-tight">
                      Topological Egress & Sensor Telemetry
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Live Recalculation
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Real-time topological digital twin visualizing egress connectivity, articulation bottlenecks, and dynamic sensor hazards.
                  </p>
                </div>
              </div>

              {/* Facility Selector & Direct Jump */}
              <div className="flex items-center space-x-2">
                <label className="text-xs text-slate-400 font-medium hidden md:inline">Facility:</label>
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => {
                    const pid = Number(e.target.value);
                    setSelectedProjectId(pid);
                    loadDashboardGraph(pid);
                    const pObj = data.projects.find(p => p.id === pid);
                    window.dispatchEvent(new CustomEvent('buildguard_project_changed', {
                      detail: { projectId: pid, projectName: pObj?.name }
                    }));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 text-white text-xs font-medium focus:outline-none focus:border-slate-500"
                >
                  {data.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.building_type})
                    </option>
                  ))}
                </select>

                {selectedProjectId && (
                  <Link
                    to={`/projects/${selectedProjectId}`}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                  >
                    <span>Open Workspace</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                )}
              </div>
            </div>

            {/* Embedded Graph View */}
            <div className="h-[460px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950 relative">
              {graphLoading && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex items-center justify-center text-slate-300 text-xs gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Recalculating safety graph...</span>
                </div>
              )}
              <SafetyGraph
                graphData={dashboardGraph}
                projectId={selectedProjectId || undefined}
                onRefreshGraph={() => selectedProjectId && loadDashboardGraph(selectedProjectId)}
              />
            </div>
          </div>
        )}

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

            <div className="flex items-center gap-2">
              <button
                onClick={handleLaunchSensorWorkspace}
                disabled={launchingSensorLab}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-all disabled:opacity-50"
              >
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>{launchingSensorLab ? 'Opening Lab...' : 'Sensor Lab'}</span>
              </button>

              {(!data?.projects || data.projects.length === 0) && (
                <button
                  onClick={handleCreateDemo}
                  disabled={seedingDemo}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>{seedingDemo ? 'Creating Demo...' : 'Load Sample Project'}</span>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-500" />
              Loading projects...
            </div>
          ) : !data?.projects || data.projects.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h4 className="font-medium text-white text-base">No Facilities Configured</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                  Synthesize an architectural layout by voice transcript, launch the real-time IoT sensor recalculation lab, or create a custom project.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open_chatbot_voice_mode'))}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5 text-rose-400" />
                  <span>Build by Voice</span>
                </button>
                <button
                  onClick={handleLaunchSensorWorkspace}
                  disabled={launchingSensorLab}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{launchingSensorLab ? 'Opening...' : 'Launch Sensor Lab'}</span>
                </button>
                <button
                  onClick={handleCreateDemo}
                  disabled={seedingDemo}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>{seedingDemo ? 'Generating...' : 'Load Demo Building'}</span>
                </button>
                <Link
                  to="/projects/new"
                  className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
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
