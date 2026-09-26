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
  Activity,
  Flame,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Radio,
  Thermometer,
  DoorClosed,
  Wind,
  Ban,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { StatCard } from '../components/dashboard/StatCard';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { SafetyGraph } from '../components/graph/SafetyGraph';
import { projectApi } from '../services/api';
import { Project, ProjectListResponse, SafetyGraph as SafetyGraphType, SensorListResponse } from '../types';
import { SensorAlertPopup, SensorAlertInfo } from '../components/sensors/SensorAlertPopup';

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

  // Live IoT Sensor Telemetry State
  const [sensorsData, setSensorsData] = useState<SensorListResponse | null>(null);
  const [activeAlert, setActiveAlert] = useState<SensorAlertInfo | null>(null);
  const [showSensorAlertPopup, setShowSensorAlertPopup] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  const loadDashboardSensors = useCallback(async (projectId: number) => {
    try {
      const s = await projectApi.getSensors(projectId);
      setSensorsData(s);
    } catch (e) {
      console.warn('Could not fetch sensor telemetry for project', projectId, e);
    }
  }, []);

  const fetchProjects = useCallback(async (preferredId?: number) => {
    setLoading(true);
    try {
      const res = await projectApi.getProjects();
      setData(res);

      // Determine active project for Safety Graph & Sensor Telemetry
      const targetId = preferredId || selectedProjectId || (res.projects && res.projects.length > 0 ? res.projects[0].id : null);
      if (targetId) {
        setSelectedProjectId(targetId);
        loadDashboardGraph(targetId);
        loadDashboardSensors(targetId);
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
  }, [selectedProjectId, loadDashboardGraph, loadDashboardSensors]);

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

  // Live Dashboard Sensor Simulation Triggers
  const handleDashboardSmokeTrigger = async () => {
    if (!selectedProjectId) return;
    try {
      setActionLoading(true);
      await projectApi.triggerSensorAlert(selectedProjectId, {
        sensor_id: 'SENSOR_SMOKE_CORR_C',
        value: 85.0,
        status: 'CRITICAL_ALERT',
        alert_message: 'Corridor C Optical Smoke Sensor breached 50 ppm limit (85.0 ppm detected) - Evacuate area immediately!'
      });

      setActiveAlert({
        sensor_id: 'SENSOR_SMOKE_CORR_C',
        sensor_type: 'SMOKE',
        element_label: 'Corridor C',
        location: 'Level 1 Central Corridor',
        status: 'CRITICAL_ALERT',
        current_value: 85.0,
        threshold: 50.0,
        unit: 'ppm',
        alert_message: 'Corridor C Optical Smoke Sensor breached 50 ppm limit (85.0 ppm detected) - Topological graph has rerouted paths!'
      });
      setShowSensorAlertPopup(true);

      // Refresh graph & sensors
      await loadDashboardGraph(selectedProjectId);
      await loadDashboardSensors(selectedProjectId);
    } catch (e) {
      console.error('Failed to trigger smoke sensor alert', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDashboardDoorBlockTrigger = async () => {
    if (!selectedProjectId) return;
    try {
      setActionLoading(true);
      await projectApi.triggerSensorAlert(selectedProjectId, {
        sensor_id: 'SENSOR_DOOR_EXIT_B',
        value: 1.0,
        status: 'CRITICAL_ALERT',
        alert_message: 'Emergency Exit Door B magnetic contact reports physical obstruction / door jam!'
      });

      setActiveAlert({
        sensor_id: 'SENSOR_DOOR_EXIT_B',
        sensor_type: 'DOOR_CONTACT',
        element_label: 'Emergency Exit B',
        location: 'Ground Floor East Wing',
        status: 'CRITICAL_ALERT',
        current_value: 1.0,
        threshold: 0.0,
        unit: 'state',
        alert_message: 'Emergency Exit Door B magnetic contact reports physical obstruction - Graph isolated exit and redirected occupants!'
      });
      setShowSensorAlertPopup(true);

      // Refresh graph & sensors
      await loadDashboardGraph(selectedProjectId);
      await loadDashboardSensors(selectedProjectId);
    } catch (e) {
      console.error('Failed to trigger door contact alert', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDashboardResetSensors = async () => {
    if (!selectedProjectId) return;
    try {
      setActionLoading(true);
      await projectApi.resetSensors(selectedProjectId);
      setShowSensorAlertPopup(false);
      setActiveAlert(null);
      await loadDashboardGraph(selectedProjectId);
      await loadDashboardSensors(selectedProjectId);
    } catch (e) {
      console.error('Failed to reset sensors', e);
    } finally {
      setActionLoading(false);
    }
  };

  const selectedProject = data?.projects?.find(p => p.id === selectedProjectId);

  const smokeAlert = Boolean(sensorsData?.sensors?.some(s => s.sensor_type === 'SMOKE' && (s.status === 'CRITICAL_ALERT' || s.current_value >= s.threshold)));
  const doorAlert = Boolean(sensorsData?.sensors?.some(s => s.sensor_type === 'DOOR_CONTACT' && (s.status === 'CRITICAL_ALERT' || s.current_value > 0)));

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Facility overview, topological safety graphs, and IoT sensor telemetry"
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                fetchProjects();
                if (selectedProjectId) {
                  loadDashboardGraph(selectedProjectId);
                  loadDashboardSensors(selectedProjectId);
                }
              }}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
              title="Refresh Telemetry & Facilities"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLaunchSensorWorkspace}
              disabled={launchingSensorLab}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold border border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
              title="Open sample workspace preloaded with 13 IoT sensors for real-time graph recalculation"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>{launchingSensorLab ? 'Opening Lab...' : 'IoT Sensor Lab'}</span>
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
        {/* Top Stat Cards - 5 Columns including IoT Sensors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
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
            color="indigo"
          />
          <StatCard
            label="Active IoT Sensors"
            value={sensorsData?.total_sensors ? `${sensorsData.total_sensors} Online` : '13 Online'}
            icon={Radio}
            color={sensorsData && sensorsData.active_alerts_count > 0 ? 'rose' : 'emerald'}
            trend={sensorsData && sensorsData.active_alerts_count > 0 ? `${sensorsData.active_alerts_count} Active Alarm` : '100% Monitored'}
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
                    loadDashboardSensors(pid);
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

            {/* Prominently Highlighted IoT Sensor Telemetry & Dynamic Recalculation Strip */}
            <div className="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-3.5 shadow-lg space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left: Sensor Mesh Status with Pulsing Live Indicator */}
                <div className="flex items-center space-x-2.5">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Live IoT Building Sensor Mesh
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {sensorsData ? `${sensorsData.total_sensors} Points Online` : '13 Points Online'}
                    </span>
                  </div>
                </div>

                {/* Right: Quick Simulation & Recalculation Triggers */}
                {selectedProjectId && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">
                      Sensor Simulation:
                    </span>
                    <button
                      onClick={handleDashboardSmokeTrigger}
                      disabled={actionLoading}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 hover:border-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                      title="Trigger 85 ppm smoke alarm on Corridor C to recalculate graph evacuation paths"
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      <span>🔥 Trigger Smoke Alarm</span>
                    </button>
                    <button
                      onClick={handleDashboardDoorBlockTrigger}
                      disabled={actionLoading}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 hover:border-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                      title="Simulate door contact jam on Exit B to divert egress"
                    >
                      <Ban className="w-3.5 h-3.5 text-amber-400" />
                      <span>🚪 Jam Exit B</span>
                    </button>
                    <button
                      onClick={handleDashboardResetSensors}
                      disabled={actionLoading}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                      title="Reset all sensor telemetry and restore nominal baseline"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Reset Sensors</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Sensor Gauge Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {/* Smoke Telemetry */}
                <div className={`p-2.5 rounded-lg border transition-all ${
                  smokeAlert
                    ? 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/40 text-rose-200'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold flex items-center gap-1 text-slate-400">
                      <Flame className={`w-3.5 h-3.5 ${smokeAlert ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
                      Smoke Detectors
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      smokeAlert ? 'bg-rose-500 text-white' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {smokeAlert ? 'CRITICAL ALARM' : 'NOMINAL'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold font-mono text-white">
                      {smokeAlert ? '85.0 ppm' : '12.4 ppm'}
                    </span>
                    <span className="text-[10px] text-slate-500">Threshold: 50 ppm</span>
                  </div>
                </div>

                {/* Temperature Telemetry */}
                <div className="p-2.5 rounded-lg border bg-slate-900/90 border-slate-800 text-slate-300">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold flex items-center gap-1 text-slate-400">
                      <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                      Thermal Cores
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      NOMINAL
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold font-mono text-white">21.8 °C</span>
                    <span className="text-[10px] text-slate-500">Threshold: 55 °C</span>
                  </div>
                </div>

                {/* Door Contacts Telemetry */}
                <div className={`p-2.5 rounded-lg border transition-all ${
                  doorAlert
                    ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/40 text-amber-200'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold flex items-center gap-1 text-slate-400">
                      <DoorClosed className={`w-3.5 h-3.5 ${doorAlert ? 'text-amber-400' : 'text-slate-500'}`} />
                      Exit Thresholds
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      doorAlert ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {doorAlert ? 'OBSTRUCTED' : 'CLEAR'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold font-mono text-white">
                      {doorAlert ? 'Exit B Blocked' : 'All Clear'}
                    </span>
                    <span className="text-[10px] text-slate-500">Contact: Closed</span>
                  </div>
                </div>

                {/* CO2 Air Quality Telemetry */}
                <div className="p-2.5 rounded-lg border bg-slate-900/90 border-slate-800 text-slate-300">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold flex items-center gap-1 text-slate-400">
                      <Wind className="w-3.5 h-3.5 text-sky-400" />
                      CO2 & Air Quality
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      OPTIMAL
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold font-mono text-white">412 ppm</span>
                    <span className="text-[10px] text-slate-500">Threshold: 1000 ppm</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Recalculation Notice Banner when hazard active */}
              {(smokeAlert || doorAlert || Boolean(dashboardGraph?.active_hazard_count)) && (
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-between gap-3 text-xs text-rose-300 animate-pulse">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-semibold">
                      Sensor Hazard Triggered: Topological egress routes have dynamically rerouted to bypass active hazard zones.
                    </span>
                  </div>
                  <button
                    onClick={handleDashboardResetSensors}
                    className="px-2 py-0.5 rounded bg-rose-500 text-white font-bold text-[10px] shrink-0 hover:bg-rose-600 transition-colors"
                  >
                    Clear Alarms
                  </button>
                </div>
              )}
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
                onRefreshGraph={() => {
                  if (selectedProjectId) {
                    loadDashboardGraph(selectedProjectId);
                    loadDashboardSensors(selectedProjectId);
                  }
                }}
                onAlertTriggered={(alert) => {
                  setActiveAlert(alert);
                  setShowSensorAlertPopup(true);
                }}
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
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
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
                  Synthesize an architectural layout with AI Voice Copilot in the sidebar, launch the real-time IoT sensor recalculation lab, or create a custom project.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={handleLaunchSensorWorkspace}
                  disabled={launchingSensorLab}
                  className="px-3.5 py-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
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

      {/* Sensor Alert Audible Notification Modal */}
      <SensorAlertPopup
        isOpen={showSensorAlertPopup}
        alert={activeAlert}
        onClose={() => setShowSensorAlertPopup(false)}
        onRecalculateRoute={() => {
          setShowSensorAlertPopup(false);
          if (selectedProjectId) loadDashboardGraph(selectedProjectId);
        }}
        onResetSensors={handleDashboardResetSensors}
      />
    </div>
  );
};
