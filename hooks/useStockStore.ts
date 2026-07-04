'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '@supabase/supabase-js';
import { StockInfo, Transaction, INITIAL_STOCKS } from '../lib/stockStore';
import { getQuote } from '../lib/api/apiClient';
import { createClient } from '../lib/supabase/client';

const TRACKED_SYMBOLS = Object.keys(INITIAL_STOCKS);

interface UserProfile {
  id: string;
  full_name?: string;
  ai_provider?: string;
  ai_api_key?: string;
  stock_api_key?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
}

export interface Alert {
  id: string;
  user_id: string;
  symbol: string;
  type: 'percent_above' | 'percent_below' | 'price_above' | 'price_below';
  value: number;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

interface DBWatchlist {
  symbol: string;
}

interface DBTransaction {
  id: string;
  symbol: string;
  type: string;
  price: string;
  quantity: string;
  transaction_date: string;
}

export function useStockStore() {
  const [stocks, setStocks] = useState<Record<string, StockInfo>>(() => {
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
    return initialized;
  });

  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastUpdatedSymbol, setLastUpdatedSymbol] = useState<{ symbol: string; direction: 'up' | 'down' } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Set isClient on mount
  useEffect(() => {
    setTimeout(() => setIsClient(true), 0);
  }, []);

  // Listen to Supabase Auth State Change
  useEffect(() => {
    if (!isClient) return;
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        setWatchlist([]);
        setTransactions([]);
      }
      setAuthLoaded(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        setWatchlist([]);
        setTransactions([]);
      }
      setAuthLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, [isClient]);

  // Load User Profile, Watchlist, and Transactions from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      const supabase = createClient();

      // Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileData) {
        setUserProfile(profileData as UserProfile);
      }

      // Watchlist
      const { data: wlData, error: wlError } = await supabase
        .from('watchlists')
        .select('symbol');
      if (!wlError && wlData) {
        setWatchlist((wlData as DBWatchlist[]).map((w) => w.symbol));
      }

      // Transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
      if (!txError && txData) {
        const mappedTx: Transaction[] = (txData as DBTransaction[]).map((t) => ({
          id: t.id,
          symbol: t.symbol,
          type: t.type as 'buy' | 'sell',
          price: parseFloat(t.price),
          quantity: parseFloat(t.quantity),
          date: t.transaction_date,
        }));
        setTransactions(mappedTx);
      }

      // Alerts
      const { data: alertData, error: alertError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
      if (!alertError && alertData) {
        setAlerts(alertData as Alert[]);
      }
    };

    fetchUserData();
  }, [user]);

  // Fetch real quotes from Finnhub API via our API route
  const { data: quotesData } = useQuery<Record<string, { price: number; change: number; changePercent: number }>>({
    queryKey: ['quotes', TRACKED_SYMBOLS],
    queryFn: async () => {
      const results: Record<string, { price: number; change: number; changePercent: number }> = {};
      for (const symbol of TRACKED_SYMBOLS) {
        try {
          const quote = await getQuote(symbol);
          if (quote.price > 0) {
            results[symbol] = {
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
            };
          }
        } catch {
          // Skip failed quotes
        }
        await new Promise(r => setTimeout(r, 200));
      }
      return results;
    },
    refetchInterval: 60000,
    enabled: isClient,
    staleTime: 30000,
  });

  // Update stocks when real quote data arrives (deferred to avoid set-state-in-effect warning)
  useEffect(() => {
    if (!quotesData || Object.keys(quotesData).length === 0) return;
    
    const timer = setTimeout(() => {
      setStocks((prev) => {
        const updated = { ...prev };
        Object.entries(quotesData).forEach(([symbol, quote]) => {
          if (updated[symbol] && quote.price > 0) {
            const prevPrice = updated[symbol].price;
            const direction = quote.price > prevPrice ? 'up' : 'down';
            
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
    }, 0);

    return () => clearTimeout(timer);
  }, [quotesData]);

  // Watchlist Actions
  const addToWatchlist = useCallback(async (symbol: string) => {
    if (!user) return;
    const supabase = createClient();
    setWatchlist((prev) => {
      if (prev.includes(symbol)) return prev;
      return [...prev, symbol];
    });
    const { error } = await supabase.from('watchlists').insert({ user_id: user.id, symbol });
    if (error) {
      setWatchlist((prev) => prev.filter(s => s !== symbol));
    }
  }, [user]);

  const removeFromWatchlist = useCallback(async (symbol: string) => {
    if (!user) return;
    const supabase = createClient();
    setWatchlist((prev) => prev.filter((s) => s !== symbol));
    const { error } = await supabase.from('watchlists').delete().eq('user_id', user.id).eq('symbol', symbol);
    if (error) {
      setWatchlist((prev) => [...prev, symbol]);
    }
  }, [user]);

  // Transaction Actions
  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id'>) => {
    if (!user) return;
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        symbol: tx.symbol,
        type: tx.type,
        price: tx.price,
        quantity: tx.quantity,
        transaction_date: tx.date
      })
      .select()
      .single();
      
    if (!error && data) {
      const newTx: Transaction = {
        id: data.id,
        symbol: data.symbol,
        type: data.type as 'buy' | 'sell',
        price: parseFloat(data.price),
        quantity: parseFloat(data.quantity),
        date: data.transaction_date,
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  }, [user]);

  const removeTransaction = useCallback(async (id: string) => {
    if (!user) return;
    const supabase = createClient();
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      // Re-fetch transactions on error
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
      if (data) {
        setTransactions((data as DBTransaction[]).map((t) => ({
          id: t.id,
          symbol: t.symbol,
          type: t.type as 'buy' | 'sell',
          price: parseFloat(t.price),
          quantity: parseFloat(t.quantity),
          date: t.transaction_date,
        })));
      }
    }
  }, [user]);

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

  // Alert Actions
  const addAlert = useCallback(async (alert: Omit<Alert, 'id' | 'user_id' | 'is_active' | 'last_triggered_at' | 'created_at'>) => {
    if (!user) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('alerts')
      .insert({
        user_id: user.id,
        symbol: alert.symbol,
        type: alert.type,
        value: alert.value,
      })
      .select()
      .single();
    if (!error && data) {
      setAlerts((prev) => [data as Alert, ...prev]);
    }
  }, [user]);

  const removeAlert = useCallback(async (id: string) => {
    if (!user) return;
    const supabase = createClient();
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    await supabase.from('alerts').delete().eq('id', id);
  }, [user]);

  // Evaluate alerts on stock updates
  useEffect(() => {
    if (!user || alerts.length === 0 || Object.keys(stocks).length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const supabase = createClient();

    alerts.forEach(async (alert) => {
      if (!alert.is_active) return;

      const lastTriggeredDay = alert.last_triggered_at ? alert.last_triggered_at.split('T')[0] : null;
      if (lastTriggeredDay === todayStr) return;

      const stock = stocks[alert.symbol];
      if (!stock) return;

      let triggered = false;
      let currentValue = 0;

      if (alert.type === 'price_above' && stock.price > alert.value) {
        triggered = true;
        currentValue = stock.price;
      } else if (alert.type === 'price_below' && stock.price < alert.value) {
        triggered = true;
        currentValue = stock.price;
      } else if (alert.type === 'percent_above' && stock.changePercent > alert.value) {
        triggered = true;
        currentValue = stock.changePercent;
      } else if (alert.type === 'percent_below' && stock.changePercent < alert.value) {
        triggered = true;
        currentValue = stock.changePercent;
      }

      if (triggered) {
        // 1. Immediately update local state to avoid race condition double triggering
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alert.id ? { ...a, last_triggered_at: new Date().toISOString() } : a
          )
        );

        // 2. Update last_triggered_at in Supabase
        await supabase
          .from('alerts')
          .update({ last_triggered_at: new Date().toISOString() })
          .eq('id', alert.id);

        // 3. Send Telegram Alert
        try {
          await fetch('/api/send-telegram-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol: alert.symbol,
              alertType: alert.type,
              value: alert.value,
              currentValue,
            }),
          });
        } catch (err) {
          console.error('Failed to send Telegram alert:', err);
        }
      }
    });
  }, [stocks, alerts, user]);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setWatchlist([]);
    setTransactions([]);
    setAlerts([]);
  }, []);

  return {
    stocks: Object.values(stocks),
    stocksMap: stocks,
    watchlist,
    transactions,
    alerts,
    lastUpdatedSymbol,
    addToWatchlist,
    removeFromWatchlist,
    addTransaction,
    removeTransaction,
    addAlert,
    removeAlert,
    getPortfolioMetrics,
    isLoaded: isClient && authLoaded,
    user,
    userProfile,
    logout,
  };
}
