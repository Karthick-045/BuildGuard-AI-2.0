import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Flame, 
  Thermometer, 
  DoorClosed, 
  Users, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  BatteryMedium,
  Radio,
  BellRing
} from 'lucide-react';
import { projectApi } from '../../services/api';
import { BuildingSensor, SensorListResponse } from '../../types';
import { SensorAlertPopup, SensorAlertInfo } from './SensorAlertPopup';

interface SensorTelemetryPanelProps {
  projectId: number;
  onAlertTriggered?: (alert: SensorAlertInfo) => void;
  onSensorsUpdated?: () => void;
}

export const SensorTelemetryPanel: React.FC<SensorTelemetryPanelProps> = ({
  projectId,
  onAlertTriggered,
  onSensorsUpdated,
}) => {
  const [sensorsData, setSensorsData] = useState<SensorListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activePopupAlert, setActivePopupAlert] = useState<SensorAlertInfo | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const fetchSensors = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getSensors(projectId);
      setSensorsData(data);
    } catch (err) {
      console.warn('Could not load sensor telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchSensors();
    }
  }, [projectId]);

  const handleTriggerSmokeAlarm = async () => {
    try {
      setActionLoading(true);
      await projectApi.triggerSensorAlert(projectId, {
        sensor_id: 'SENSOR_SMOKE_ROOM_B',
        value: 78.5,
        status: 'CRITICAL_ALERT',
        alert_message: 'High optical density particulate smoke detected in Room B zone 1'
      });
      const alertInfo: SensorAlertInfo = {
        sensor_id: 'SENSOR_SMOKE_ROOM_B',
        sensor_type: 'SMOKE',
        element_label: 'Room B',
        location: 'Room B Ceiling Detector Zone 1',
        status: 'CRITICAL_ALERT',
        current_value: 78.5,
        threshold: 50.0,
        unit: 'ppm',
        alert_message: 'High optical density particulate smoke detected in Room B zone 1 (78.5 ppm > 50.0 ppm limit)'
      };
      setActivePopupAlert(alertInfo);
      setShowPopup(true);
      if (onAlertTriggered) onAlertTriggered(alertInfo);
      await fetchSensors();
      if (onSensorsUpdated) onSensorsUpdated();
    } catch (err) {
      console.error('Failed to trigger smoke alarm', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerDoorBlockage = async () => {
    try {
      setActionLoading(true);
      await projectApi.triggerSensorAlert(projectId, {
        sensor_id: 'SENSOR_DOOR_EXIT_B',
        value: 0.0,
        status: 'CRITICAL_ALERT',
        alert_message: 'Exit Door B magnetic panic sensor reports physical latch obstruction'
      });
      const alertInfo: SensorAlertInfo = {
        sensor_id: 'SENSOR_DOOR_EXIT_B',
        sensor_type: 'DOOR_CONTACT',
        element_label: 'Exit Door B',
        location: 'Exit Door B Threshold & Panic Bar',
        status: 'CRITICAL_ALERT',
        current_value: 0.0,
        threshold: 0.0,
        unit: 'state',
        alert_message: 'Exit Door B magnetic panic sensor reports physical latch obstruction'
      };
      setActivePopupAlert(alertInfo);
      setShowPopup(true);
      if (onAlertTriggered) onAlertTriggered(alertInfo);
      await fetchSensors();
      if (onSensorsUpdated) onSensorsUpdated();
    } catch (err) {
      console.error('Failed to trigger door blockage', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetSensors = async () => {
    try {
      setActionLoading(true);
      await projectApi.resetSensors(projectId);
      setShowPopup(false);
      setActivePopupAlert(null);
      await fetchSensors();
      if (onSensorsUpdated) onSensorsUpdated();
    } catch (err) {
      console.error('Failed to reset sensors', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getSensorIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'SMOKE':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'TEMPERATURE':
        return <Thermometer className="w-4 h-4 text-amber-400" />;
      case 'DOOR_CONTACT':
        return <DoorClosed className="w-4 h-4 text-sky-400" />;
      case 'OCCUPANCY':
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'CO2':
        return <Wind className="w-4 h-4 text-indigo-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const sensors = sensorsData?.sensors || [];
  const activeAlerts = sensorsData?.active_alerts_count || 0;

  return (
    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-sm mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-700/60 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 border border-indigo-500/30">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                IoT Building Safety Sensor Telemetry
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                activeAlerts > 0
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}>
                {activeAlerts > 0 ? `⚠️ ${activeAlerts} Active Alarm(s)` : '✅ All Sensors Normal'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live environmental, smoke, door contact, and occupancy telemetry connected to AI Chatbot & Safety Graph
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTriggerSmokeAlarm}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Simulate high smoke particulate in Room B"
          >
            <BellRing className="w-3.5 h-3.5" />
            Simulate Smoke Alarm
          </button>

          <button
            onClick={handleTriggerDoorBlockage}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Simulate latch obstruction on Exit Door B"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Simulate Door Block
          </button>

          <button
            onClick={handleResetSensors}
            disabled={actionLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Reset all sensors to normal operating status"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3.5">
        {sensors.map((s) => {
          const isAlert = s.status === 'CRITICAL_ALERT';
          const isWarning = s.status === 'WARNING';
          return (
            <div
              key={s.sensor_id}
              className={`p-3 rounded-lg border transition-all ${
                isAlert
                  ? 'bg-rose-950/40 border-rose-500/70 shadow-sm shadow-rose-950/50'
                  : isWarning
                  ? 'bg-amber-950/30 border-amber-500/50'
                  : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {getSensorIcon(s.sensor_type)}
                  <span className="text-xs font-bold text-slate-200">{s.element_label}</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                  isAlert
                    ? 'bg-rose-500/30 text-rose-300 border-rose-500/50'
                    : isWarning
                    ? 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {s.status}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 font-mono mb-2 truncate" title={s.location}>
                {s.location}
              </div>

              <div className="flex items-end justify-between pt-1 border-t border-slate-800">
                <div>
                  <div className="text-sm font-mono font-bold text-white">
                    {s.sensor_type === 'DOOR_CONTACT' 
                      ? (s.current_value === 1.0 ? 'LATCHED' : 'BLOCKED')
                      : `${s.current_value} ${s.unit}`}
                  </div>
                  {s.threshold > 0 && (
                    <div className="text-[9px] text-slate-400">
                      Limit: {s.threshold} {s.unit}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono" title={`Battery: ${s.battery_level}%`}>
                  <BatteryMedium className="w-3 h-3 text-slate-400" />
                  <span>{s.battery_level}%</span>
                </div>
              </div>

              {s.alert_message && (
                <div className="mt-2 text-[10px] text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded p-1.5 leading-snug">
                  {s.alert_message}
                </div>
              )}

              {(isAlert || isWarning) && (
                <button
                  onClick={() => {
                    setActivePopupAlert({
                      sensor_id: s.sensor_id,
                      sensor_type: s.sensor_type,
                      element_label: s.element_label,
                      location: s.location,
                      status: s.status,
                      current_value: s.current_value,
                      threshold: s.threshold,
                      unit: s.unit,
                      alert_message: s.alert_message,
                      last_reading: s.last_reading
                    });
                    setShowPopup(true);
                  }}
                  className="mt-2 w-full py-1 px-2 rounded bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-[10px] text-rose-200 font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  View Threshold Breach
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Sensor Threshold Breach Modal Popup */}
      <SensorAlertPopup
        isOpen={showPopup}
        alert={activePopupAlert}
        onClose={() => setShowPopup(false)}
        onResetSensors={handleResetSensors}
      />
    </div>
  );
};
