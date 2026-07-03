'use client';

import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';

type Period = 'Monthly' | 'Quarterly' | 'Annually';

const MOCK_PERFORMANCE_DATA: Record<Period, { name: string; value: number }[]> = {
  Monthly: [
    { name: 'Jun \'25', value: 31 },
    { name: 'Jul \'25', value: 33 },
    { name: 'Aug \'25', value: 31.5 },
    { name: 'Sep \'25', value: 33.8 },
    { name: 'Oct \'25', value: 30.5 },
    { name: 'Nov \'25', value: 32 },
    { name: 'Dec \'25', value: 30.8 },
    { name: 'Jan \'26', value: 32.2 },
    { name: 'Feb \'26', value: 31.8 },
    { name: 'Mar \'26', value: 34.2 },
    { name: 'Apr \'26', value: 37.8 },
  ],
  Quarterly: [
    { name: 'Q2 2025', value: 31.2 },
    { name: 'Q3 2025', value: 32.8 },
    { name: 'Q4 2025', value: 30.8 },
    { name: 'Q1 2026', value: 32.5 },
    { name: 'Q2 2026', value: 37.8 },
  ],
  Annually: [
    { name: '2023', value: 24.5 },
    { name: '2024', value: 29.8 },
    { name: '2025', value: 31.8 },
    { name: '2026', value: 37.8 },
  ],
};

export default function PortfolioPerformance() {
  const [period, setPeriod] = useState<Period>('Monthly');
  const data = MOCK_PERFORMANCE_DATA[period];

  const periods: Period[] = ['Monthly', 'Quarterly', 'Annually'];

  return (
    <div className="glass rounded-2xl p-6 flex flex-col justify-between h-96">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Portfolio Performance</h3>
          <p className="text-xs text-muted mt-0.5">Here is your performance stats of each period</p>
        </div>

        {/* Period Toggles */}
        <div className="flex rounded-xl bg-sidebar/50 border border-card-border p-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-accent-purple text-white shadow-neon-purple'
                  : 'text-muted hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="mt-6 flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="performanceGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              dx={10}
            />
            <Tooltip
              contentStyle={{
                background: '#0C101A',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#9CA3AF', fontWeight: 'bold' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8B5CF6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#performanceGlow)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
