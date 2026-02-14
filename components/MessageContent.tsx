import React from 'react';
import CodeBlock from './CodeBlock';
import { GroundingSource } from '../types';

interface MessageContentProps {
  content: string;
  sources?: GroundingSource[];
}

const MessageContent: React.FC<MessageContentProps> = ({ content, sources }) => {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {parts.map((part, index) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
            if (match) {
              const language = match[1] || 'code';
              const code = match[2];
              return <CodeBlock key={index} code={code} language={language} />;
            }
          }
          
          return (
            <div key={index} className="whitespace-pre-wrap">
              {part}
            </div>
          );
        })}
      </div>

      {sources && sources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800/50">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 005.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Neural Sources Found</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, idx) => (
              <a 
                key={idx}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-indigo-600/10 border border-gray-700/50 hover:border-indigo-500/30 rounded-xl transition-all group"
              >
                <span className="text-[11px] font-bold text-gray-300 group-hover:text-indigo-300 truncate max-w-[150px]">
                  {source.title}
                </span>
                <svg className="w-3 h-3 text-gray-600 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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