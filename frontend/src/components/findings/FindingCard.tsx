import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, ShieldAlert, Sparkles, Wrench } from 'lucide-react';
import { Finding } from '../../types';

interface FindingCardProps {
  finding: Finding;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  const getSeverityBadge = () => {
    switch (finding.severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'LOW':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getStatusBadge = () => {
    switch (finding.status) {
      case 'FAIL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'REQUIRES REVIEW':
      case 'REQUIRES_REVIEW':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'WARNING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'PASS':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getIcon = () => {
    if (finding.severity === 'CRITICAL' || finding.severity === 'HIGH') {
      return <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />;
    }
    if (finding.severity === 'MEDIUM') {
      return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
    }
    return <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-600 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="mt-0.5">{getIcon()}</div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getSeverityBadge()}`}>
                {finding.severity}
              </span>
              {finding.rule_id && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-cyan-800/50">
                  {finding.rule_id}
                </span>
              )}
              <h4 className="font-semibold text-white text-sm">
                {finding.element}
              </h4>
            </div>
            <p className="text-xs font-semibold text-slate-300 mt-1">
              {finding.finding_type.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase shrink-0 ${getStatusBadge()}`}>
          {finding.status.replace(/_/g, ' ')}
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800">
        {finding.description}
      </p>

      {/* AI Explanation & Reasoning */}
      {finding.ai_explanation && (
        <div className="bg-sky-950/30 border border-sky-800/40 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-sky-400 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Safety Reasoning</span>
          </div>
          <p className="text-[11px] text-sky-200/90 leading-relaxed">
            {finding.ai_explanation}
          </p>
        </div>
      )}

      {/* Remediation Advice */}
      {finding.remediation && (
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold">
            <Wrench className="w-3.5 h-3.5" />
            <span>Recommended Mitigation</span>
          </div>
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            {finding.remediation}
          </p>
        </div>
      )}

      {/* Confidence Breakdown Bars (Slide 7) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-700/50 text-[11px]">
        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Detection</span>
            <span className="font-bold text-slate-200">{(finding.detection_confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full"
              style={{ width: `${finding.detection_confidence * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Measurement</span>
            <span className="font-bold text-slate-200">{(finding.measurement_confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-400 h-full rounded-full"
              style={{ width: `${finding.measurement_confidence * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Rule Match</span>
            <span className="font-bold text-slate-200">{(finding.rule_applicability * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full"
              style={{ width: `${finding.rule_applicability * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Evidence</span>
            <span className="font-bold text-slate-200">{(finding.evidence_quality * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full"
              style={{ width: `${finding.evidence_quality * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
