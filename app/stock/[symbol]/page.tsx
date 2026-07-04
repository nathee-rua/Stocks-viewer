'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, Sparkles, BrainCircuit, Activity, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useStock } from '@/context/StockContext';
import { generateHistoricalData, runMABacktest, MOCK_NEWS, HistoricalCandle } from '@/lib/stockStore';
import { getHistoricalData, getNews } from '@/lib/api/apiClient';
import TradingViewChart from '@/components/TradingViewChart';

type Tab = 'overview' | 'transactions' | 'ai' | 'backtest';

interface FundamentalMetric {
  label: string;
  value: string;
}

const STOCK_FUNDAMENTALS: Record<string, FundamentalMetric[]> = {
  AAPL: [
    { label: 'Market Cap', value: '$3.02 Trillion' },
    { label: 'P/E Ratio', value: '29.8x' },
    { label: 'Dividend Yield', value: '0.48%' },
    { label: 'Beta (5Y)', value: '1.24' },
    { label: 'Volume (Avg)', value: '52.4 Million' },
    { label: '52-Week Range', value: '$164.08 - $199.62' },
    { label: 'EPS (TTM)', value: '$6.15' },
    { label: 'ROE', value: '154.30%' },
  ],
  TSLA: [
    { label: 'Market Cap', value: '$612.4 Billion' },
    { label: 'P/E Ratio', value: '58.4x' },
    { label: 'Dividend Yield', value: 'N/A (0%)' },
    { label: 'Beta (5Y)', value: '2.42' },
    { label: 'Volume (Avg)', value: '88.2 Million' },
    { label: '52-Week Range', value: '$138.80 - $278.98' },
    { label: 'EPS (TTM)', value: '$3.10' },
    { label: 'ROE', value: '12.80%' },
  ],
  PYPL: [
    { label: 'Market Cap', value: '$56.4 Billion' },
    { label: 'P/E Ratio', value: '15.2x' },
    { label: 'Dividend Yield', value: 'N/A (0%)' },
    { label: 'Beta (5Y)', value: '1.38' },
    { label: 'Volume (Avg)', value: '9.8 Million' },
    { label: '52-Week Range', value: '$49.10 - $78.42' },
    { label: 'EPS (TTM)', value: '$3.75' },
    { label: 'ROE', value: '18.40%' },
  ],
};

const DEFAULT_FUNDAMENTALS = [
  { label: 'Market Cap', value: '$120.4 Billion' },
  { label: 'P/E Ratio', value: '22.4x' },
  { label: 'Dividend Yield', value: '1.20%' },
  { label: 'Beta (5Y)', value: '1.15' },
  { label: 'Volume (Avg)', value: '4.2 Million' },
  { label: '52-Week Range', value: '$120.00 - $175.00' },
  { label: 'EPS (TTM)', value: '$4.12' },
  { label: 'ROE', value: '14.20%' },
];

