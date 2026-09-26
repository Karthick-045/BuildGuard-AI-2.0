import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Settings2, 
  RotateCcw, 
  Key, 
  ShieldCheck, 
  ExternalLink,
  Copy, 
  Check, 
  Zap, 
  Minimize2, 
  Maximize2, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Navigation,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  Radio,
  Layers,
  ArrowRight,
  Compass,
  RefreshCw
} from 'lucide-react';
import { projectApi } from '../../services/api';
import { ChatMessage, ChatResponse, ChatStatus } from '../../types';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface AgentChatbotProps {
  projectId: number;
  projectName?: string;
}

const SAMPLE_VOICE_PROMPTS = [
  {
    title: 'Urgent Care Clinic',
    type: 'Healthcare',
    name: 'St. Jude Urgent Care Wing',
    text: 'Create an urgent care medical facility with 3 patient rooms: Room A, Room B, and Room C. All three rooms connect through fire doors to the Central Corridor. Stair 1 leads down to Exit North, and Exit South is located at the other wing. Place smoke detectors in all rooms and an obstruction sensor on Exit South.'
  },
  {
    title: 'Commercial Office Suite',
    type: 'Commercial',
    name: 'Apex Commercial Suite',
    text: 'Build a commercial office with 4 rooms: Conference Room A, Office B, Breakroom C, and Server Room D. There is a Main Corridor connecting all rooms. Stair 1 leads down to Exit 1, and Exit 2 is at the opposite end. Conference Room A and Breakroom C have smoke detectors and an emergency fire door is located before Stair 1.'
  },
  {
    title: 'Academic Science Lab',
    type: 'Educational',
    name: 'Newton Science Laboratory',
    text: 'Construct an educational science building with 4 research labs: Lab 1, Lab 2, Lab 3, and Lab 4. They all connect via standard doors to the East Corridor. An ADA compliant Ramp leads to Exit West, while Stair 2 leads to Exit East. Add heat and smoke sensors in the labs.'
  }
];

