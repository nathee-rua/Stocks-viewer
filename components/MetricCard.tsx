'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { StockInfo } from '../lib/stockStore';

interface MetricCardProps {
  stock: StockInfo;
  isUpdating: boolean;
  updateDirection: 'up' | 'down' | null;
}

export default function MetricCard({ stock, isUpdating, updateDirection }: MetricCardProps) {
  const isPositive = stock.changePercent >= 0;
  
  // Create simple data array from sparkline array for Recharts
  const chartData = stock.sparkline.map((val, idx) => ({ id: idx, value: val }));

  return (
    <Link href={`/stock/${stock.symbol}`}>
      <div 
        className={`glass-interactive flex flex-col justify-between rounded-2xl p-6 h-40 ${
          isUpdating 
            ? updateDirection === 'up'
              ? 'border-up/30 shadow-neon-green bg-up/5'
              : 'border-down/30 shadow-neon-red bg-down/5'
            : ''
        }`}
      >
        {/* Top Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl">
              {stock.logo}
            </span>
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide">{stock.symbol}</h4>
              <p className="text-[10px] text-muted line-clamp-1">{stock.name}</p>
            </div>
          </div>
          <span
            className={`flex items-center rounded-lg px-2 py-1 text-xs font-semibold ${
              isPositive ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
            }`}
          >
            {isPositive ? '+' : ''}
            {stock.changePercent}%
            {isPositive ? (
              <ArrowUpRight size={14} className="ml-0.5" />
            ) : (
              <ArrowDownRight size={14} className="ml-0.5" />
            )}
          </span>
        </div>

        {/* Bottom Section */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold tracking-tight text-white">
              ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Sparkline mini-chart */}
          <div className="h-12 w-28 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id={`color-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? '#10B981' : '#EF4444'}
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill={`url(#color-${stock.symbol})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Link>
  );
}
