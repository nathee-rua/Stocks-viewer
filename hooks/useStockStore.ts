'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StockInfo, Transaction, INITIAL_STOCKS } from '../lib/stockStore';
import { getQuote } from '../lib/api/apiClient';

// List of tracked symbols
const TRACKED_SYMBOLS = Object.keys(INITIAL_STOCKS);

export function useStockStore() {
  const [stocks, setStocks] = useState<Record<string, StockInfo>>({});
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastUpdatedSymbol, setLastUpdatedSymbol] = useState<{ symbol: string; direction: 'up' | 'down' } | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Initialize stocks with base prices (immediate)
  useEffect(() => {
    const initialized: Record<string, StockInfo> = {};
    Object.keys(INITIAL_STOCKS).forEach((symbol) => {
      const stock = INITIAL_STOCKS[symbol];
      const basePrice = stock.sparkline[stock.sparkline.length - 1];
      initialized[symbol] = {
        ...stock,
        price: basePrice,
        prevPrice: basePrice,
        change: 0,
        changePercent: 0,
      };
    });
    setStocks(initialized);
    setIsClient(true);
  }, []);

  // Fetch real quotes from Finnhub API via our API route
  const { data: quotesData } = useQuery({
    queryKey: ['quotes', TRACKED_SYMBOLS],
    queryFn: async () => {
      const results: Record<string, any> = {};
      // Fetch quotes sequentially with small delay to avoid rate limiting
      for (const symbol of TRACKED_SYMBOLS) {
        try {
          const quote = await getQuote(symbol);
          if (quote.price > 0) {
            results[symbol] = quote;
          }
        } catch {
          // Skip failed quotes — fallback to mock
        }
        // Small delay to respect Finnhub rate limit (60/min)
        await new Promise(r => setTimeout(r, 200));
      }
      return results;
    },
    refetchInterval: 60000, // Refetch every 60 seconds
    enabled: isClient,
    staleTime: 30000,
  });

  // Update stocks when real quote data arrives
  useEffect(() => {
    if (!quotesData || Object.keys(quotesData).length === 0) return;
    
    setStocks((prev) => {
      const updated = { ...prev };
      Object.entries(quotesData).forEach(([symbol, quote]: [string, any]) => {
        if (updated[symbol] && quote.price > 0) {
          const prevPrice = updated[symbol].price;
          const direction = quote.price > prevPrice ? 'up' : 'down';
          
          // Only flash if price actually changed
          if (quote.price !== prevPrice) {
            setLastUpdatedSymbol({ symbol, direction });
            setTimeout(() => setLastUpdatedSymbol(null), 1000);
          }

          updated[symbol] = {
            ...updated[symbol],
            price: quote.price,
            prevPrice: prevPrice,
            change: quote.change || 0,
            changePercent: quote.changePercent || 0,
          };
        }
      });
      return updated;
    });
  }, [quotesData]);

  // Load Watchlist and Transactions from LocalStorage
  useEffect(() => {
    if (!isClient) return;

    const savedWatchlist = localStorage.getItem('stocks_watchlist');
    if (savedWatchlist) {
      try {
        setWatchlist(JSON.parse(savedWatchlist));
      } catch {
        setWatchlist(['AAPL', 'TSLA', 'AMZN', 'SPOT']);
      }
    } else {
      const defaultWatch = ['AAPL', 'TSLA', 'AMZN', 'SPOT'];
      setWatchlist(defaultWatch);
      localStorage.setItem('stocks_watchlist', JSON.stringify(defaultWatch));
    }

    const savedTx = localStorage.getItem('stocks_transactions');
    if (savedTx) {
      try {
        setTransactions(JSON.parse(savedTx));
      } catch {
        setTransactions([]);
      }
    } else {
      const defaultTx: Transaction[] = [
        { id: 'tx-1', symbol: 'AAPL', type: 'buy', price: 175.50, quantity: 15, date: '2026-06-15' },
        { id: 'tx-2', symbol: 'TSLA', type: 'buy', price: 182.00, quantity: 10, date: '2026-06-20' },
      ];
      setTransactions(defaultTx);
      localStorage.setItem('stocks_transactions', JSON.stringify(defaultTx));
    }
  }, [isClient]);

  // Watchlist Actions
  const addToWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      if (prev.includes(symbol)) return prev;
      const next = [...prev, symbol];
      localStorage.setItem('stocks_watchlist', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const next = prev.filter((s) => s !== symbol);
      localStorage.setItem('stocks_watchlist', JSON.stringify(next));
      return next;
    });
  }, []);

  // Transaction Actions
  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => {
      const next = [newTx, ...prev];
      localStorage.setItem('stocks_transactions', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      const next = prev.filter((t) => t.id !== id);
      localStorage.setItem('stocks_transactions', JSON.stringify(next));
      return next;
    });
  }, []);

  // Get current portfolio metrics
  const getPortfolioMetrics = useCallback(() => {
    let totalInvested = 0;
    let currentVal = 0;

    transactions.forEach((tx) => {
      const currentPrice = stocks[tx.symbol]?.price || tx.price;
      if (tx.type === 'buy') {
        totalInvested += tx.price * tx.quantity;
        currentVal += currentPrice * tx.quantity;
      } else {
        totalInvested -= tx.price * tx.quantity;
        currentVal -= currentPrice * tx.quantity;
      }
    });

    const gainLoss = currentVal - totalInvested;
    const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

    return {
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      currentValue: parseFloat(currentVal.toFixed(2)),
      gainLoss: parseFloat(gainLoss.toFixed(2)),
      gainLossPercent: parseFloat(gainLossPercent.toFixed(2)),
    };
  }, [transactions, stocks]);

  return {
    stocks: Object.values(stocks),
    stocksMap: stocks,
    watchlist,
    transactions,
    lastUpdatedSymbol,
    addToWatchlist,
    removeFromWatchlist,
    addTransaction,
    removeTransaction,
    getPortfolioMetrics,
    isLoaded: isClient,
  };
}
