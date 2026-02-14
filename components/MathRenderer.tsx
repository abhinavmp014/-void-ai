
import React, { useEffect, useRef } from 'react';
import { MathData } from '../types.ts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import katex from 'katex';

interface MathRendererProps {
  data: MathData;
}

const MathRenderer: React.FC<MathRendererProps> = ({ data }) => {
  const equationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (equationRef.current && data.equations?.length > 0) {
      const fullLatex = data.equations.map(eq => `\\displaystyle ${eq}`).join('\\\\[1.5em]');
      katex.render(fullLatex, equationRef.current, {
        throwOnError: false,
        displayMode: true
      });
    }
  }, [data.equations]);

  return (
    <div className="flex flex-col gap-8 mt-6 p-6 md:p-8 rounded-[32px] bg-[#1a1a24]/40 border border-white/5 shadow-2xl backdrop-blur-sm overflow-hidden animate-in fade-in duration-500">
      {data.equations?.length > 0 && (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Primary Formulation</h4>
          </div>
          <div ref={equationRef} className="text-white min-h-[50px] text-lg md:text-xl py-2 px-4 rounded-2xl bg-white/5 ring-1 ring-white/5 inline-block min-w-full"></div>
        </div>
      )}

      {data.steps?.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
            <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Computational Sequence</h4>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {data.steps.map((step, idx) => (
              <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all group">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 text-xs font-black ring-1 ring-indigo-500/20">
                    {idx + 1}
                  </span>
                  <div className="flex-1 space-y-3">
                    <span className="font-black text-sm text-gray-100 uppercase tracking-tight leading-none inline-block mt-1">{step.title}</span>
                    <p className="text-sm text-gray-400 leading-relaxed">{step.explanation}</p>
                    {step.latex && (
                      <div 
                        className="p-3 bg-black/30 rounded-xl text-indigo-300 overflow-x-auto text-base md:text-lg border border-white/5 shadow-inner"
                        dangerouslySetInnerHTML={{ 
                          __html: katex.renderToString(step.latex, { throwOnError: false, displayMode: true }) 
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.graphData && data.graphData.length > 0 && (
        <div className="w-full">
           <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-4 bg-pink-500 rounded-full"></div>
            <h4 className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em]">Visual Data Interpretation</h4>
          </div>
          <div className="h-72 w-full bg-black/20 rounded-3xl p-4 border border-white/5 relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} opacity={0.4} />
                <XAxis 
                  dataKey="x" 
                  stroke="#4a5568" 
                  type="number" 
                  tick={{ fontSize: 10, fontWeight: 'bold' }}
                  axisLine={{ stroke: '#2d3748' }}
                  allowDuplicatedCategory={false} 
                />
                <YAxis 
                  stroke="#4a5568" 
                  tick={{ fontSize: 10, fontWeight: 'bold' }}
                  axisLine={{ stroke: '#2d3748' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#16161e', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '16px', 
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Legend iconType="circle" />
                {data.graphData.map((graph, idx) => (
                  <Line
                    key={idx}
                    type="monotone"
                    data={graph.points}
                    dataKey="y"
                    name={graph.name}
                    stroke={idx === 0 ? "#6366f1" : "#ec4899"}
                    strokeWidth={3}
                    dot={{ r: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={2500}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathRenderer;
