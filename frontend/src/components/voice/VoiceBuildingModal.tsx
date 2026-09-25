import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Sparkles,
  Layers,
  X,
  Radio,
  CheckCircle2,
  AlertCircle,
  Volume2
} from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { projectApi } from '../../services/api';

interface VoiceBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (projectId: number) => void;
}

const SAMPLE_VOICE_PROMPTS = [
  {
    title: 'Urgent Care Clinical Wing',
    type: 'Healthcare',
    text: 'Create an urgent care medical facility with 3 patient rooms: Room A, Room B, and Room C. All three rooms connect through fire doors to the Central Corridor. Stair 1 leads down to Exit North, and Exit South is located at the other wing. Place smoke detectors in all rooms and an obstruction sensor on Exit South.'
  },
  {
    title: 'Commercial Office Suite',
    type: 'Commercial',
    text: 'Build a commercial office with 4 rooms: Conference Room A, Office B, Breakroom C, and Server Room D. There is a Main Corridor connecting all rooms. Stair 1 leads down to Exit 1, and Exit 2 is at the opposite end. Conference Room A and Breakroom C have smoke detectors and an emergency fire door is located before Stair 1.'
  },
  {
    title: 'Academic Science Laboratory',
    type: 'Educational',
    text: 'Construct an educational science building with 4 research labs: Lab 1, Lab 2, Lab 3, and Lab 4. They all connect via standard doors to the East Corridor. An ADA compliant Ramp leads to Exit West, while Stair 2 leads to Exit East. Add heat and smoke sensors in the labs.'
  }
];

export const VoiceBuildingModal: React.FC<VoiceBuildingModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated
}) => {
  const navigate = useNavigate();
  const {
    isListening,
    transcript,
    isSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript
  } = useSpeechRecognition();

  const [buildingName, setBuildingName] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleListen = () => {
    if (isListening) {
      stopListening();
    } else {
      setBuildError(null);
      startListening();
    }
  };

  const handleUseSample = (sampleText: string, suggestedName: string) => {
    setTranscript(sampleText);
    setBuildingName(suggestedName);
    setBuildError(null);
  };

  const handleBuildGraph = async () => {
    const textToSubmit = transcript.trim();
    if (!textToSubmit) {
      setBuildError('Please speak or enter a description of the building layout first.');
      return;
    }

    setIsBuilding(true);
    setBuildError(null);
    setSuccessMessage(null);

    try {
      const result = await projectApi.buildProjectFromVoice(
        textToSubmit,
        buildingName.trim() || undefined
      );

      setSuccessMessage(
        `Synthesized "${result.project_name}" with vector CAD Blueprint, ${result.elements_created} elements, and ${result.sensors_seeded} IoT safety sensors.`
      );

      setTimeout(() => {
        onClose();
        if (onProjectCreated) {
          onProjectCreated(result.project_id);
        }
        navigate(`/projects/${result.project_id}`);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to build project from speech:', err);
      setBuildError(
        err.response?.data?.detail ||
        'Failed to parse speech and construct Safety Graph. Please try again or check network.'
      );
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-rose-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  Voice-to-Blueprint & Topological Graph Synthesizer
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  CAD + NLP
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dictate spatial layout (rooms, doors, corridors, stairs, exits) to generate vector CAD drawings and safety graph
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Architecture Pipeline Flow */}
          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Voice Dictation</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Spatial NLP Parser</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Vector CAD & Safety Graph</span>
            </div>
          </div>

          {/* Microphone Acoustic Studio Section */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-xl border border-slate-800/80">
            <button
              onClick={handleToggleListen}
              disabled={isBuilding}
              className={`p-4 rounded-full transition-all duration-200 border ${
                isListening
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 ring-4 ring-rose-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:text-white'
              }`}
            >
              {isListening ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            <div className="mt-3 text-center">
              <p className="text-xs font-medium text-slate-200 flex items-center justify-center gap-2">
                {isListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>Recording speech input... Click to stop</span>
                  </>
                ) : (
                  'Click microphone to record architectural layout'
                )}
              </p>
              {!isSupported && (
                <p className="text-[11px] text-amber-400 mt-1">
                  (Browser speech API unavailable. Select a preset below or type description directly.)
                </p>
              )}
              {speechError && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {speechError}
                </p>
              )}
            </div>
          </div>

          {/* Transcript / Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Spoken Building Description
              </label>
              {transcript && (
                <button
                  type="button"
                  onClick={resetTranscript}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear transcript
                </button>
              )}
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g. 'Build an emergency medical facility with 3 rooms: Trauma Center, ICU, and Pharmacy. All connect to the Central Hallway. Stair 1 leads down to Exit North...'"
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600 resize-none font-mono leading-relaxed"
            />
          </div>

          {/* Optional Building Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Building Name (Optional)
            </label>
            <input
              type="text"
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              placeholder="e.g. St. Jude Emergency Wing"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600"
            />
          </div>

          {/* Preset Sample Layout Prompts */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Preset Architectural Prompts:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {SAMPLE_VOICE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleUseSample(sample.text, sample.title)}
                  className="p-3 text-left bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-lg transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {sample.title}
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                      {sample.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {sample.text}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Error & Success Messages */}
          {buildError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{buildError}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Real-time CAD Vector Engine • NetworkX Graph Topology
          </p>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              disabled={isBuilding}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBuildGraph}
              disabled={isBuilding || !transcript.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isBuilding ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing CAD Model...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Synthesize CAD & Safety Graph</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
