import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const extension = language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'html' ? 'html' : language === 'css' ? 'css' : 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architect_output.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lineCount = code.trim().split('\n').length;

  return (
    <div className={`my-6 rounded-2xl overflow-hidden border border-gray-800 bg-[#050507] shadow-[0_20px_50px_rgba(0,0,0,0.5)] group/code flex flex-col max-w-full transition-all duration-500 ${isMaximized ? 'fixed inset-4 z-[100] m-0 bg-[#050507]' : 'relative'}`}>
      <div className="flex items-center justify-between px-5 py-3 bg-[#0f0f17] border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40"></div>
          </div>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">
            {language || 'source code'} — {lineCount} lines
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 px-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-gray-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
          >
            {isMaximized ? 'Exit Full' : 'Fullscreen'}
          </button>
          <button
            onClick={handleDownload}
            className="hidden sm:block p-1.5 px-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-gray-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
            title="Download as File"
          >
            Download
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${
              copied 
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white'
            }`}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className={`flex-1 overflow-x-auto custom-scrollbar bg-black/20 ${isMaximized ? '' : 'max-h-[600px]'}`}>
        <div className="flex min-w-full">
          <div className="hidden sm:block py-4 px-3 text-right text-gray-700 font-mono text-xs select-none border-r border-gray-800 bg-[#050507]">
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i} className="leading-relaxed h-[21px]">{i + 1}</div>
            ))}
          </div>
          <pre className="p-4 text-sm font-mono leading-relaxed text-indigo-100/90 whitespace-pre flex-1 scroll-smooth">
            <code>{code.trim()}</code>
          </pre>
        </div>
      </div>
      {isMaximized && (
        <div className="absolute top-2 right-2 md:hidden">
           <button onClick={() => setIsMaximized(false)} className="p-2 bg-red-500/20 text-red-400 rounded-full border border-red-500/20">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
      )}
    </div>
  );
};

export default CodeBlock;