'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_DIVIDEND_DATA = [
  { name: 'Jan', value: 180 },
  { name: 'Feb', value: 360 },
  { name: 'Mar', value: 200 },
  { name: 'Apr', value: 290 },
  { name: 'May', value: 190 },
  { name: 'Jun', value: 210 },
];

export default function DividendChart() {
  return (
    <div className="glass rounded-2xl p-6 flex flex-col justify-between h-96">
      <div>
        <h3 className="text-base font-bold text-white tracking-wide">Dividend</h3>
        <p className="text-xs text-muted mt-0.5">Monthly dividend payouts</p>
      </div>

      <div className="mt-6 flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MOCK_DIVIDEND_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            />
            <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
