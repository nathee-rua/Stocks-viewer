'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useStock } from '../context/StockContext';
import MetricCard from '../components/MetricCard';
import PortfolioPerformance from '../components/PortfolioPerformance';
import DividendChart from '../components/DividendChart';
import WatchlistWidget from '../components/WatchlistWidget';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Home() {
  const { stocks, stocksMap, lastUpdatedSymbol, isLoaded } = useStock();

  if (!isLoaded) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-purple border-t-transparent" />
      </div>
    );
  }

  // Get first 4 stocks for top row metric cards
  const topStocks = stocks.slice(0, 4);

  // Trending stocks (excluding top row, or just a curated list of active trending ones)
  const trendingStocks = stocks.slice(4, 7);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Stock Overview</h1>
        <p className="text-sm text-muted mt-1">Real-time financial dashboard and watchlist sync</p>
      </div>

      {/* Top Metric Cards Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {topStocks.map((stock) => (
          <MetricCard
            key={stock.symbol}
            stock={stock}
            isUpdating={lastUpdatedSymbol?.symbol === stock.symbol}
            updateDirection={lastUpdatedSymbol?.symbol === stock.symbol ? lastUpdatedSymbol.direction : null}
          />
        ))}
      </div>

      {/* Charts & Watchlist Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Performance Chart (Left - 2/3) */}
        <div className="lg:col-span-2">
          <PortfolioPerformance />
        </div>

        {/* Watchlist Widget (Right - 1/3) */}
        <div className="lg:col-span-1">
          <WatchlistWidget />
        </div>
      </div>

      {/* Bottom Section: Trending Stocks & Dividend */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Trending Stocks Widget */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 flex flex-col justify-between h-[360px]">
          <div className="flex items-center justify-between pb-4 border-b border-card-border">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Trending Stocks</h3>
              <p className="text-xs text-muted mt-0.5">Most active stocks today</p>
            </div>
          </div>
          
          <div className="mt-4 flex-1 divide-y divide-card-border overflow-y-auto">
            {trendingStocks.map((stock) => {
              const isPositive = stock.changePercent >= 0;
              return (
                <div key={stock.symbol} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lg">
                      {stock.logo}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{stock.symbol}</h4>
                      <p className="text-xs text-muted">{stock.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`flex items-center justify-end text-xs font-semibold ${
                        isPositive ? 'text-up' : 'text-down'
                      }`}>
                        {isPositive ? '+' : ''}{stock.changePercent}%
                      </span>
                    </div>
                    <Link
                      href={`/stock/${stock.symbol}`}
                      className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-semibold text-muted hover:border-accent-purple hover:text-white transition-colors"
                    >
                      View Chart
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dividend Chart (Right - 1/3) */}
        <div className="lg:col-span-1">
          <DividendChart />
        </div>
      </div>
    </div>
  );
}
