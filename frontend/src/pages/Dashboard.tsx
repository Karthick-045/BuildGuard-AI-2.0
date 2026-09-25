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
import { VoiceBuildingModal } from '../components/voice/VoiceBuildingModal';
import { SafetyGraph } from '../components/graph/SafetyGraph';
import { projectApi } from '../services/api';
import { Project, ProjectListResponse, SafetyGraph as SafetyGraphType } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ProjectListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [launchingSensorLab, setLaunchingSensorLab] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

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
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLaunchSensorWorkspace}
              disabled={launchingSensorLab}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
              title="Open sample workspace preloaded with 13 IoT sensors for real-time graph recalculation"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{launchingSensorLab ? 'Opening Lab...' : 'Sensor Safety Lab'}</span>
            </button>
            <button
              onClick={() => setShowVoiceModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-red-950/40 transition-all active:scale-95"
              title="Build Safety Graph by speaking building layout"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Build by Voice</span>
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

        {/* Live Safety Graph & Dynamic Sensor Recalculation Command Center */}
        {data?.projects && data.projects.length > 0 && (
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/50 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">
                      Interactive Safety Graph & Real-Time Sensor Telemetry
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
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
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-sky-500"
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
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow transition-all active:scale-95"
                  >
                    <span>Open Workspace</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Embedded Graph View */}
            <div className="h-[460px] rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/60 relative">
              {graphLoading && (
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-30 flex items-center justify-center text-sky-400 text-xs gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
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
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shadow transition-all active:scale-95 disabled:opacity-50"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{launchingSensorLab ? 'Opening Lab...' : 'Sensor Lab'}</span>
              </button>

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
                  Get started by speaking your floor plan with NLP, launching the sensor recalculation lab, or loading the preconfigured demo facility.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowVoiceModal(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-red-950/40 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>Build by Voice</span>
                </button>
                <button
                  onClick={handleLaunchSensorWorkspace}
                  disabled={launchingSensorLab}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Cpu className="w-4 h-4" />
                  <span>{launchingSensorLab ? 'Opening...' : 'Launch Sensor Lab'}</span>
                </button>
                <button
                  onClick={handleCreateDemo}
                  disabled={seedingDemo}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{seedingDemo ? 'Generating...' : 'Load Demo Building'}</span>
                </button>
                <Link
                  to="/projects/new"
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95"
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

      <VoiceBuildingModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onProjectCreated={(newId) => fetchProjects(newId)}
      />
    </div>
  );
};
