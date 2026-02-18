import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MathRendererProps {
  data: any[];
  title?: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ data, title }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="my-6 p-4 md:p-6 bg-[#08080c] border border-white/[0.04] rounded-3xl shadow-2xl w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Void Study X • Visualization</h3>
        {title && <span className="text-[10px] font-medium text-gray-500 italic">{title}</span>}
      </div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#444" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#444" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f0f17', border: '1px solid #1e1e2d', borderRadius: '12px', fontSize: '10px' }}
              itemStyle={{ color: '#818cf8' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#6366f1" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} 
              activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2, fill: '#000' }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MathRenderer;