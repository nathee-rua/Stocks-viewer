'use client';

import React from 'react';
import { Search, Bell, Sun, Moon, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useStock } from '../context/StockContext';

export default function Header() {
  const { stocks, lastUpdatedSymbol } = useStock();

  // Find a quick stock that went up to highlight in the ticker
  const activeTickerStock = stocks.find((s) => s.changePercent > 0) || stocks[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-card-border bg-background/80 px-8 backdrop-blur-md">
      {/* Search Input */}
      <div className="flex w-96 items-center gap-3 rounded-xl border border-card-border bg-sidebar/50 px-4 py-2 text-muted focus-within:border-accent-purple/50 focus-within:text-white transition-all">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search symbol, company name..."
          className="w-full bg-transparent text-sm text-white placeholder-muted/50 outline-none"
        />
        <kbd className="hidden rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-muted/80 md:block">
          ⌘K
        </kbd>
      </div>

      {/* Right-side Controls */}
      <div className="flex items-center gap-6">
        {/* Ticker / Quick Info */}
        {activeTickerStock && (
          <div className="hidden items-center gap-2 rounded-full border border-card-border bg-sidebar/30 px-3 py-1 text-xs md:flex">
            <span className="text-muted">Market Alert:</span>
            <span className="font-semibold text-white">{activeTickerStock.symbol}</span>
            <span className="flex items-center text-up">
              +{activeTickerStock.changePercent}%
              <ArrowUpRight size={12} className="ml-0.5" />
            </span>
          </div>
        )}

        {/* Notifications and Profile */}
        <div className="flex items-center gap-3">
          {/* Theme Indicator (Static/Pre-selected for Dark Mode) */}
          <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-card-border hover:bg-white/5 text-muted hover:text-white transition-colors">
            <Moon size={16} className="text-accent-purple" />
          </button>

          {/* Notifications */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-card-border hover:bg-white/5 text-muted hover:text-white transition-colors">
            <Bell size={16} />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-up animate-pulse" />
          </button>

          <div className="h-8 w-px bg-card-border" />

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-purple/20 text-accent-purple font-bold border border-accent-purple/30">
              NR
            </div>
            <div className="hidden text-left md:block">
              <p className="text-xs font-semibold text-white">nathee-rua</p>
              <p className="text-[10px] text-muted">Personal Plan</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