export default function StockDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const unwrappedParams = React.use(params);
  const symbol = unwrappedParams.symbol;
  
  const { stocksMap, watchlist, transactions, addToWatchlist, removeFromWatchlist, addTransaction, removeTransaction } = useStock();
  
  const stock = stocksMap[symbol];
  const isWatched = watchlist.includes(symbol);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as Tab;
      if (tab && ['overview', 'transactions', 'ai', 'backtest'].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);
  
  // Backtest state
  const [maFast, setMaFast] = useState(12);
  const [maSlow, setMaSlow] = useState(26);
  const [backtestRun, setBacktestRun] = useState(false);
  const [showFastMA, setShowFastMA] = useState(true);
  const [showSlowMA, setShowSlowMA] = useState(true);
  const [showSignals, setShowSignals] = useState(true);
  
  // Transaction input state
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradePrice, setTradePrice] = useState('');
  const [tradeQty, setTradeQty] = useState('');
  
  // AI Advisor state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Fetch real historical data from API, fallback to mock
  const { data: apiHistorical } = useQuery({
    queryKey: ['historical', symbol],
    queryFn: () => getHistoricalData(symbol),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const historicalData = useMemo<HistoricalCandle[]>(() => {
    if (apiHistorical && apiHistorical.length > 0) {
      return apiHistorical.map(candle => ({
        ...candle,
        value: candle.close,
        volume: candle.volume ?? 0
      }));
    }
    return generateHistoricalData(symbol, 250); // Fallback to mock
  }, [apiHistorical, symbol]);

  // Fetch real news from API
  const { data: apiNews, isLoading: newsLoading } = useQuery({
    queryKey: ['news', symbol],
    queryFn: () => getNews(symbol),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Backtest engine results
  const backtestResults = useMemo(() => {
    if (!backtestRun) return null;
    return runMABacktest(historicalData, maFast, maSlow);
  }, [backtestRun, historicalData, maFast, maSlow]);

  // Handle current price updates in historical data
  const updatedHistoricalData = useMemo(() => {
    if (!stock || historicalData.length === 0) return historicalData;
    const nextData = [...historicalData];
    const lastItem = nextData[nextData.length - 1];
    nextData[nextData.length - 1] = {
      ...lastItem,
      close: stock.price,
      value: stock.price,
      high: Math.max(lastItem.high, stock.price),
      low: Math.min(lastItem.low, stock.price),
    };
    return nextData;
  }, [stock, historicalData]);

  // Handle Backtest Trigger
  const handleRunBacktest = () => {
    setBacktestRun(true);
  };

  // Handle AI analysis request
  const handleRequestAI = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          maFast,
          maSlow,
          currentPrice: stock?.price || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsConfig) {
          setAiAnalysis(`### Setup Required\n\nAI provider API key is missing. Please go to **Settings** in the sidebar to configure your AI provider and API key.`);
        } else {
          setAiAnalysis(`### Error\n\n${data.error || 'Failed to generate AI analysis.'}`);
        }
      } else {
        setAiAnalysis(data.analysis);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setAiAnalysis(`### Error\n\n${error.message || 'An unexpected error occurred.'}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Add a new mock transaction
  const handleAddTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradePrice || !tradeQty) return;
    addTransaction({
      symbol,
      type: tradeType,
      price: parseFloat(tradePrice),
      quantity: parseFloat(tradeQty),
      date: new Date().toISOString().split('T')[0],
    });
    setTradePrice('');
    setTradeQty('');
    setShowAddTrade(false);
  };

  // Filter transactions for this stock
  const stockTransactions = transactions.filter((t) => t.symbol === symbol);

  const fundamentals = STOCK_FUNDAMENTALS[symbol] || DEFAULT_FUNDAMENTALS;
  const mockNews = MOCK_NEWS[symbol] || MOCK_NEWS.ALL;

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h2 className="text-xl font-bold">Stock Symbol not found</h2>
        <Link href="/" className="mt-4 flex items-center gap-2 text-accent-purple hover:underline">
          <ArrowLeft size={16} /> Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-card-border hover:bg-white/5 text-muted hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-2xl">
              {stock.logo}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-wide">{stock.symbol}</h1>
                <span className="text-xs text-muted font-normal bg-white/5 px-2 py-0.5 rounded">
                  USD
                </span>
              </div>
              <p className="text-sm text-muted">{stock.name}</p>
            </div>
          </div>
        </div>

        {/* Watchlist & Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => (isWatched ? removeFromWatchlist(symbol) : addToWatchlist(symbol))}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
              isWatched
                ? 'border-accent-purple bg-accent-purple/10 text-accent-purple shadow-neon-purple'
                : 'border-card-border hover:bg-white/5 text-muted hover:text-white'
            }`}
          >
            {isWatched ? (
              <>
                <EyeOff size={14} /> Unwatch
              </>
            ) : (
              <>
                <Eye size={14} /> Watch Stock
              </>
            )}
          </button>

          <button
            onClick={() => setShowAddTrade(true)}
            className="flex items-center gap-2 rounded-xl bg-accent-purple px-4 py-2 text-xs font-semibold text-white shadow-neon-purple hover:bg-accent-purple/90 transition-colors"
          >
            <Plus size={14} /> Log Transaction
          </button>
        </div>
      </div>

      {/* Main Stock Panel Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Chart + Backtest + Tabs Area (Left - 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-time Ticker & Price Header */}
          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-extrabold tracking-tight text-white">
              ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span
              className={`text-sm font-semibold ${
                stock.changePercent >= 0 ? 'text-up' : 'text-down'
              }`}
            >
              {stock.changePercent >= 0 ? '+' : ''}
              {stock.changePercent}%
            </span>
          </div>

          {/* Interactive TradingView Chart */}
          <TradingViewChart
            data={updatedHistoricalData}
            maFastData={showFastMA ? backtestResults?.maFastValues : []}
            maSlowData={showSlowMA ? backtestResults?.maSlowValues : []}
            signals={showSignals ? backtestResults?.signals : []}
          />

          {/* Dual MA Backtest Controls */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <Activity size={16} className="text-accent-purple" />
                Dual Moving Average Crossover Backtest
              </h3>
              {backtestRun && (
                <button
                  onClick={() => setBacktestRun(false)}
                  className="text-xs text-muted hover:text-white underline"
                >
                  Clear Backtest
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* MA Fast Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted">
                  <span>Fast MA Period (Short-term)</span>
                  <span className="font-semibold text-accent-purple">{maFast} Days</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={maFast}
                  onChange={(e) => setMaFast(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-accent-purple"
                />
              </div>

              {/* MA Slow Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted">
                  <span>Slow MA Period (Long-term)</span>
                  <span className="font-semibold text-yellow-500">{maSlow} Days</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={maSlow}
                  onChange={(e) => setMaSlow(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
              </div>
            </div>

            {/* Chart Overlays Toggles */}
            <div className="flex flex-wrap gap-6 pt-3 border-t border-card-border/30">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-muted hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={showFastMA}
                  onChange={(e) => setShowFastMA(e.target.checked)}
                  className="rounded border-card-border text-accent-purple focus:ring-0 cursor-pointer accent-accent-purple"
                />
                Show Fast MA (Purple)
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-muted hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={showSlowMA}
                  onChange={(e) => setShowSlowMA(e.target.checked)}
                  className="rounded border-card-border text-yellow-500 focus:ring-0 cursor-pointer accent-yellow-500"
                />
                Show Slow MA (Yellow)
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-muted hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={showSignals}
                  onChange={(e) => setShowSignals(e.target.checked)}
                  className="rounded border-card-border text-accent-green focus:ring-0 cursor-pointer accent-up"
                />
                Show Buy/Sell Arrows
              </label>
            </div>

            <button
              onClick={handleRunBacktest}
              className="w-full py-2.5 rounded-xl border border-accent-purple/20 bg-accent-purple/10 text-xs font-semibold text-accent-purple hover:bg-accent-purple hover:text-white shadow-sm transition-all"
            >
              Run Backtest Simulation
            </button>

            {/* Backtest Results Banner */}
            <AnimatePresence>
              {backtestResults && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 border-t border-card-border pt-4 mt-2">
                    <div className="text-center rounded-xl bg-white/[0.02] border border-card-border/50 p-3">
                      <p className="text-[10px] text-muted">Total Return</p>
                      <p className={`text-base font-bold mt-1 ${backtestResults.totalReturn >= 0 ? 'text-up' : 'text-down'}`}>
                        {backtestResults.totalReturn >= 0 ? '+' : ''}{backtestResults.totalReturn}%
                      </p>
                    </div>

                    <div className="text-center rounded-xl bg-white/[0.02] border border-card-border/50 p-3">
                      <p className="text-[10px] text-muted">Win Rate</p>
                      <p className="text-base font-bold text-accent-purple mt-1">{backtestResults.winRate}%</p>
                    </div>

                    <div className="text-center rounded-xl bg-white/[0.02] border border-card-border/50 p-3">
                      <p className="text-[10px] text-muted">Total Trades</p>
                      <p className="text-base font-bold text-white mt-1">{backtestResults.numTrades}</p>
                    </div>

                    <div className="text-center rounded-xl bg-white/[0.02] border border-card-border/50 p-3">
                      <p className="text-[10px] text-muted">Max Drawdown</p>
                      <p className="text-base font-bold text-red-400 mt-1">-{backtestResults.maxDrawdown}%</p>
                    </div>

                    <div className="text-center rounded-xl bg-white/[0.02] border border-card-border/50 p-3">
                      <p className="text-[10px] text-muted">Profit Factor</p>
                      <p className="text-base font-bold text-green-400 mt-1">{backtestResults.profitFactor}x</p>
                    </div>

                    <div className="text-center rounded-xl bg-white/[0.02] border border-card-border/50 p-3">
                      <p className="text-[10px] text-muted">Avg Trade Return</p>
                      <p className={`text-base font-bold mt-1 ${backtestResults.avgTradeReturn >= 0 ? 'text-up' : 'text-down'}`}>
                        {backtestResults.avgTradeReturn >= 0 ? '+' : ''}{backtestResults.avgTradeReturn}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Tabs Area */}
          <div className="space-y-4">
            <div className="flex border-b border-card-border gap-6">
              {(['overview', 'transactions', 'ai', ...(backtestResults ? ['backtest'] : [])] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-xs font-semibold transition-all relative ${
                    activeTab === tab ? 'text-white' : 'text-muted hover:text-white'
                  }`}
                >
                  {tab.toUpperCase()}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-purple shadow-neon-purple"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="min-h-[160px]">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white tracking-wide">Company News</h3>
                  {newsLoading ? (
                    <div className="flex items-center gap-2 text-muted text-xs py-8 justify-center">
                      <Loader2 size={14} className="animate-spin" /> Loading news...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(apiNews && apiNews.length > 0 ? apiNews : mockNews).map((item: { id?: string | number; title?: string; headline?: string; summary?: string; source: string; time?: string; datetime?: number; url?: string }, idx: number) => {
                        // Handle both API and mock news formats
                        const isAPI = !!item.headline;
                        const title = isAPI ? item.headline : item.title;
                        const summary = isAPI ? item.summary : item.summary;
                        const source = item.source;
                        const timeStr = isAPI
                          ? new Date((item.datetime ?? 0) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : item.time;
                        const url = item.url || '#';
                        const key = isAPI ? item.id : (item.id || idx);

                        return (
                          <a
                            key={key}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-xl border border-card-border/50 bg-white/[0.01] p-4 hover:bg-white/[0.03] transition-colors"
                          >
                            <div className="flex justify-between text-[10px] text-muted">
                              <span>{source}</span>
                              <span>{timeStr}</span>
                            </div>
                            <h4 className="text-xs font-bold text-white mt-1 hover:underline">
                              {title}
                            </h4>
                            {summary && <p className="text-[11px] text-muted mt-1.5 line-clamp-2">{summary}</p>}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white tracking-wide">Transaction Log</h3>
                  {stockTransactions.length === 0 ? (
                    <p className="text-xs text-muted">No transactions logged for {symbol} yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-card-border">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-sidebar/55 border-b border-card-border text-muted">
                            <th className="p-3">Type</th>
                            <th className="p-3">Quantity</th>
                            <th className="p-3">Avg Price</th>
                            <th className="p-3">Total Value</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-card-border">
                          {stockTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-white/[0.02]">
                              <td className="p-3">
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                    tx.type === 'buy'
                                      ? 'bg-up/10 text-up'
                                      : 'bg-down/10 text-down'
                                  }`}
                                >
                                  {tx.type.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-3 font-semibold text-white">{tx.quantity}</td>
                              <td className="p-3 text-muted">${tx.price.toFixed(2)}</td>
                              <td className="p-3 font-semibold text-white">
                                ${(tx.price * tx.quantity).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="p-3 text-muted">{tx.date}</td>
                              <td className="p-3">
                                <button
                                  onClick={() => removeTransaction(tx.id)}
                                  className="text-down hover:text-red-400 p-1"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="glass rounded-xl p-6 space-y-4 relative">
                  <div className="flex items-center justify-between border-b border-card-border pb-3">
                    <h3 className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-accent-purple" />
                      AI PORTFOLIO ADVISOR
                    </h3>
                    <button
                      onClick={handleRequestAI}
                      disabled={aiLoading}
                      className="flex items-center gap-1 text-[11px] font-bold text-accent-purple hover:underline"
                    >
                      <BrainCircuit size={12} />
                      {aiLoading ? 'Analyzing...' : 'Generate New Analysis'}
                    </button>
                  </div>

                  <div className="text-xs text-muted leading-relaxed">
                    {aiLoading ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-2">
                        <div className="h-6 w-6 border-2 border-accent-purple border-t-transparent animate-spin rounded-full" />
                        <span className="text-[10px]">Processing model metrics...</span>
                      </div>
                    ) : aiAnalysis ? (
                      <div className="prose prose-invert max-w-none text-xs space-y-2">
                        {aiAnalysis.split('\n\n').map((para, idx) => {
                          if (para.startsWith('###')) {
                            return <h4 key={idx} className="text-xs font-bold text-white mt-3">{para.replace('###', '')}</h4>;
                          }
                          return <p key={idx}>{para}</p>;
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="mb-3">Need some professional patterns summaries?</p>
                        <button
                          onClick={handleRequestAI}
                          className="px-4 py-2 rounded-xl bg-accent-purple text-white text-[11px] font-bold shadow-neon-purple"
                        >
                          Run AI Summary Crossovers
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'backtest' && backtestResults && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white tracking-wide">Strategy Simulated Trades Log</h3>
                  {backtestResults.trades.length === 0 ? (
                    <p className="text-xs text-muted">No trades completed for the given MA periods.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-card-border bg-sidebar/30">
                      <table className="w-full text-left border-collapse text-xs md:text-sm">
                        <thead>
                          <tr className="bg-sidebar/55 border-b border-card-border text-muted">
                            <th className="p-3">#</th>
                            <th className="p-3">Entry Date</th>
                            <th className="p-3">Exit Date</th>
                            <th className="p-3">Buy Price</th>
                            <th className="p-3">Sell Price</th>
                            <th className="p-3">Return (%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-card-border">
                          {backtestResults.trades.map((trade, idx) => {
                            const isProfit = trade.profitPercent >= 0;
                            return (
                              <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-3 text-muted">{idx + 1}</td>
                                <td className="p-3 font-semibold text-white">{trade.entryTime}</td>
                                <td className="p-3 font-semibold text-white">{trade.exitTime}</td>
                                <td className="p-3 text-muted">${trade.entryPrice.toFixed(2)}</td>
                                <td className="p-3 text-muted">${trade.exitPrice.toFixed(2)}</td>
                                <td className={`p-3 font-semibold ${isProfit ? 'text-up' : 'text-down'}`}>
                                  {isProfit ? '+' : ''}{trade.profitPercent}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fundamental Metrics Panel (Right - 1/3) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-base font-bold text-white tracking-wide border-b border-card-border pb-4">
              Key Fundamental Metrics
            </h3>
            <div className="mt-4 divide-y divide-card-border">
              {fundamentals.map((metric, idx) => (
                <div key={idx} className="flex justify-between py-3 first:pt-0 last:pb-0">
                  <span className="text-xs text-muted">{metric.label}</span>
                  <span className="text-xs font-semibold text-white">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Log Transaction Slide-out Modal */}
      <AnimatePresence>
        {showAddTrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-96 rounded-2xl border border-card-border bg-sidebar p-6 shadow-2xl"
            >
              <h3 className="text-base font-bold text-white border-b border-card-border pb-3">
                Log New Transaction
              </h3>
              
              <form onSubmit={handleAddTrade} className="mt-4 space-y-4">
                {/* Type Selection */}
                <div className="flex rounded-xl bg-white/5 p-1 border border-card-border">
                  <button
                    type="button"
                    onClick={() => setTradeType('buy')}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                      tradeType === 'buy' ? 'bg-up text-black' : 'text-muted hover:text-white'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeType('sell')}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                      tradeType === 'sell' ? 'bg-down text-white' : 'text-muted hover:text-white'
                    }`}
                  >
                    SELL
                  </button>
                </div>

                {/* Price input */}
                <div className="space-y-1">
                  <label className="text-[10px] text-muted">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder={stock.price.toFixed(2)}
                    value={tradePrice}
                    onChange={(e) => setTradePrice(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                  />
                </div>

                {/* Quantity input */}
                <div className="space-y-1">
                  <label className="text-[10px] text-muted">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 10"
                    value={tradeQty}
                    onChange={(e) => setTradeQty(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-accent-purple/50"
                  />
                </div>

                {/* Submit buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTrade(false)}
                    className="flex-1 rounded-xl border border-card-border py-2 text-xs font-semibold text-muted hover:bg-white/5 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-accent-purple py-2 text-xs font-semibold text-white shadow-neon-purple hover:bg-accent-purple/90 transition-colors"
                  >
                    Save Trade
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
