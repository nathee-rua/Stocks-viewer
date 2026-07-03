'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { StockInfo, Transaction, INITIAL_STOCKS } from '../lib/stockStore';

export function useStockStore() {
  const [stocks, setStocks] = useState<Record<string, StockInfo>>({});
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastUpdatedSymbol, setLastUpdatedSymbol] = useState<{ symbol: string; direction: 'up' | 'down' } | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Initialize stocks with base prices
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

  // Load Watchlist and Transactions from LocalStorage
  useEffect(() => {
    if (!isClient) return;

    const savedWatchlist = localStorage.getItem('stocks_watchlist');
    if (savedWatchlist) {
      try {
        setWatchlist(JSON.parse(savedWatchlist));
      } catch (e) {
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
      } catch (e) {
        setTransactions([]);
      }
    } else {
      // Add a couple of initial transactions so portfolio isn't empty
      const defaultTx: Transaction[] = [
        { id: 'tx-1', symbol: 'AAPL', type: 'buy', price: 175.50, quantity: 15, date: '2026-06-15' },
        { id: 'tx-2', symbol: 'TSLA', type: 'buy', price: 182.00, quantity: 10, date: '2026-06-20' },
      ];
      setTransactions(defaultTx);
      localStorage.setItem('stocks_transactions', JSON.stringify(defaultTx));
    }
  }, [isClient]);

  // Simulate Real-time Price Ticks
  useEffect(() => {
    if (Object.keys(stocks).length === 0) return;

    const interval = setInterval(() => {
      const symbols = Object.keys(stocks);
      const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      
      setStocks((prev) => {
        const currentStock = prev[randomSymbol];
        if (!currentStock) return prev;

        // Fluctuate price by -0.5% to +0.55% (slight upward bias)
        const percentChange = (Math.random() - 0.48) * 0.01;
        const priceDiff = currentStock.price * percentChange;
        const newPrice = Math.max(1, parseFloat((currentStock.price + priceDiff).toFixed(2)));
        
        // Calculate change compared to the last sparkline value (which is initial price)
        const initialPrice = currentStock.sparkline[0];
        const overallChange = newPrice - initialPrice;
        const overallChangePercent = (overallChange / initialPrice) * 100;

        setLastUpdatedSymbol({
          symbol: randomSymbol,
          direction: newPrice > currentStock.price ? 'up' : 'down',
        });

        // Clear highlight flash after 1 second
        setTimeout(() => {
          setLastUpdatedSymbol(null);
        }, 1000);

        return {
          ...prev,
          [randomSymbol]: {
            ...currentStock,
            price: newPrice,
            prevPrice: currentStock.price,
            change: parseFloat(overallChange.toFixed(2)),
            changePercent: parseFloat(overallChangePercent.toFixed(2)),
          },
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [stocks]);

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
