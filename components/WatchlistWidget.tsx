'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, X, Eye } from 'lucide-react';
import { useStock } from '../context/StockContext';
import { INITIAL_STOCKS } from '../lib/stockStore';

export default function WatchlistWidget() {
  const { watchlist, stocksMap, addToWatchlist, removeFromWatchlist } = useStock();
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Filter available stocks that are not in the watchlist
  const availableToAdd = Object.keys(INITIAL_STOCKS).filter((symbol) => !watchlist.includes(symbol));

  return (
    <div className="glass rounded-2xl p-6 flex flex-col justify-between h-[420px] relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-card-border pb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">My Watchlist</h3>
          <p className="text-xs text-muted mt-0.5">Quick access to tracked markets</p>
        </div>

        {/* Add Button */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-purple/10 text-accent-purple hover:bg-accent-purple hover:text-white transition-colors"
          >
            {showAddMenu ? <X size={16} /> : <Plus size={16} />}
          </button>

          {/* Dropdown Menu */}
          {showAddMenu && (
            <div className="absolute right-0 mt-2 z-50 w-56 rounded-xl border border-card-border bg-sidebar p-2 shadow-xl backdrop-blur-xl">
              {availableToAdd.length === 0 ? (
                <p className="p-2 text-center text-xs text-muted">All stocks already added</p>
              ) : (
                <ul className="space-y-1">
                  {availableToAdd.map((symbol) => {
                    const info = INITIAL_STOCKS[symbol];
                    return (
                      <li key={symbol}>
                        <button
                          onClick={() => {
                            addToWatchlist(symbol);
                            setShowAddMenu(false);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-white hover:bg-white/5 transition-colors"
                        >
                          <span className="font-semibold">{symbol} ({info.name})</span>
                          <Plus size={12} className="text-accent-purple" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Watchlist Items */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted py-10">
            <Eye size={28} className="mb-2 opacity-55" />
            <p className="text-xs">Your watchlist is empty</p>
          </div>
        ) : (
          watchlist.map((symbol) => {
            const stock = stocksMap[symbol];
            if (!stock) return null;
            const isPositive = stock.changePercent >= 0;

            return (
              <div
                key={symbol}
                className="flex items-center justify-between rounded-xl border border-transparent bg-white/[0.02] p-3 hover:border-card-border hover:bg-white/[0.04] transition-all group"
              >
                {/* Info */}
                <Link href={`/stock/${symbol}`} className="flex items-center gap-3 flex-1">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-lg">
                    {stock.logo}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{stock.symbol}</h4>
                    <p className="text-[10px] text-muted line-clamp-1 max-w-[120px]">{stock.name}</p>
                  </div>
                </Link>

                {/* Price and Action */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">
                      ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <span
                      className={`flex items-center justify-end text-[10px] font-semibold ${
                        isPositive ? 'text-up' : 'text-down'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {stock.changePercent}%
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromWatchlist(symbol)}
                    className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded bg-down/10 text-down hover:bg-down hover:text-white transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
