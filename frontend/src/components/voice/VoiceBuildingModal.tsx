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
    title: '🏥 Urgent Care Medical Wing',
    type: 'Healthcare',
    text: 'Create an urgent care medical facility with 3 patient rooms: Room A, Room B, and Room C. All three rooms connect through fire doors to the Central Corridor. Stair 1 leads down to Exit North, and Exit South is located at the other wing. Place smoke detectors in all rooms and an obstruction sensor on Exit South.'
  },
  {
    title: '🏢 Commercial Office Suite',
    type: 'Commercial',
    text: 'Build a commercial office with 4 rooms: Conference Room A, Office B, Breakroom C, and Server Room D. There is a Main Corridor connecting all rooms. Stair 1 leads down to Exit 1, and Exit 2 is at the opposite end. Conference Room A and Breakroom C have smoke detectors and an emergency fire door is located before Stair 1.'
  },
  {
    title: '🏫 Educational Campus Lab',
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
        `🎉 Created "${result.project_name}" with CAD Blueprint, ${result.elements_created} elements, and ${result.sensors_seeded} IoT safety sensors!`
      );

      setTimeout(() => {
        onClose();
        if (onProjectCreated) {
          onProjectCreated(result.project_id);
        }
        navigate(`/projects/${result.project_id}`);
      }, 1200);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Voice-to-Blueprint & Safety Graph Builder
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  CAD + NLP Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Speak your building layout (rooms, doors, corridors, stairs, exits) to synthesize an Architectural CAD Blueprint & Safety Graph
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Architecture Banner */}
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Voice Speech</span>
            </div>
            <span className="text-slate-500">➔</span>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Gemini NLP Spatial Parser</span>
            </div>
            <span className="text-slate-500">➔</span>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>CAD Blueprint & Safety Graph</span>
            </div>
          </div>

          {/* Microphone Recording Section */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950/60 border border-slate-800 rounded-xl">
            <button
              onClick={handleToggleListen}
              disabled={isBuilding}
              className={`relative p-5 rounded-full transition-all duration-300 shadow-xl ${
                isListening
                  ? 'bg-red-600 text-white ring-8 ring-red-500/30 animate-pulse scale-105'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            <div className="mt-3 text-center">
              <p className="text-sm font-semibold text-white flex items-center justify-center gap-2">
                {isListening ? (
                  <>
                    <Radio className="w-4 h-4 text-red-400 animate-spin" />
                    Listening to voice description... Click to stop
                  </>
                ) : (
                  'Click microphone to start speaking'
                )}
              </p>
              {!isSupported && (
                <p className="text-xs text-amber-400 mt-1">
                  (Browser speech recognition unavailable. You can click preset samples below or type directly.)
                </p>
              )}
              {speechError && (
                <p className="text-xs text-red-400 mt-1 flex items-center justify-center gap-1">
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
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Clear transcript
                </button>
              )}
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g. 'Build a commercial clinic with 3 rooms: Room A, Room B, and Room C connected by Corridor C. Stair 1 leads down to Exit B...'"
              rows={4}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none font-mono"
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
              placeholder="e.g. St. Jude Regional Clinic"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Preset Sample Audio Prompts */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Or Try A Preset Building Layout Prompt:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {SAMPLE_VOICE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleUseSample(sample.text, sample.title.replace(/^[^\w]+/, ''))}
                  className="p-3 text-left bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 rounded-xl transition-all group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">
                    {sample.title}
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {sample.text}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Error & Success Messages */}
          {buildError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{buildError}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Powered by Gemini 3.5 & BuildGuard Safety Graph Engine
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isBuilding}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBuildGraph}
              disabled={isBuilding || !transcript.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isBuilding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Synthesizing Blueprint & Safety Graph...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Synthesize Blueprint & Safety Graph
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
