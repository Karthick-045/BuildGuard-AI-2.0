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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-rose-500 rounded-2xl max-w-xl w-full shadow-2xl shadow-rose-950/80 ring-8 ring-rose-500/20 overflow-hidden flex flex-col">
        {/* Flashing Alert Header */}
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 px-6 py-4 flex items-center justify-between text-white border-b border-rose-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm animate-bounce">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase bg-rose-950 px-2 py-0.5 rounded text-rose-300">
                  CRITICAL SENSOR EVENT
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              </div>
              <h2 className="text-base font-bold tracking-tight text-white mt-0.5">
                Safety Threshold Breach Detected
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute alert tone' : 'Mute alert tone'}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-rose-100 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-rose-100 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Main Sensor Card */}
          <div className="bg-slate-950/80 border border-rose-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSmoke && <Flame className="w-5 h-5 text-rose-500 animate-pulse" />}
                {isTemp && <Thermometer className="w-5 h-5 text-amber-500 animate-pulse" />}
                {isDoor && <DoorClosed className="w-5 h-5 text-red-400 animate-pulse" />}
                {!isSmoke && !isTemp && !isDoor && <Activity className="w-5 h-5 text-rose-500 animate-pulse" />}
                <span className="font-bold text-white text-sm">
                  {alert.element_label}
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-400 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                {alert.sensor_id}
              </span>
            </div>

            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Location: <strong>{alert.location}</strong></span>
            </div>

            {/* Threshold vs Reading Comparison */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="bg-rose-950/40 border border-rose-500/50 p-3 rounded-lg text-center">
                <span className="text-[10px] font-semibold text-rose-300 uppercase tracking-wider block mb-0.5">
                  Current Sensor Telemetry
                </span>
                <span className="text-xl font-black font-mono text-rose-400">
                  {isDoor
                    ? (alert.current_value === 0.0 ? 'BLOCKED / OPEN' : 'NORMAL')
                    : `${alert.current_value} ${alert.unit}`}
                </span>
                {percentOver !== null && (
                  <span className="block text-[10px] font-bold text-rose-300 mt-0.5">
                    ▲ +{percentOver}% Above Safe Limit
                  </span>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Safety Threshold Limit
                </span>
                <span className="text-xl font-black font-mono text-slate-200">
                  {isDoor ? '0.0 (Must Latch)' : `${alert.threshold} ${alert.unit}`}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  NFPA Life Safety Standard
                </span>
              </div>
            </div>

            {/* Specific Alert Message */}
            {alert.alert_message && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5 text-xs text-rose-200 font-medium leading-relaxed">
                ⚠️ {alert.alert_message}
              </div>
            )}
          </div>

          {/* Safety Graph Impact Notification */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0 mt-0.5">
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-white">Dynamic Safety Graph Recalculated</p>
              <p className="text-slate-400 leading-relaxed">
                BuildGuard AI has flagged <strong>{alert.element_label}</strong> as an active hazard. Egress paths passing through this zone are automatically marked compromised to prevent evacuee routing into hazardous corridors.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          {onResetSensors && (
            <button
              onClick={() => {
                onResetSensors();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Safe Baseline</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Acknowledge & Dismiss
            </button>

            {onRecalculateRoute && (
              <button
                onClick={() => {
                  onRecalculateRoute();
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Recalculate Egress Route</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
