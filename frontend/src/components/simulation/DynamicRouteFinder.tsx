import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowRight, 
  Flame, 
  DoorClosed, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  Sparkles,
  Zap,
  MapPin,
  Compass,
  GitFork,
  ArrowUpRight,
  Accessibility,
  LogOut
} from 'lucide-react';
import { projectApi } from '../../services/api';
import { DynamicRouteResponse } from '../../types';
import { SensorAlertPopup, SensorAlertInfo } from '../sensors/SensorAlertPopup';

interface DynamicRouteFinderProps {
  projectId: number;
  onRouteCalculated?: (route: DynamicRouteResponse) => void;
}

export const DynamicRouteFinder: React.FC<DynamicRouteFinderProps> = ({ projectId, onRouteCalculated }) => {
  const [startRoom, setStartRoom] = useState('Room A');
  const [avoidSensors, setAvoidSensors] = useState(true);
  const [routeResult, setRouteResult] = useState<DynamicRouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState<SensorAlertInfo | null>(null);
  const [showAlertPopup, setShowAlertPopup] = useState(false);

  const rooms = [
    'Room A', 'Room B', 'Room C', 
    'Room D', 'Room E', 'Room F', 
    'Room G', 'Room H'
  ];

  const calculateRoute = async (roomName?: string) => {
    const room = roomName || startRoom;
    setLoading(true);
    try {
      const res = await projectApi.findDynamicRoute(projectId, {
        start_room: room,
        use_sensor_alerts: avoidSensors,
      });
      setRouteResult(res);
      if (onRouteCalculated) {
        onRouteCalculated(res);
      }
    } catch (err) {
      console.error('Failed to calculate dynamic route', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      calculateRoute();
    }
  }, [projectId, avoidSensors]);

  // Scenario 1: Smoke in Corridor C
  const handleSimulateCorridorSmoke = async () => {
    setScenarioLoading(true);
    try {
      await projectApi.triggerSensorAlert(projectId, {
        sensor_id: 'SENSOR_SMOKE_CORR_C',
        value: 82.0,
        status: 'CRITICAL_ALERT',
        alert_message: 'High density smoke plume detected in Corridor C'
      });
      const alertInfo: SensorAlertInfo = {
        sensor_id: 'SENSOR_SMOKE_CORR_C',
        sensor_type: 'SMOKE',
        element_label: 'Corridor C',
        location: 'Corridor C Central Ceiling',
        status: 'CRITICAL_ALERT',
        current_value: 82.0,
        threshold: 50.0,
        unit: 'ppm',
        alert_message: 'High density smoke plume detected in Corridor C (82.0 ppm > 50.0 ppm limit)'
      };
      setActiveAlert(alertInfo);
      setShowAlertPopup(true);
      await calculateRoute();
    } catch (err) {
      console.error('Failed to simulate smoke scenario', err);
    } finally {
      setScenarioLoading(false);
    }
  };

  // Scenario 2: Block Exit B
  const handleSimulateExitBBlock = async () => {
    setScenarioLoading(true);
    try {
      await projectApi.triggerSensorAlert(projectId, {
        sensor_id: 'SENSOR_DOOR_EXIT_B',
        value: 0.0,
        status: 'CRITICAL_ALERT',
        alert_message: 'Exit Door B mechanical latch failure / obstruction'
      });
      await projectApi.simulate(projectId, {
        action: 'BLOCK',
        target_element: 'exit_b'
      });
      const alertInfo: SensorAlertInfo = {
        sensor_id: 'SENSOR_DOOR_EXIT_B',
        sensor_type: 'DOOR_CONTACT',
        element_label: 'Exit Door B',
        location: 'Exit Door B Latch & Panic Hardware',
        status: 'CRITICAL_ALERT',
        current_value: 0.0,
        threshold: 0.0,
        unit: 'state',
        alert_message: 'Exit Door B mechanical latch failure / obstruction'
      };
      setActiveAlert(alertInfo);
      setShowAlertPopup(true);
      await calculateRoute();
    } catch (err) {
      console.error('Failed to simulate exit block scenario', err);
    } finally {
      setScenarioLoading(false);
    }
  };

  // Restore baseline
  const handleRestore = async () => {
    setScenarioLoading(true);
    try {
      await projectApi.resetSensors(projectId);
      await projectApi.resetSimulation(projectId);
      setShowAlertPopup(false);
      setActiveAlert(null);
      await calculateRoute();
    } catch (err) {
      console.error('Failed to restore routes', err);
    } finally {
      setScenarioLoading(false);
    }
  };

  const renderStepIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'ROOM': return <DoorClosed className="w-3.5 h-3.5 text-slate-400" />;
      case 'DOOR': return <DoorClosed className="w-3.5 h-3.5 text-sky-400" />;
      case 'CORRIDOR': return <GitFork className="w-3.5 h-3.5 text-indigo-400" />;
      case 'STAIR': return <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />;
      case 'RAMP': return <Accessibility className="w-3.5 h-3.5 text-teal-400" />;
      case 'EXIT': return <LogOut className="w-3.5 h-3.5 text-emerald-400" />;
      default: return <MapPin className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const isRerouted = routeResult?.route_status === 'REROUTED_DUE_TO_SENSOR';
  const isBlocked = routeResult?.route_status === 'NO_SAFE_ROUTE';

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300">
            <Compass className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Sensor Validation & Dynamic Route Finder
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium uppercase tracking-wider border flex items-center gap-1.5 ${
                isBlocked
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : isRerouted
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isBlocked ? 'bg-rose-500' : isRerouted ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                <span>{isBlocked ? 'Path Compromised' : isRerouted ? 'Hazard Rerouted' : 'Optimal Route Safe'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Validates real-time IoT sensor telemetry and computes dynamically rerouted egress corridors
            </p>
          </div>
        </div>

        {/* Quick Hazard Test Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSimulateCorridorSmoke}
            disabled={scenarioLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Simulate smoke in Corridor C and test rerouting"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Smoke in Corridor C</span>
          </button>

          <button
            onClick={handleSimulateExitBBlock}
            disabled={scenarioLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Simulate blockage of Exit B"
          >
            <DoorClosed className="w-3.5 h-3.5 text-amber-400" />
            <span>Block Exit B</span>
          </button>

          <button
            onClick={handleRestore}
            disabled={scenarioLoading}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Reset hazards and restore primary optimal routes"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Origin Selection & Options Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-lg p-2.5 mt-3.5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Origin Room:
            </label>
            <select
              value={startRoom}
              onChange={(e) => {
                setStartRoom(e.target.value);
                calculateRoute(e.target.value);
              }}
              className="bg-slate-900 border border-slate-700/80 text-white text-xs rounded-md px-2.5 py-1 focus:outline-none focus:border-slate-500"
            >
              {rooms.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={avoidSensors}
              onChange={(e) => setAvoidSensors(e.target.checked)}
              className="w-3.5 h-3.5 accent-sky-500 rounded bg-slate-900 border-slate-700"
            />
            <span>Auto-avoid active sensor hazard zones</span>
          </label>
        </div>

        <button
          onClick={() => calculateRoute()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium shadow-sm transition-all disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Finding Route...' : 'Find Dynamic Route'}</span>
        </button>
      </div>

      {/* Dynamic Route Results Display */}
      {routeResult && (
        <div className="mt-3.5 space-y-3">
          {/* Breadcrumb Path Banner */}
          <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
            <div className="flex items-center justify-between text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-2.5">
              <span>Evacuation Breadcrumb Sequence</span>
              <div className="flex items-center gap-3">
                <span>Destination: <strong className="text-emerald-400">{routeResult.target_exit}</strong></span>
                <span>•</span>
                <span>Transit: <strong className="text-slate-200">{routeResult.total_steps} steps</strong></span>
              </div>
            </div>

            {routeResult.route_steps && routeResult.route_steps.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {routeResult.route_steps.map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
                      {renderStepIcon(step.type)}
                      <div>
                        <div className="text-xs font-semibold text-white whitespace-nowrap">{step.label}</div>
                        <div className="text-[9px] font-mono text-slate-400 uppercase">{step.type}</div>
                      </div>
                    </div>
                    {idx < routeResult.route_steps.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg font-mono">
                No viable evacuation route found. All accessible paths are currently obstructed or compromised.
              </div>
            )}
          </div>

          {/* AI Guidance Callout */}
          <div className={`p-3 rounded-lg border text-xs leading-relaxed ${
            isBlocked
              ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
              : isRerouted
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5 text-white">
                  Dynamic Route Guidance:
                </strong>
                {routeResult.ai_guidance}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sensor Threshold Breach Modal Popup */}
      <SensorAlertPopup
        isOpen={showAlertPopup}
        alert={activeAlert}
        onClose={() => setShowAlertPopup(false)}
        onRecalculateRoute={() => calculateRoute()}
        onResetSensors={handleRestore}
      />
    </div>
  );
};
