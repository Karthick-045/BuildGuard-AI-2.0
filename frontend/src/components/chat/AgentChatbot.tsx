import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  Layers,
  HelpCircle,
  Copy,
  Check,
  Zap,
  Minimize2,
  Maximize2,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { projectApi } from '../../services/api';
import { ChatMessage, ChatResponse, ChatStatus } from '../../types';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

interface AgentChatbotProps {
  projectId: number;
  projectName?: string;
}

export const AgentChatbot: React.FC<AgentChatbotProps> = ({ projectId, projectName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Speech Recognition & Synthesis hooks
  const {
    isListening,
    transcript: speechTranscript,
    isSupported: speechRecSupported,
    startListening,
    stopListening,
    resetTranscript: resetSpeechTranscript
  } = useSpeechRecognition();

  const {
    isSpeaking,
    speak: speakText,
    stop: stopSpeech
  } = useSpeechSynthesis();

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

  // Sync speech recognition into input field
  useEffect(() => {
    if (isListening && speechTranscript) {
      setInputMessage(speechTranscript);
    }
  }, [speechTranscript, isListening]);

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

  // Initialize initial greeting message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          sender: 'agent',
          content: `👋 Hello! I am the **BuildGuard AI Inspector** for **${projectName || `Project #${projectId}`}**.\n\nAll my responses are strictly grounded in this project's **real backend safety graph**, **articulation points**, and **8 safety checks**. Ask me anything, or choose a quick prompt below!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider_used: 'BuildGuard Real-Data Engine',
          isGrounded: true,
        }
      ]);
    }
  }, [isOpen, projectId, projectName, messages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

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

  // Send message
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
      // Build conversation history format
      const history = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.content
      }));

      const res: ChatResponse = await projectApi.chatWithAgent(
        projectId,
        text,
        apiKey || undefined,
        provider,
        history
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

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick prompt suggestions
  const quickPrompts = [
    { label: '📡 Sensor Telemetry', query: 'What is the status of the building sensors and telemetry?' },
    { label: '🔥 Active Alarms', query: 'Are there any fire, smoke, or hazard alarms active right now?' },
    { label: '🔍 Articulation Points', query: 'Which elements are articulation points in this building?' },
    { label: '⚠️ Block Exit B', query: 'What happens if Exit B is blocked?' },
    { label: '📋 8 Safety Checks', query: 'Summarize the 8 safety checks for this project.' },
    { label: '♿ Ramp 1 ADA', query: 'Is Ramp 1 ADA compliant according to the inspection?' },
    { label: '📐 Plan vs Actual', query: 'Show plan vs actual variances detected in construction.' },
    { label: '🛠️ Remediation Plan', query: 'What are the top priority remediation recommendations?' },
  ];

  // Helper to format basic markdown (bold, headers, bullets, code)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed text-slate-200">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
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
          title="Open BuildGuard AI Inspector Chatbot"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-4 h-4 text-sky-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-white">Safety Copilot</span>
          <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono">Real-Data</span>
        </button>
      )}

      {/* 2. Chat Window / Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 ease-out flex flex-col bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl shadow-black/80 overflow-hidden ${
            isExpanded
              ? 'inset-6 lg:inset-x-24 lg:inset-y-10'
              : 'bottom-6 right-6 w-[92vw] sm:w-[480px] h-[640px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Bot className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white tracking-tight">BuildGuard AI</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" /> Real Data
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span>Project #{projectId}</span>
                  <span>•</span>
                  <span className="text-sky-300 font-mono">
                    {apiKey ? (provider === 'gemini' ? 'Gemini 2.5 Flash' : 'GPT-4o-mini') : 'Deterministic Engine'}
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
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
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
                    Key is stored locally in your browser. Leave empty to use the built-in deterministic real-data reasoning engine.
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
                className="shrink-0 text-[11px] bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700/60 transition-all hover:border-slate-500 disabled:opacity-50"
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
                  className={`max-w-[85%] rounded-2xl p-3 relative group transition-all ${
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
                    Querying safety graph topology & egress rules...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
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
                placeholder={isListening ? "Listening to audio transcript... Speak now" : "Query egress paths, IoT sensors, what-if simulations..."}
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
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 ring-2 ring-rose-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
                title={isListening ? "Listening... Click to stop" : "Speak to AI Copilot (Voice Input)"}
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
        </div>
      )}
    </>
  );
};
