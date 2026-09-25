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
  Compass
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

  const getStepIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'ROOM': return '🚪';
      case 'DOOR': return '🚪';
      case 'CORRIDOR': return '🛣️';
      case 'STAIR': return '🪜';
      case 'RAMP': return '♿';
      case 'EXIT': return '🟢';
      default: return '📍';
    }
  };

  const isRerouted = routeResult?.route_status === 'REROUTED_DUE_TO_SENSOR';
  const isBlocked = routeResult?.route_status === 'NO_SAFE_ROUTE';

  return (
    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-sm mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-700/60 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/20 rounded-lg text-sky-400 border border-sky-500/30">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Sensor Validation & Dynamic Route Finder
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                isBlocked
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : isRerouted
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}>
                {isBlocked ? '🚨 Path Compromised' : isRerouted ? '⚠️ Hazard Rerouted' : '✅ Optimal Route Safe'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Validates real-time IoT sensor telemetry and computes dynamically rerouted egress corridors
            </p>
          </div>
        </div>

        {/* Quick Hazard Test Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSimulateCorridorSmoke}
            disabled={scenarioLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Simulate smoke in Corridor C and test rerouting"
          >
            <Flame className="w-3.5 h-3.5" />
            Smoke in Corridor C
          </button>

          <button
            onClick={handleSimulateExitBBlock}
            disabled={scenarioLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Simulate blockage of Exit B"
          >
            <DoorClosed className="w-3.5 h-3.5" />
            Block Exit B
          </button>

          <button
            onClick={handleRestore}
            disabled={scenarioLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Reset hazards and restore primary optimal routes"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore
          </button>
        </div>
      </div>

      {/* Origin Selection & Options Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-lg p-3 mt-3.5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              Origin Room:
            </label>
            <select
              value={startRoom}
              onChange={(e) => {
                setStartRoom(e.target.value);
                calculateRoute(e.target.value);
              }}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
            >
              {rooms.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={avoidSensors}
              onChange={(e) => setAvoidSensors(e.target.checked)}
              className="w-3.5 h-3.5 accent-sky-500 rounded bg-slate-800 border-slate-700"
            />
            <span>Auto-avoid active sensor hazard zones</span>
          </label>
        </div>

        <button
          onClick={() => calculateRoute()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Finding Route...' : 'Find Dynamic Route'}</span>
        </button>
      </div>

      {/* Dynamic Route Results Display */}
      {routeResult && (
        <div className="mt-3.5 space-y-3">
          {/* Breadcrumb Path Banner */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span>Evacuation Breadcrumb Path</span>
              <div className="flex items-center gap-3 lowercase">
                <span>Destination: <strong className="text-emerald-400 capitalize">{routeResult.target_exit}</strong></span>
                <span>•</span>
                <span>Transit: <strong className="text-sky-300">{routeResult.total_steps} steps</strong></span>
              </div>
            </div>

            {routeResult.route_steps && routeResult.route_steps.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {routeResult.route_steps.map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg shrink-0 shadow-sm">
                      <span className="text-sm select-none">{getStepIcon(step.type)}</span>
                      <div>
                        <div className="text-xs font-bold text-white whitespace-nowrap">{step.label}</div>
                        <div className="text-[9px] text-slate-400 uppercase">{step.type}</div>
                      </div>
                    </div>
                    {idx < routeResult.route_steps.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                🚨 No viable evacuation route found! All accessible paths are currently obstructed or compromised.
              </div>
            )}
          </div>

          {/* AI Guidance Callout */}
          <div className={`p-3 rounded-lg border text-xs leading-relaxed ${
            isBlocked
              ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
              : isRerouted
              ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
              : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
          }`}>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">
                  AI Egress Intelligence & Sensor Validation:
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
