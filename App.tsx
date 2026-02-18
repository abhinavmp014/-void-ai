import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatSession, UserProfile } from './types';
import { getAIResponseStream } from './services/geminiService';
import { loadChats, saveChats, loadProfile, saveProfile } from './services/storageService';
import Sidebar from './components/Sidebar';
import MessageContent from './components/MessageContent';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [profile, setProfile] = useState<UserProfile>({ name: 'User', credits: 5000, tier: 'pro' });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const loadedChats = loadChats();
    const loadedProfile = loadProfile({ name: 'User', credits: 5000, tier: 'pro' });
    setSessions(loadedChats);
    setProfile(loadedProfile);
    if (loadedChats.length > 0) {
      setCurrentSessionId(loadedChats[0].id);
    } else {
      handleNewChat();
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) saveChats(sessions);
  }, [sessions]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, currentSessionId, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleNewChat = () => {
    const id = Date.now().toString();
    const newSession: ChatSession = {
      id,
      title: 'New Chat',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(id);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
      type: 'text'
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: [...s.messages, userMessage], title: s.messages.length === 0 ? userText.slice(0, 40) : s.title } 
        : s
    ));

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      type: 'text',
      isStreaming: true
    };

    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMessage] } : s));

    try {
      const history = sessions.find(s => s.id === currentSessionId)?.messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      })) || [];

      let fullText = '';
      const stream = getAIResponseStream(userText, 'void-4', history);
      for await (const chunk of stream) {
        fullText += chunk;
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { ...s, messages: s.messages.map(m => m.id === aiMessageId ? { ...m, content: fullText } : m) } 
            : s
        ));
      }
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: s.messages.map(m => m.id === aiMessageId ? { ...m, isStreaming: false } : m) } 
          : s
      ));
    } catch (error: any) {
      const errMsg = error.message || "Oops! Something went wrong. Let's try again?";
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: s.messages.map(m => m.id === aiMessageId ? { ...m, content: errMsg, isStreaming: false } : m) } 
          : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const QuickAction = ({ icon, title, prompt, description }: { icon: string, title: string, prompt: string, description: string }) => (
    <button 
      onClick={() => { setInput(prompt); }}
      className="flex flex-col items-start p-5 bg-white/[0.03] border border-white/[0.06] rounded-3xl hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all group text-left shadow-lg"
    >
      <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
        <span className="text-lg">{icon}</span>
      </div>
      <h3 className="text-[11px] font-black uppercase tracking-widest text-white mb-1">{title}</h3>
      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider opacity-60">{description}</p>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#020205] text-gray-200 overflow-hidden font-sans w-full fixed inset-0">
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={handleNewChat}
        profile={profile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col relative h-full min-w-0 overflow-hidden w-full bg-[radial-gradient(circle_at_50%_0%,_rgba(99,102,241,0.06)_0%,_transparent_70%)]">
        <header className="h-14 border-b border-white/[0.03] flex items-center justify-between px-6 bg-[#020205]/40 backdrop-blur-3xl z-30 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-1 text-gray-400 hover:text-white md:hidden transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/10 shrink-0 italic text-sm">V</div>
              <div className="truncate">
                <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-white truncate leading-tight">Void AI</h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/[0.03] rounded-full border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Ready to Help</span>
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 md:p-8 space-y-8 max-w-[1000px] mx-auto w-full pt-4 z-10 scroll-smooth min-w-0">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center max-w-2xl mx-auto w-full pb-10">
              <div className="mb-8 text-center">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">
                  Hello, {profile.name}! <span className="text-indigo-500 text-shadow-glow">How can I help?</span>
                </h2>
                <div className="grid grid-cols-2 gap-3 mt-8">
                  <QuickAction icon="🌱" title="Learn Something" prompt="Can you explain how a sunset works in a simple way?" description="Simple explanations" />
                  <QuickAction icon="✨" title="Get Creative" prompt="Help me write a friendly greeting for my new neighbor." description="Creative writing" />
                  <QuickAction icon="💻" title="Web Magic" prompt="Show me a simple and beautiful website layout for a small plant shop." description="Beautiful designs" />
                  <QuickAction icon="🌈" title="Just Chat" prompt="Tell me something interesting and positive today!" description="Friendly talk" />
                </div>
              </div>
            </div>
          ) : (
            currentSession.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex gap-3 md:gap-5 max-w-full sm:max-w-[85%] min-w-0 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-[9px] border shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-indigo-600 border-indigo-400/30 text-white' : 'bg-[#0f0f17] border-white/10 text-indigo-500'}`}>
                    {msg.role === 'user' ? 'U' : 'V'}
                  </div>
                  <div className={`p-4 md:p-6 rounded-3xl text-[14px] md:text-[15px] leading-relaxed min-w-0 overflow-hidden ${msg.role === 'user' ? 'bg-[#1a1a25] text-white' : 'bg-transparent text-gray-200'}`}>
                    {msg.content === '' && msg.isStreaming ? (
                      <div className="flex gap-1.5 py-2 items-center">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                      </div>
                    ) : (
                      <MessageContent content={msg.content} sources={msg.sources} />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 md:p-6 pt-2 shrink-0 z-20 w-full">
          <form onSubmit={handleSendMessage} className="max-w-[760px] mx-auto w-full relative">
            <div className="bg-[#1a1a25] border border-white/[0.08] rounded-[2rem] flex items-end p-2 pl-5 transition-all focus-within:ring-1 focus-within:ring-indigo-500/50 w-full shadow-2xl group">
              <textarea 
                ref={textareaRef}
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} 
                placeholder="Say hello to Void AI..." 
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-200 placeholder:text-gray-500 resize-none py-3 px-0 text-sm md:text-base leading-relaxed min-w-0 z-10 font-medium h-auto max-h-[200px]" 
                rows={1} 
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading} 
                className={`mb-1.5 mr-1.5 p-2 rounded-full transition-all shrink-0 z-10 ${!input.trim() || isLoading ? 'bg-white/5 text-gray-600' : 'bg-white text-black hover:bg-gray-200 active:scale-95 shadow-lg'}`}
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
              </button>
            </div>
            <p className="text-center mt-3 text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] opacity-40">Your friendly AI companion</p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;