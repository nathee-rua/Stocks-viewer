'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Moon, ArrowUpRight, LogOut, Loader2 } from 'lucide-react';
import { useStock } from '../context/StockContext';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { searchStocks } from '@/lib/api/apiClient';

export default function Header() {
  const { stocks, user, userProfile, logout } = useStock();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search results via TanStack Query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => searchStocks(searchQuery),
    enabled: searchQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000, // cache query results for 5 min
  });

  const handleSelectSymbol = (symbol: string) => {
    setSearchQuery('');
    setShowResults(false);
    router.push(`/stock/${symbol}`);
  };

  // Find a quick stock that went up to highlight in the ticker
  const activeTickerStock = stocks.find((s) => s.changePercent > 0) || stocks[0];

  const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-card-border bg-background/80 px-8 backdrop-blur-md">
      {/* Search Input */}
      <div ref={searchRef} className="relative w-96">
        <div className="flex items-center gap-3 rounded-xl border border-card-border bg-sidebar/50 px-4 py-2 text-muted focus-within:border-accent-purple/50 focus-within:text-white transition-all">
          <Search size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            placeholder="Search US stock symbols (e.g. AAPL, TSLA)..."
            className="w-full bg-transparent text-sm text-white placeholder-muted/50 outline-none"
          />
          {isSearching && <Loader2 size={14} className="animate-spin text-accent-purple" />}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchQuery.trim().length > 0 && (
          <div className="absolute top-12 left-0 w-full rounded-2xl border border-card-border bg-sidebar/95 backdrop-blur-md p-2 shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-card-border/50">
            {searchResults && searchResults.length > 0 ? (
              searchResults.map((res) => (
                <button
                  key={res.symbol}
                  onClick={() => handleSelectSymbol(res.symbol)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-left"
                >
                  <div>
                    <span className="font-bold text-white text-xs block">{res.symbol}</span>
                    <span className="text-[10px] text-muted line-clamp-1">{res.description}</span>
                  </div>
                  <ArrowUpRight size={14} className="text-muted" />
                </button>
              ))
            ) : (
              !isSearching && (
                <div className="p-4 text-center text-xs text-muted">
                  No matching stock symbols found
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Right-side Controls */}
      <div className="flex items-center gap-6">
        {/* Ticker / Quick Info */}
        {activeTickerStock && (
          <div className="hidden items-center gap-2 rounded-full border border-card-border bg-sidebar/30 px-3 py-1 text-xs md:flex">
            <span className="text-muted">Market Alert:</span>
            <span className="font-semibold text-white">{activeTickerStock.symbol}</span>
            <span className="flex items-center text-up">
              +{activeTickerStock.changePercent.toFixed(2)}%
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

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-purple/20 text-accent-purple font-bold border border-accent-purple/30">
              {initials}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-xs font-semibold text-white line-clamp-1 max-w-[120px]">
                {displayName}
              </p>
              <p className="text-[10px] text-muted">Personal Plan</p>
            </div>
            
            {user && (
              <button
                onClick={logout}
                title="Log Out"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-card-border hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors ml-1"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