export const AgentChatbot: React.FC<AgentChatbotProps> = ({ projectId, projectName }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat');

  // Dynamic project tracking synchronized with Dashboard facility dropdown
  const [activeProjectId, setActiveProjectId] = useState<number>(projectId);
  const [activeProjectName, setActiveProjectName] = useState<string>(projectName || `Project #${projectId}`);

  // Device Geolocation (GPS) state
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Speech Recognition & Synthesis hooks
  const {
    isListening,
    transcript: speechTranscript,
    isSupported: speechRecSupported,
    startListening,
    stopListening,
    resetTranscript: resetSpeechTranscript,
    setTranscript: setSpeechTranscript
  } = useSpeechRecognition();

  const {
    isSpeaking,
    speak: speakText,
    stop: stopSpeech
  } = useSpeechSynthesis();

  // Voice Architect Mode States
  const [voiceBuildingName, setVoiceBuildingName] = useState('');
  const [isBuildingVoice, setIsBuildingVoice] = useState(false);
  const [voiceBuildError, setVoiceBuildError] = useState<string | null>(null);
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState<string | null>(null);

  // API Key & Provider Settings (Persisted in localStorage)
  const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [serverStatus, setServerStatus] = useState<ChatStatus | null>(null);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync prop changes
  useEffect(() => {
    setActiveProjectId(projectId);
    if (projectName) setActiveProjectName(projectName);
  }, [projectId, projectName]);

  // Listen for global custom events from Dashboard or other components
  useEffect(() => {
    const handleProjectChanged = (e: any) => {
      if (e.detail?.projectId) {
        setActiveProjectId(e.detail.projectId);
        if (e.detail?.projectName) {
          setActiveProjectName(e.detail.projectName);
        }
      }
    };

    const handleOpenVoice = () => {
      setIsOpen(true);
      setActiveTab('voice');
    };

    window.addEventListener('buildguard_project_changed', handleProjectChanged as EventListener);
    window.addEventListener('open_chatbot_voice_mode', handleOpenVoice);

    return () => {
      window.removeEventListener('buildguard_project_changed', handleProjectChanged as EventListener);
      window.removeEventListener('open_chatbot_voice_mode', handleOpenVoice);
    };
  }, []);

  // Geolocation acquisition
  const fetchGeolocation = () => {
    if (!navigator.geolocation) {
      setGpsError('GPS Geolocation unavailable in browser');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Geolocation warning:', err.message);
        setGpsError(err.message);
        setGpsLoading(false);
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    fetchGeolocation();
  }, []);

  // Sync speech recognition into chat input when in chat mode
  useEffect(() => {
    if (activeTab === 'chat' && isListening && speechTranscript) {
      setInputMessage(speechTranscript);
    }
  }, [speechTranscript, isListening, activeTab]);

  // Load saved keys & server status
  useEffect(() => {
    const savedProvider = (localStorage.getItem('buildguard_llm_provider') as 'gemini' | 'openai') || 'gemini';
    const savedGeminiKey = localStorage.getItem('buildguard_gemini_api_key') || '';
    const savedOpenAiKey = localStorage.getItem('buildguard_openai_api_key') || '';

    setProvider(savedProvider);
    setApiKey(savedProvider === 'gemini' ? savedGeminiKey : savedOpenAiKey);

    projectApi.getChatStatus()
      .then(res => setServerStatus(res))
      .catch(err => console.warn('Could not fetch chat status', err));
  }, []);

  // Initialize greeting message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          sender: 'agent',
          content: `👋 Hello! I am your **BuildGuard AI Safety Copilot & Egress Navigator** for **${activeProjectName}**.\n\nI am synchronized with the active **Topological Safety Graph** and **IoT Sensor Network**. You can ask me:\n- 🚶 *"I want to go out of this campus"* (calculates step-by-step egress route)\n- 🚪 *"What is the nearest emergency exit?"*\n- 📡 *"Are there any active fire/smoke sensor alarms?"*\n- 🔍 *"Which elements are single points of failure?"*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider_used: 'BuildGuard Real-Data Engine',
          isGrounded: true,
        }
      ]);
    }
  }, [isOpen, activeProjectId, activeProjectName, messages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading, activeTab]);

  // Save Settings
  const handleSaveSettings = (newProvider: 'gemini' | 'openai', newKey: string) => {
    setProvider(newProvider);
    setApiKey(newKey);
    localStorage.setItem('buildguard_llm_provider', newProvider);
    if (newProvider === 'gemini') {
      localStorage.setItem('buildguard_gemini_api_key', newKey);
    } else {
      localStorage.setItem('buildguard_openai_api_key', newKey);
    }
    setShowSettings(false);
  };

  const handleProviderChange = (newProvider: 'gemini' | 'openai') => {
    setProvider(newProvider);
    const key = newProvider === 'gemini' 
      ? localStorage.getItem('buildguard_gemini_api_key') || '' 
      : localStorage.getItem('buildguard_openai_api_key') || '';
    setApiKey(key);
  };

  // Send message in Chat mode
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.content
      }));

      const res: ChatResponse = await projectApi.chatWithAgent(
        activeProjectId,
        text,
        apiKey || undefined,
        provider,
        history,
        undefined,
        gpsCoords || undefined
      );

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider_used: res.provider_used,
        isGrounded: true,
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'agent',
        content: `⚠️ **Service Error**: ${err?.response?.data?.detail || err.message || 'Failed to reach AI Agent.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider_used: 'System Error',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Handle Voice Architect building synthesis
  const handleSynthesizeBuilding = async () => {
    const text = speechTranscript.trim();
    if (!text) {
      setVoiceBuildError('Please speak or type a description of the building layout first.');
      return;
    }

    setIsBuildingVoice(true);
    setVoiceBuildError(null);
    setVoiceSuccessMsg(null);

    try {
      const result = await projectApi.buildProjectFromVoice(
        text,
        voiceBuildingName.trim() || undefined
      );

      setVoiceSuccessMsg(
        `Synthesized "${result.project_name}" with vector CAD Blueprint, ${result.elements_created} elements, and ${result.sensors_seeded} IoT safety sensors.`
      );

      // Broadcast project change event so Dashboard updates immediately
      window.dispatchEvent(new CustomEvent('buildguard_project_changed', {
        detail: { projectId: result.project_id, projectName: result.project_name }
      }));

      setActiveProjectId(result.project_id);
      setActiveProjectName(result.project_name);

      // Append confirmation message into chat log
      setMessages(prev => [
        ...prev,
        {
          id: `created-${Date.now()}`,
          sender: 'agent',
          content: `🏗️ **New Facility Synthesized via Voice Architect!**\n\n- **Project**: **${result.project_name}** (ID #${result.project_id})\n- **Synthesized Elements**: ${result.elements_created} (Rooms, Doors, Corridors, Exits)\n- **Active IoT Sensors**: ${result.sensors_seeded}\n\nThe topological safety graph is now active on your dashboard. You can ask for egress navigation or inspect sensor alerts.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider_used: 'Voice Architectural Engine',
          isGrounded: true
        }
      ]);

      setTimeout(() => {
        setActiveTab('chat');
      }, 1200);

    } catch (err: any) {
      console.error('Failed to synthesize building from voice:', err);
      setVoiceBuildError(
        err.response?.data?.detail || 'Failed to parse speech and construct Safety Graph. Please verify your connection.'
      );
    } finally {
      setIsBuildingVoice(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick prompt suggestions
  const quickPrompts = [
    { label: '🚶 Exit Campus', query: 'I want to go out of this campus', highlight: true },
    { label: '🚪 Nearest Exit', query: 'What is the nearest emergency exit and safe path?' },
    { label: '📡 Sensors', query: 'What is the status of the building sensors and telemetry?' },
    { label: '🔥 Active Alarms', query: 'Are there any fire, smoke, or hazard alarms active right now?' },
    { label: '🔍 Articulation Points', query: 'Which elements are articulation points in this building?' },
    { label: '⚠️ Block Exit B', query: 'What happens if Exit B is blocked?' },
    { label: '📋 8 Checks', query: 'Summarize the 8 safety checks for this project.' },
  ];

  // Helper to format basic markdown (bold, headers, bullets, code)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed text-slate-200">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('#### ')) {
            return (
              <h5 key={idx} className="font-bold text-xs text-sky-300 mt-2 mb-1 flex items-center gap-1">
                {trimmed.replace('#### ', '')}
              </h5>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-sm text-sky-400 mt-2 mb-1 border-b border-slate-700/60 pb-1">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-bold text-sm text-emerald-400 mt-2.5 mb-1">
                {trimmed.replace('## ', '')}
              </h3>
            );
          }
          if (trimmed.startsWith('> ')) {
            return (
              <div key={idx} className="pl-3 border-l-2 border-amber-500/80 bg-amber-500/10 py-1 px-2 rounded-r text-[11px] text-amber-300 my-1.5">
                {trimmed.replace('> ', '')}
              </div>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-sky-400 select-none">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.substring(2)) }} />
              </div>
            );
          }
          if (/^\d+\.\s/.test(trimmed)) {
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1.5 py-0.5">
                <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
              </div>
            );
          }
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInline = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-300 italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-900/90 text-sky-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-700/50">$1</code>');
  };

  return (
    <>
      {/* 1. Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-full shadow-2xl shadow-black/70 border border-slate-700/80 backdrop-blur-md transition-all duration-150 hover:scale-[1.02] group"
          title="Open BuildGuard AI Safety Copilot & Voice Architect"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-4 h-4 text-sky-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-white">Safety Copilot & Voice</span>
          <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono">Graph-Synced</span>
        </button>
      )}

      {/* 2. Chat Window / Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 ease-out flex flex-col bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl shadow-black/80 overflow-hidden ${
            isExpanded
              ? 'inset-6 lg:inset-x-24 lg:inset-y-8'
              : 'bottom-6 right-6 w-[94vw] sm:w-[500px] h-[660px] max-h-[88vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
                {activeTab === 'chat' ? (
                  <Bot className="w-4 h-4 text-sky-400" />
                ) : (
                  <Mic className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white tracking-tight">BuildGuard AI</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" /> Graph-Synced
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 max-w-[240px] truncate">
                  <span className="text-slate-300 font-medium truncate">{activeProjectName}</span>
                  <span>•</span>
                  <span className="text-sky-300 font-mono text-[9px]">
                    {apiKey ? (provider === 'gemini' ? 'Gemini 3.5' : 'GPT-4o-mini') : 'Real-Data'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(prev => !prev)}
                className={`p-1.5 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-800 ${
                  showSettings ? 'bg-slate-800 text-sky-400' : ''
                }`}
                title="API Key Settings"
              >
                <Settings2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setMessages([]);
                  setIsOpen(false);
                  setTimeout(() => setIsOpen(true), 50);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Reset Conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
                title={isExpanded ? 'Restore Size' : 'Expand Window'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                title="Close Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center border-b border-slate-800 bg-slate-900/60 px-3 pt-2">
            <button
              onClick={() => {
                if (isListening) stopListening();
                setActiveTab('chat');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                activeTab === 'chat'
                  ? 'border-sky-500 text-sky-400 bg-slate-950/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Safety Copilot</span>
            </button>

            <button
              onClick={() => {
                if (isListening) stopListening();
                setActiveTab('voice');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                activeTab === 'voice'
                  ? 'border-rose-500 text-rose-400 bg-slate-950/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              <span>Voice Architect</span>
              <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/30">Build</span>
            </button>

            {/* Geolocation Status Badge */}
            <div className="ml-auto flex items-center gap-1.5 pb-1.5 text-[10px]">
              {gpsLoading ? (
                <span className="text-slate-400 flex items-center gap-1 font-mono">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-sky-400" /> GPS...
                </span>
              ) : gpsCoords ? (
                <span
                  onClick={fetchGeolocation}
                  className="cursor-pointer text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 hover:border-emerald-400 transition-colors"
                  title={`Live Geolocation: ${gpsCoords.latitude.toFixed(5)}° N, ${gpsCoords.longitude.toFixed(5)}° E (±${gpsCoords.accuracy?.toFixed(0)}m). Click to refresh.`}
                >
                  <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                  <span>GPS Active</span>
                </span>
              ) : (
                <button
                  onClick={fetchGeolocation}
                  className="text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-1 text-[10px]"
                  title="Click to acquire device GPS coordinates"
                >
                  <Compass className="w-2.5 h-2.5" /> Enable GPS
                </button>
              )}
            </div>
          </div>

          {/* Settings Sub-Panel */}
          {showSettings && (
            <div className="bg-slate-850 p-4 border-b border-slate-700/80 bg-slate-900/95 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  AI Model & API Key Configuration
                </span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Provider</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleProviderChange('gemini')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                        provider === 'gemini'
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Google Gemini
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProviderChange('openai')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                        provider === 'openai'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      OpenAI (GPT-4o)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Your {provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Stored locally in your browser. Leave blank to use BuildGuard's real-data deterministic engine.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setApiKey('');
                      handleSaveSettings(provider, '');
                    }}
                    className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    Clear Key
                  </button>
                  <button
                    onClick={() => handleSaveSettings(provider, apiKey)}
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    Save & Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: SAFETY COPILOT CHAT */}
          {activeTab === 'chat' && (
            <>
              {/* Quick Suggestion Chips */}
              <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-400" /> Quick:
                </span>
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.query)}
                    disabled={isLoading}
                    className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition-all disabled:opacity-50 flex items-center gap-1 ${
                      p.highlight
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 hover:border-emerald-400 font-semibold'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border-slate-700/60 hover:border-slate-500'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.sender === 'agent' && (
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] rounded-2xl p-3 relative group transition-all ${
                        m.sender === 'user'
                          ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md rounded-br-none'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 shadow-sm rounded-tl-none'
                      }`}
                    >
                      {/* Message Content */}
                      {m.sender === 'user' ? (
                        <p className="text-xs whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        renderFormattedContent(m.content)
                      )}

                      {/* Message Footer / Metadata */}
                      <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 border-t border-white/10 text-[9px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span>{m.timestamp}</span>
                          {m.provider_used && (
                            <>
                              <span>•</span>
                              <span className="text-sky-300 font-mono">{m.provider_used}</span>
                            </>
                          )}
                        </div>

                        {m.sender === 'agent' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => isSpeaking ? stopSpeech() : speakText(m.content)}
                              className="p-0.5 text-slate-400 hover:text-cyan-300 transition-colors"
                              title={isSpeaking ? "Stop Voice Response" : "🔊 Listen to Voice Response (TTS)"}
                            >
                              {isSpeaking ? (
                                <VolumeX className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-300" />
                              )}
                            </button>
                            <button
                              onClick={() => handleCopy(m.content, m.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-white"
                              title="Copy Response"
                            >
                              {copiedId === m.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl rounded-tl-none p-2.5 shadow-sm flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Computing egress paths & verifying live sensors...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Box */}
              <div className="p-3 bg-slate-950 border-t border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (isListening) stopListening();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={isListening ? "Listening... Speak your query" : "Ask: 'I want to go out of this campus', sensor alarms, egress..."}
                    disabled={isLoading}
                    className={`flex-1 bg-slate-900 border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors disabled:opacity-60 ${
                      isListening ? 'border-rose-500 ring-1 ring-rose-500/40 bg-rose-950/10' : 'border-slate-800 focus:border-slate-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (isListening) {
                        stopListening();
                      } else {
                        resetSpeechTranscript();
                        startListening();
                      }
                    }}
                    disabled={isLoading}
                    className={`p-2 rounded-lg border transition-all ${
                      isListening
                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-400 ring-2 ring-rose-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                    title={isListening ? "Listening... Click to stop" : "Speak to Safety Copilot"}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Send Message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </>
          )}

          {/* TAB 2: VOICE ARCHITECT (BUILD BY VOICE) */}
          {activeTab === 'voice' && (
            <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 bg-slate-950">
              {/* Introduction Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/30 via-purple-950/20 to-slate-900 border border-rose-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Voice & NLP Architectural Synthesis</h4>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Speak or type your building layout. BuildGuard AI will parse your spoken description, compute CAD vector coordinates, and construct an interactive Safety Graph with seeded IoT sensors.
                </p>
              </div>

              {/* Facility Name Input */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Facility Name (Optional)
                </label>
                <input
                  type="text"
                  value={voiceBuildingName}
                  onChange={(e) => setVoiceBuildingName(e.target.value)}
                  placeholder="e.g. St. Jude Urgent Care Clinic"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Speech Recording Center */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) {
                      stopListening();
                    } else {
                      setVoiceBuildError(null);
                      startListening();
                    }
                  }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                    isListening
                      ? 'bg-rose-600 text-white ring-4 ring-rose-500/30 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30'
                  }`}
                  title={isListening ? "Stop Recording" : "Click to Speak"}
                >
                  {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <div className="mt-2.5 text-center">
                  <span className={`text-xs font-medium ${isListening ? 'text-rose-400' : 'text-slate-300'}`}>
                    {isListening ? '🎙️ Listening... Speak your building layout' : 'Tap microphone to speak'}
                  </span>
                  {isListening && (
                    <div className="flex items-center justify-center gap-1 mt-1.5">
                      <span className="w-1 h-3 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-5 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-4 bg-rose-400 rounded-full animate-bounce" />
                      <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Speech Transcript Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-300">
                    Spoken Transcript / Building Description
                  </label>
                  {speechTranscript && (
                    <button
                      type="button"
                      onClick={() => {
                        resetSpeechTranscript();
                        setSpeechTranscript('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-rose-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={speechTranscript}
                  onChange={(e) => setSpeechTranscript(e.target.value)}
                  placeholder="e.g. Design a 2-story medical clinic with 3 patient rooms: Room A, Room B, and Room C connected via fire doors to a Central Corridor with 2 emergency exits..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed resize-none"
                />
              </div>

              {/* Sample Prompt Chips */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Or load sample facility blueprint:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_VOICE_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSpeechTranscript(p.text);
                        setVoiceBuildingName(p.name);
                        setVoiceBuildError(null);
                      }}
                      className="p-2 text-left bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg transition-all group"
                    >
                      <div className="text-[11px] font-semibold text-slate-200 group-hover:text-rose-400">
                        {p.title}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {p.type}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Errors & Success Messages */}
              {voiceBuildError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{voiceBuildError}</span>
                </div>
              )}

              {voiceSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{voiceSuccessMsg}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 mt-auto">
                <button
                  type="button"
                  onClick={handleSynthesizeBuilding}
                  disabled={isBuildingVoice || !speechTranscript.trim()}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBuildingVoice ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Vector CAD & Safety Graph...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Synthesize Vector CAD & Safety Graph</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
