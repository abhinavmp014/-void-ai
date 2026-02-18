import React, { useState, useMemo } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [isVisionMode, setIsVisionMode] = useState(false);

  const isWebCode = useMemo(() => {
    const lang = language?.toLowerCase() || '';
    const codeLower = code.toLowerCase();
    return (
      lang === 'html' || 
      lang === 'xml' || 
      codeLower.includes('<!doctype html>') || 
      codeLower.includes('<html') ||
      (lang === 'tsx' || lang === 'jsx' || lang === 'javascript' || lang === 'typescript' && codeLower.includes('import react'))
    );
  }, [code, language]);

  const previewContent = useMemo(() => {
    if (!isWebCode) return '';
    if (code.toLowerCase().includes('<html')) return code;
    
    return `
      <!DOCTYPE html>
      <html class="dark">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { background: #020205; color: #e2e8f0; font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #6366f133; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div id="root">${code}</div>
        </body>
      </html>
    `;
  }, [code, isWebCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <>
      <div className="my-10 rounded-[2.5rem] overflow-hidden border border-white/[0.06] bg-[#020204] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] flex flex-col w-full max-w-full group">
        <div className="flex items-center justify-between px-6 py-4 bg-[#08080c] border-b border-white/[0.04] shrink-0">
          <div className="flex items-center gap-6 min-w-0">
            <div className="flex gap-2 shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-indigo-500/40 border border-indigo-500/50"></div>
            </div>
            
            <div className="flex bg-white/[0.03] rounded-xl p-1.5 ring-1 ring-white/[0.05]">
              <button 
                onClick={() => setActiveTab('code')}
                className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${activeTab === 'code' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Architecture
              </button>
              {isWebCode && (
                <button 
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Live Preview
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            {isWebCode && activeTab === 'preview' && (
              <button onClick={() => setIsVisionMode(true)} className="text-[11px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-[0.2em] flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Launch Vision
              </button>
            )}
            <button onClick={handleCopy} className={`text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors ${copied ? 'text-emerald-400' : 'text-gray-500 hover:text-indigo-400'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
        
        <div className="relative flex-1 bg-[#020204] overflow-hidden min-h-[450px]">
          {activeTab === 'code' ? (
            <div className="h-full overflow-auto custom-scrollbar">
              <pre className="p-10 text-[14px] font-mono leading-relaxed text-indigo-100/80 whitespace-pre">
                <code>{code.trim()}</code>
              </pre>
            </div>
          ) : (
            <iframe 
              srcDoc={previewContent}
              title="Preview"
              className="w-full h-full border-none bg-[#020205]"
              sandbox="allow-scripts"
            />
          )}
        </div>
      </div>

      {isVisionMode && (
        <div className="fixed inset-0 z-[100] bg-[#020205] flex flex-col animate-in fade-in duration-500">
          <div className="h-16 border-b border-white/[0.05] flex items-center justify-between px-8 bg-[#050508]">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white italic">V</div>
              <span className="text-xs font-black uppercase tracking-[0.4em] text-gray-400">Vision Mode • Active Architecture</span>
            </div>
            <button 
              onClick={() => setIsVisionMode(false)}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white transition-all"
            >
              Exit Vision
            </button>
          </div>
          <iframe 
            srcDoc={previewContent}
            title="Vision Preview"
            className="flex-1 w-full border-none bg-white"
            sandbox="allow-scripts"
          />
        </div>
      )}
    </>
  );
};

export default CodeBlock;