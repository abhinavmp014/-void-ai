import React, { useState, useEffect, useRef } from 'react';
import { ModelType, Message, ChatSession, UserProfile, GroundingSource } from './types';
import { MODELS, CREDIT_RULES } from './constants';
import { getAIResponse, generateImage, getAIResponseStream } from './services/geminiService';
import { loadChats, saveChats, loadProfile, saveProfile } from './services/storageService';
import Sidebar from './components/Sidebar';
import MessageContent from './components/MessageContent';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [profile, setProfile] = useState<UserProfile>({ name: 'User', credits: 5000, tier: 'pro' });
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini-pro');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [forceArchitectMode, setForceArchitectMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadedChats = loadChats();
    const loadedProfile = loadProfile({ name: 'Architect Guest', credits: 5000, tier: 'pro' });
    setSessions(loadedChats);
    setProfile(loadedProfile);
    if (loadedChats.length > 0) {
      setCurrentSessionId(loadedChats[0].id);
    } else {
      handleNewChat();
    }

    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasCustomKey(selected);
    }
  };

  useEffect(() => {
    saveChats(sessions);
  }, [sessions]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [sessions, currentSessionId, isLoading]);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Architect Protocol Initialized',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleOpenSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasCustomKey(true);
      setQuotaExceeded(false);
    }
  };

  const updateMessageContent = (sessionId: string, messageId: string, content: string, isStreaming: boolean = false, sources?: GroundingSource[]) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { 
            ...s, 
            messages: s.messages.map(m => 
              m.id === messageId ? { ...m, content, isStreaming, sources: sources || m.sources } : m
            )
          } 
        : s
    ));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (!currentSession) return;

    const userText = input;
    const isArchitect = forceArchitectMode || userText.toLowerCase().includes('generate code') || userText.toLowerCase().includes('website') || userText.toLowerCase().includes('build') || userText.toLowerCase().includes('create an app');
    
    setInput('');
    setQuotaExceeded(false);

    let type: Message['type'] = 'text';
    let cost = CREDIT_RULES.BASIC_CHAT;

    if (isArchitect) {
      type = 'code';
      cost = CREDIT_RULES.CODE_GENERATION;
    } else if (userText.toLowerCase().includes('generate an image')) {
      type = 'image';
      cost = CREDIT_RULES.IMAGE_GENERATION;
    }

    if (profile.credits < cost) {
      alert("Neural Depletion. Please regenerate Energy Units.");
      return;
    }

    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
      type
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { 
            ...s, 
            messages: [...s.messages, userMessage], 
            title: s.messages.length === 0 ? userText.slice(0, 30) : s.title,
            updatedAt: Date.now() 
          } 
        : s
    ));

    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      type,
      modelId: selectedModel,
      isStreaming: true
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: [...s.messages, aiMessage] } 
        : s
    ));

    try {
      if (type === 'image') {
        const imageUrl = await generateImage(userText);
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { 
                ...s, 
                messages: s.messages.map(m => 
                  m.id === aiMessageId ? { ...m, content: "Neural render complete.", imageUrl, isStreaming: false } : m
                )
              } 
            : s
        ));
      } else {
        const history = currentSession.messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));
        
        let fullText = '';
        try {
          for await (const chunk of getAIResponseStream(userText, selectedModel, history, forceArchitectMode)) {
            fullText += chunk;
            updateMessageContent(currentSessionId, aiMessageId, fullText, true);
          }
          updateMessageContent(currentSessionId, aiMessageId, fullText, false);
        } catch (streamErr) {
          const { text, sources } = await getAIResponse(userText, selectedModel, history, forceArchitectMode);
          updateMessageContent(currentSessionId, aiMessageId, text, false, sources);
        }
      }
      
      setProfile(prev => ({ ...prev, credits: Math.max(0, prev.credits - cost) }));

    } catch (error: any) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Neural link failure";
      
      if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429")) {
        setQuotaExceeded(true);
        updateMessageContent(currentSessionId, aiMessageId, "Lead Architect Quota Reached. High-capacity operations require a dedicated Neural Signature (API Key).", false);
      } else {
        updateMessageContent(currentSessionId, aiMessageId, `Architect Error: ${errorMessage}. System requires diagnostic review.`, false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex h-screen bg-[#050508] text-gray-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={handleNewChat}
        profile={profile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        hasCustomKey={hasCustomKey}
        onSwitchKey={handleOpenSelectKey}
      />

      <main className="flex-1 flex flex-col relative h-full bg-[radial-gradient(circle_at_50%_0%,_#0c0c16_0%,_#050508_100%)]">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 md:px-10 bg-[#050508]/80 backdrop-blur-2xl z-30">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-3 -ml-3 text-gray-400 hover:text-white md:hidden transition-all bg-white/5 rounded-xl border border-white/5"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] animate-pulse">
                V
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-black tracking-tighter leading-none text-white uppercase italic">Void Core</h1>
                <p className="text-[10px] text-indigo-500 font-black tracking-[0.3em] mt-1.5 uppercase">Architect Edition 6.0</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setForceArchitectMode(!forceArchitectMode)}
               className={`hidden sm:flex items-center gap-2 px-4 py-2 border rounded-full transition-all ${forceArchitectMode ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}
             >
               <div className={`w-2 h-2 rounded-full ${forceArchitectMode ? 'bg-white' : 'bg-gray-700'} ${forceArchitectMode ? 'animate-pulse' : ''}`}></div>
               <span className="text-[10px] font-black uppercase tracking-widest">Architect Mode</span>
             </button>
             <div className="flex bg-[#0f0f17] border border-white/5 rounded-2xl py-2 px-4 items-center gap-4 shadow-2xl">
               <div className="flex flex-col items-end">
                 <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Neural Link</span>
                 <span className={`text-[10px] font-black ${hasCustomKey ? 'text-indigo-400' : 'text-emerald-500'}`}>{hasCustomKey ? 'PRIVATE' : 'COLLECTIVE'}</span>
               </div>
               <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${hasCustomKey ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'} border border-white/5`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
               </div>
             </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 space-y-12 max-w-5xl mx-auto w-full">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-28 h-28 bg-indigo-600/5 rounded-[2.5rem] flex items-center justify-center mb-10 border border-indigo-500/10 relative group">
                <div className="absolute inset-0 bg-indigo-500/5 rounded-[2.5rem] blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700"></div>
                <svg className="w-14 h-14 text-indigo-500 relative z-10 animate-float" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter leading-none italic uppercase">Architect Mode.</h2>
              <p className="max-w-lg text-gray-500 text-sm md:text-lg leading-relaxed mb-16 font-medium">Exhaustive 1000+ line neural development. Switch to Architect Mode for high-capacity, modular application builds.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl">
                {[
                  { title: "SaaS Platform Engine", prompt: "Generate 1000+ lines for a complete React 19 SaaS dashboard with authentication, analytics, and settings.", icon: "⟨/⟩", model: 'gemini-pro' },
                  { title: "Enterprise Module", prompt: "Solve complex architectural patterns and provide a step-by-step logic analysis.", icon: "⚙️", model: 'gemini-pro' },
                  { title: "High-Fidelity Render", prompt: "Generate an image of a biological neural network integrated into a quantum processor.", icon: "🧠", model: 'gemini-pro' },
                  { title: "Core Research", prompt: "Conduct a deep research analysis on the future of AGI and provide a detailed report.", icon: "🔍", model: 'gemini-pro' }
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setSelectedModel(item.model as ModelType);
                      setInput(item.prompt);
                    }} 
                    className="p-6 bg-[#0f0f17] border border-white/5 hover:border-indigo-500/40 hover:bg-[#151520] transition-all rounded-[2rem] text-left group active:scale-[0.97] shadow-xl"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-all flex items-center justify-center font-black text-gray-600 mb-4 text-sm border border-white/5">
                      {item.icon}
                    </div>
                    <div className="font-black text-gray-100 text-sm group-hover:text-white transition-colors uppercase tracking-tight">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed italic">"{item.prompt}"</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            currentSession.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-6 duration-700`}>
                <div className={`flex gap-6 max-w-[95%] sm:max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-12 h-12 rounded-[1.25rem] flex items-center justify-center font-black text-sm border shadow-2xl ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 border-indigo-400/30 text-white' 
                      : 'bg-[#0f0f17] border-white/5 text-gray-400'
                  }`}>
                    {msg.role === 'user' ? profile.name[0] : 'V'}
                  </div>
                  <div className={`space-y-3 ${msg.role === 'user' ? 'text-right' : 'w-full flex-1'}`}>
                    <div className={`flex items-center gap-3 px-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">
                        {msg.role === 'user' ? 'Local Identity' : (MODELS.find(m => m.id === msg.modelId)?.name || 'Architect Core')}
                      </span>
                    </div>
                    <div className={`p-5 md:p-7 rounded-[2.5rem] text-[15px] leading-relaxed shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-[#0f0f17] border border-white/5 text-gray-200 rounded-tl-none ring-1 ring-white/5 backdrop-blur-3xl'
                    }`}>
                      {msg.content === '' && msg.isStreaming ? (
                        <div className="flex items-center gap-3 py-2">
                          <div className="dot-flashing"></div>
                          <span className="text-[10px] font-black text-indigo-400/60 animate-pulse uppercase tracking-[0.2em]">Synthesizing Enterprise Modules...</span>
                        </div>
                      ) : (
                        <MessageContent content={msg.content} sources={msg.sources} />
                      )}
                      
                      {msg.isStreaming && msg.content !== '' && (
                        <span className="inline-block w-2 h-5 ml-1 bg-indigo-500 animate-pulse align-middle rounded-sm"></span>
                      )}
                      
                      {msg.imageUrl && (
                        <div className="mt-8 rounded-3xl overflow-hidden border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.7)]">
                          <img src={msg.imageUrl} alt="Generated Neural Concept" className="w-full h-auto object-cover max-h-[700px]" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {quotaExceeded && (
          <div className="mx-auto max-w-3xl w-full px-6 mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-[#1a120b] border border-amber-500/30 rounded-[2.5rem] p-8 backdrop-blur-3xl flex flex-col sm:flex-row items-center gap-8 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
              <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shrink-0 shadow-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-white font-black text-sm uppercase tracking-[0.3em] mb-2">Architect Link Severed</h4>
                <p className="text-xs text-amber-200/50 leading-relaxed mb-6 font-medium">
                  High-capacity neural development requires a dedicated Neural Signature. Please connect your API key to continue generating 1000+ line codebases.
                </p>
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  <button 
                    onClick={handleOpenSelectKey}
                    className="px-8 py-3 bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                  >
                    Connect Neural Key
                  </button>
                  <button 
                    onClick={() => setQuotaExceeded(false)}
                    className="px-8 py-3 bg-white/5 text-gray-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:text-white transition-all border border-white/5"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 md:p-10 pt-0">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative group"
          >
            {showModelPicker && (
              <div className="absolute bottom-full mb-8 left-0 right-0 bg-[#0f0f17]/95 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-4 shadow-[0_50px_100px_rgba(0,0,0,0.7)] z-40 animate-in slide-in-from-bottom-6 duration-300 overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {MODELS.map(model => (
                    <button
                      key={model.id}
                      type="button"
                      disabled={model.isPremium}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelPicker(false);
                      }}
                      className={`text-left p-5 rounded-3xl transition-all relative overflow-hidden group ${
                        selectedModel === model.id 
                          ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' 
                          : 'hover:bg-white/5 text-gray-500'
                      } ${model.isPremium ? 'opacity-20 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-[10px] uppercase tracking-widest">{model.name}</span>
                      </div>
                      <div className="text-[11px] font-medium opacity-60 leading-snug line-clamp-2">{model.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={`bg-[#0f0f17]/80 border ${forceArchitectMode ? 'border-indigo-500/50 ring-2 ring-indigo-500/10' : 'border-white/5'} rounded-[2.5rem] overflow-hidden focus-within:border-indigo-500/40 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-[0_50px_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl relative`}>
              <div className="flex items-center px-8 py-4 border-b border-white/5 bg-white/[0.02]">
                <button 
                  type="button"
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#16161e] hover:bg-[#1a1a24] transition-all text-[10px] font-black text-gray-400 border border-white/5 tracking-widest uppercase"
                >
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${hasCustomKey ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}></div>
                  {MODELS.find(m => m.id === selectedModel)?.name.split(' ').pop()} Mode
                  <svg className={`w-4 h-4 transition-transform duration-500 ${showModelPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="ml-auto flex items-center gap-6 lg:hidden">
                   <button 
                     type="button"
                     onClick={() => setForceArchitectMode(!forceArchitectMode)}
                     className={`p-2 rounded-xl border transition-all ${forceArchitectMode ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-600'}`}
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                   </button>
                </div>
              </div>
              <div className="flex items-end p-4 gap-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={forceArchitectMode ? "Provide exhaustive project brief..." : "Initiate neural architecture link..."}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[16px] text-gray-100 placeholder:text-gray-700 resize-none max-h-60 py-4 px-6 custom-scrollbar font-medium"
                  rows={1}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`p-5 rounded-[1.75rem] transition-all duration-500 ${
                    !input.trim() || isLoading 
                      ? 'bg-gray-800/50 text-gray-700 scale-95' 
                      : 'bg-indigo-600 text-white shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:shadow-[0_20px_40px_rgba(79,70,229,0.5)] hover:scale-105 active:scale-95'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-6 h-6 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="mt-5 text-[9px] text-center text-gray-700 font-black uppercase tracking-[0.4em] px-4">
              Premium Architect Interface • Professional Tier Output • Ultra Low Latency
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;