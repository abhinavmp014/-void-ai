
import React from 'react';
import { ChatSession, UserProfile } from '../types.ts';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  hasCustomKey?: boolean;
  onSwitchKey?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat,
  profile,
  isOpen,
  onClose,
  hasCustomKey = false,
  onSwitchKey
}) => {
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-72 bg-[#0b0b0f] border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={sidebarClasses}>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between md:hidden">
            <span className="font-bold text-indigo-400">Menu</span>
            <button onClick={onClose} className="p-2 text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <button 
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-semibold shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-4 py-3 mt-2">
            History
          </div>
          {sessions.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-gray-600 italic">No recent chats</div>
          ) : (
            sessions.map(session => (
              <button
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-xl group transition-all flex items-center gap-3 mb-1 ${
                  currentSessionId === session.id 
                    ? 'bg-indigo-600/10 text-white ring-1 ring-indigo-500/30' 
                    : 'text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${currentSessionId === session.id ? 'bg-indigo-600/20 text-indigo-400' : 'bg-gray-800 text-gray-500'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <span className="truncate text-sm font-medium">{session.title || 'Untitled Chat'}</span>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-800/50 bg-gray-900/10 space-y-4">
          <button 
            onClick={onSwitchKey}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-900/60 border border-gray-800/50 hover:border-indigo-500/30 transition-all text-left group"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Neural Link</span>
              <span className={`text-[10px] font-bold ${hasCustomKey ? 'text-indigo-400' : 'text-green-500'}`}>
                {hasCustomKey ? 'CUSTOM SIGNATURE' : 'SHARED CORE'}
              </span>
            </div>
            <div className={`p-1.5 rounded-lg bg-gray-800 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </button>

          <div className="flex items-center gap-3 p-2 rounded-2xl bg-gray-900/40 border border-gray-800/50 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20 font-bold">
              {profile.name[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-gray-200 truncate">{profile.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (profile.credits / 20) * 100)}%` }}></div>
                </div>
                <span className="text-[10px] text-indigo-400 font-bold whitespace-nowrap">{profile.credits} Energy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
