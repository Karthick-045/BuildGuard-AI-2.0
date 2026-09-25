import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Flame,
  Thermometer,
  DoorClosed,
  Activity,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Navigation,
  ShieldAlert,
  ArrowRight,
  Radio
} from 'lucide-react';
import { BuildingSensor } from '../../types';

export interface SensorAlertInfo {
  sensor_id: string;
  sensor_type: string;
  element_label: string;
  location: string;
  status: string;
  current_value: number;
  threshold: number;
  unit: string;
  alert_message?: string | null;
  last_reading?: string;
}

interface SensorAlertPopupProps {
  isOpen: boolean;
  alert: SensorAlertInfo | null;
  onClose: () => void;
  onRecalculateRoute?: () => void;
  onResetSensors?: () => void;
}

export const SensorAlertPopup: React.FC<SensorAlertPopupProps> = ({
  isOpen,
  alert,
  onClose,
  onRecalculateRoute,
  onResetSensors,
}) => {
  const [isMuted, setIsMuted] = useState(false);

  // Play audible alert chime on open
  useEffect(() => {
    if (isOpen && alert && !isMuted) {
      playAlertChime();
    }
  }, [isOpen, alert, isMuted]);

  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };

      // Dual emergency beep sequence
      playTone(880, 0, 0.18);
      playTone(660, 0.22, 0.25);
    } catch {
      // Audio playback might be deferred by browser policy before first interaction
    }
  };

  if (!isOpen || !alert) return null;

  const isSmoke = alert.sensor_type.toUpperCase() === 'SMOKE';
  const isTemp = alert.sensor_type.toUpperCase() === 'TEMPERATURE';
  const isDoor = alert.sensor_type.toUpperCase() === 'DOOR_CONTACT';

  const percentOver =
    alert.threshold > 0 && alert.current_value > alert.threshold
      ? Math.round(((alert.current_value - alert.threshold) / alert.threshold) * 100)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 border-t-2 border-t-rose-500 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Supervisory Alert Header */}
        <div className="bg-slate-900/90 px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-rose-400">
                  Critical Sensor Event
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              </div>
              <h2 className="text-sm font-semibold tracking-tight text-white mt-0.5">
                Life Safety Threshold Breach
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute alert tone' : 'Mute alert tone'}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Main Sensor Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSmoke && <Flame className="w-4 h-4 text-rose-400" />}
                {isTemp && <Thermometer className="w-4 h-4 text-amber-400" />}
                {isDoor && <DoorClosed className="w-4 h-4 text-rose-400" />}
                {!isSmoke && !isTemp && !isDoor && <Activity className="w-4 h-4 text-rose-400" />}
                <span className="font-semibold text-white text-xs">
                  {alert.element_label}
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {alert.sensor_id}
              </span>
            </div>

            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Location: <span className="text-slate-200">{alert.location}</span></span>
            </div>

            {/* Threshold vs Reading Comparison */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/80">
              <div className="bg-rose-500/5 border border-rose-500/20 p-2.5 rounded-lg text-center">
                <span className="text-[10px] font-mono font-medium text-rose-400 uppercase tracking-wider block mb-0.5">
                  Current Telemetry
                </span>
                <span className="text-lg font-bold font-mono text-rose-300">
                  {isDoor
                    ? (alert.current_value === 0.0 ? 'BLOCKED / OPEN' : 'LATCHED')
                    : `${alert.current_value} ${alert.unit}`}
                </span>
                {percentOver !== null && (
                  <span className="block text-[10px] font-mono text-rose-400 mt-0.5">
                    +{percentOver}% above limit
                  </span>
                )}
              </div>

              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-center">
                <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                  Threshold Limit
                </span>
                <span className="text-lg font-bold font-mono text-slate-200">
                  {isDoor ? '0.0 (Must Latch)' : `${alert.threshold} ${alert.unit}`}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  NFPA Standard
                </span>
              </div>
            </div>

            {/* Specific Alert Message */}
            {alert.alert_message && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-md p-2.5 text-xs text-rose-200 leading-relaxed font-mono">
                {alert.alert_message}
              </div>
            )}
          </div>

          {/* Safety Graph Impact Notification */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 flex items-start gap-2.5">
            <div className="p-1.5 rounded bg-slate-800 text-sky-400 shrink-0 mt-0.5">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs space-y-0.5">
              <p className="font-medium text-white">Dynamic Safety Graph Recalculated</p>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                BuildGuard AI flagged <strong>{alert.element_label}</strong> as an active hazard. Topological paths traversing this zone are re-routed to prevent routing through compromised egress corridors.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2.5 flex-wrap">
          {onResetSensors && (
            <button
              onClick={() => {
                onResetSensors();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Baseline</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              Acknowledge & Close
            </button>

            {onRecalculateRoute && (
              <button
                onClick={() => {
                  onRecalculateRoute();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Recalculate Route</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
