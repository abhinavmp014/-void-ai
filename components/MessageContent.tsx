import React from 'react';
import CodeBlock from './CodeBlock';
import MathRenderer from './MathRenderer';
import { GroundingSource } from '../types';

interface MessageContentProps {
  content: string;
  sources?: GroundingSource[];
}

const MessageContent: React.FC<MessageContentProps> = ({ content, sources }) => {
  // Use a regex that captures backticks accurately
  const parts = content.split(/(```[\s\S]*?```)/g);

  const validateGraphData = (code: string) => {
    try {
      const trimmedCode = code.trim();
      // Ensure it's valid JSON before anything else
      const parsed = JSON.parse(trimmedCode);
      
      // Strict validation for graphing data shape
      if (Array.isArray(parsed) && parsed.length > 0) {
        const item = parsed[0];
        if (typeof item === 'object' && item !== null) {
          const hasValue = 'value' in item;
          const hasName = 'name' in item || 'label' in item;
          
          if (hasValue && hasName) {
            return parsed.map((i: any) => ({
              name: String(i.name || i.label || ''),
              value: Number(i.value || 0)
            }));
          }
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  return (
    <div className="space-y-8 max-w-full">
      <div className="space-y-4 max-w-full">
        {parts.map((part, index) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
            if (match) {
              const language = (match[1] || 'code').toLowerCase();
              const code = match[2];
              
              // CRITICAL: Only trigger visualization if the language is 'void-viz'
              // This stops random JSON from becoming a graph.
              const isExplicitViz = language === 'void-viz';
              const graphData = isExplicitViz ? validateGraphData(code) : null;
              
              if (isExplicitViz && graphData) {
                return <MathRenderer key={index} data={graphData} title="System Analysis" />;
              }

              // Standard code block for everything else
              return <CodeBlock key={index} code={code} language={language} />;
            }
          }
          
          // Render plain text parts
          if (!part.trim()) return null;
          
          return (
            <div key={index} className="whitespace-pre-wrap break-words leading-[1.8] text-gray-200/90 font-medium">
              {part}
            </div>
          );
        })}
      </div>

      {sources && sources.length > 0 && (
        <div className="mt-12 pt-8 border-t border-white/[0.04] bg-white/[0.01] -mx-4 px-4 rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
            <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em]">Verified Knowledge Nodes</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {sources.map((source, idx) => (
              <a 
                key={idx}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-5 py-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] rounded-2xl transition-all group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center text-gray-500 group-hover:text-indigo-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 115.656 5.656l-1.102 1.101" /></svg>
                </div>
                <span className="text-[12px] font-bold text-gray-400 group-hover:text-white truncate max-w-[250px] transition-colors">
                  {source.title}
                </span>
                <svg className="w-4 h-4 text-gray-700 group-hover:text-indigo-500 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageContent;