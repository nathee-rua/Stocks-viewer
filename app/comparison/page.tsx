'use client';

import React, { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getHistoricalData } from '@/lib/api/apiClient';
import { INITIAL_STOCKS } from '@/lib/stockStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Plus, Trash2, ArrowUpRight, Loader2, RefreshCw } from 'lucide-react';

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#EAB308'];

export default function ComparisonPage() {
  const [selectedStocks, setSelectedStocks] = useState<string[]>(['AAPL', 'TSLA']);
  const [activeStockOption, setActiveStockOption] = useState('');

  const available = Object.keys(INITIAL_STOCKS).filter((s) => !selectedStocks.includes(s));
  const currentSelectValue = activeStockOption && available.includes(activeStockOption) ? activeStockOption : (available[0] || '');

  // Fetch historical data for all selected stocks using useQueries
  const queriesResult = useQueries({
    queries: selectedStocks.map((symbol) => ({
      queryKey: ['historical-compare', symbol],
      queryFn: async () => {
        try {
          return await getHistoricalData(symbol);
        } catch (err) {
          console.warn(`Failed to fetch historical data for ${symbol}, falling back to mock data`, err);
          const { generateHistoricalData } = await import('@/lib/stockStore');
          return generateHistoricalData(symbol, 250);
        }
      },
      staleTime: 5 * 60 * 1000,
      retry: 1,
    })),
  });

  const queries = selectedStocks.map((symbol, idx) => ({
    symbol,
    query: queriesResult[idx],
  }));

  const isLoading = queriesResult.some((q) => q.isLoading);
  const isError = queriesResult.some((q) => q.isError);

  const handleAddStock = () => {
    if (selectedStocks.length >= 4) {
      alert('You can compare a maximum of 4 stocks at a time.');
      return;
    }
    const symbolToAdd = activeStockOption && available.includes(activeStockOption) ? activeStockOption : available[0];
    if (symbolToAdd) {
      setSelectedStocks((prev) => [...prev, symbolToAdd]);
      setActiveStockOption('');
    }
  };

  const handleRemoveStock = (symbol: string) => {
    if (selectedStocks.length <= 1) {
      alert('You must keep at least one stock selected.');
      return;
    }
    setSelectedStocks((prev) => prev.filter((s) => s !== symbol));
  };

  // Process historical data to overlay multiple lines normalized to % performance
  const chartData = React.useMemo(() => {
    if (isLoading || isError) return [];

    // Find the minimum number of data points across all queries
    const validQueries = queries.filter((q) => q.query.data && q.query.data.length > 0);
    if (validQueries.length === 0) return [];

    const minLength = Math.min(...validQueries.map((q) => q.query.data!.length));
    if (minLength === 0) return [];

    const combined: Record<string, number | string>[] = [];

    // We take the last `minLength` data points to align timelines
    for (let i = 0; i < minLength; i++) {
      const row: Record<string, number | string> = {};
      let time = '';

      validQueries.forEach((q) => {
        const dataSet = q.query.data!;
        const index = dataSet.length - minLength + i;
        const item = dataSet[index];

        if (item) {
          time = item.time;
          // Calculate percentage change from the first item in the aligned window (index: dataSet.length - minLength)
          const baselineItem = dataSet[dataSet.length - minLength];
          const baselineClose = baselineItem ? baselineItem.close : item.close;
          const percentChange = ((item.close - baselineClose) / baselineClose) * 100;

          row[q.symbol] = parseFloat(percentChange.toFixed(2));
        }
      });

      row.time = time;
      combined.push(row);
    }

    return combined;
  }, [queries, isLoading, isError]);

  // Compute correlation matrix between selected stocks (daily returns)
  const correlationMatrix = React.useMemo(() => {
    if (isLoading || isError || selectedStocks.length < 2) return null;

    const validQueries = queries.filter((q) => q.query.data && q.query.data.length > 1);
    if (validQueries.length < 2) return null;

    const minLength = Math.min(...validQueries.map((q) => q.query.data!.length));
    if (minLength < 5) return null;

    // Calculate daily returns for each stock
    const returns: Record<string, number[]> = {};
    validQueries.forEach((q) => {
      const dataSet = q.query.data!;
      returns[q.symbol] = [];
      for (let i = dataSet.length - minLength + 1; i < dataSet.length; i++) {
        const prev = dataSet[i - 1].close;
        const curr = dataSet[i].close;
        returns[q.symbol].push((curr - prev) / prev);
      }
    });

    const matrix: Record<string, Record<string, number>> = {};

    // Helper: calculate Pearson Correlation
    const getPearsonCorrelation = (x: number[], y: number[]) => {
      const n = x.length;
      let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumX2 = 0,
        sumY2 = 0;

      for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
        sumY2 += y[i] * y[i];
      }

      const num = n * sumXY - sumX * sumY;
      const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      if (den === 0) return 0;
      return num / den;
    };

    // Calculate correlation for each pair
    selectedStocks.forEach((s1) => {
      matrix[s1] = {};
      selectedStocks.forEach((s2) => {
        if (s1 === s2) {
          matrix[s1][s2] = 1;
        } else if (returns[s1] && returns[s2]) {
          matrix[s1][s2] = parseFloat(getPearsonCorrelation(returns[s1], returns[s2]).toFixed(3));
        } else {
          matrix[s1][s2] = 0;
        }
      });
    });

    return matrix;
  }, [queries, selectedStocks, isLoading, isError]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="text-accent-purple" /> Stock Comparison
          </h1>
          <p className="text-sm text-muted mt-1">
            Analyze and overlay normalized historical returns of multiple stock assets
          </p>
        </div>

        {/* Add Stock Dropdown */}
        <div className="flex items-center gap-2">
          {available.length > 0 ? (
            <>
              <select
                value={currentSelectValue}
                onChange={(e) => setActiveStockOption(e.target.value)}
                className="rounded-xl border border-card-border bg-sidebar px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
              >
                {available.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol} - {INITIAL_STOCKS[symbol].name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddStock}
                className="flex items-center gap-1 rounded-xl bg-accent-purple px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-purple/90 transition-colors"
              >
                <Plus size={12} /> Add
              </button>
            </>
          ) : (
            <span className="text-[10px] text-muted">Max stocks selected</span>
          )}
        </div>
      </div>

      {/* Selected badges list */}
      <div className="flex flex-wrap gap-2.5">
        {selectedStocks.map((symbol, idx) => (
          <div
            key={symbol}
            className="flex items-center gap-2 rounded-full border border-card-border bg-sidebar/55 px-3 py-1 text-xs text-white"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span className="font-bold">{symbol}</span>
            <button
              onClick={() => handleRemoveStock(symbol)}
              disabled={selectedStocks.length <= 1}
              className="text-muted hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed ml-0.5"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Main Overlay Graph Panel */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-base font-bold text-white tracking-wide border-b border-card-border pb-4 mb-6">
          Normalized Returns Comparison (%)
        </h3>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 text-muted gap-2">
            <Loader2 size={32} className="animate-spin text-accent-purple" />
            <p className="text-xs">Fetching and normalizing historical datasets...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-28 text-muted gap-2 text-center">
            <p className="text-xs text-red-400">Failed to fetch historical comparison data.</p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 text-[11px] text-accent-purple hover:underline"
            >
              <RefreshCw size={12} /> Retry fetch
            </button>
          </div>
        ) : (
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="time"
                  stroke="#6B7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1B4B',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    fontSize: '11px',
                  }}
                  itemStyle={{ color: '#F3F4F6' }}
                  labelStyle={{ color: '#9CA3AF' }}
                  formatter={(val) => {
                    const num = typeof val === 'number' ? val : 0;
                    return [`${num > 0 ? '+' : ''}${num}%`, 'Change'];
                  }}
                />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                {selectedStocks.map((symbol, idx) => (
                  <Line
                    key={symbol}
                    type="monotone"
                    dataKey={symbol}
                    name={`${symbol} (%)`}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Correlation Matrix and Insights */}
      {correlationMatrix && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pearson Correlation matrix */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-base font-bold text-white tracking-wide border-b border-card-border pb-4 mb-4">
              Asset Correlation Coefficient Matrix
            </h3>
            <div className="overflow-x-auto rounded-xl border border-card-border bg-sidebar/30">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="bg-sidebar/55 border-b border-card-border text-muted">
                    <th className="p-3">Stock</th>
                    {selectedStocks.map((s) => (
                      <th key={s} className="p-3">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {selectedStocks.map((s1) => (
                    <tr key={s1} className="hover:bg-white/[0.01]">
                      <td className="p-3 font-bold text-white bg-sidebar/10">{s1}</td>
                      {selectedStocks.map((s2) => {
                        const val = correlationMatrix[s1]?.[s2] ?? 0;
                        let colorClass = 'text-white';
                        if (val > 0.7) colorClass = 'text-red-400 font-bold';
                        else if (val < 0.3 && val > -0.3) colorClass = 'text-green-400 font-bold';
                        return (
                          <td key={s2} className={`p-3 ${colorClass}`}>
                            {val.toFixed(3)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-[10px] text-muted flex items-start gap-1 bg-white/5 p-2 rounded-lg leading-normal">
              <span>💡</span>
              <span>
                Values close to **1.0** indicate lock-step movement (low diversification). Values close to **0.0** or negative show high diversification potential.
              </span>
            </div>
          </div>

          {/* Quick analysis summary */}
          <div className="glass rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide border-b border-card-border pb-4 mb-4">
                Risk & Performance Summary
              </h3>
              <ul className="text-xs text-muted space-y-3.5 mt-2">
                <li className="flex items-start gap-2">
                  <span className="text-accent-purple">✔</span>
                  <span>
                    Performance normalized from base-level start bounds yields a comparative growth spread of selected assets over time.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-purple">✔</span>
                  <span>
                    Helps re-allocate assets by finding highly correlated tickers and substituting them for independent yields.
                  </span>
                </li>
              </ul>
            </div>
            <div className="border-t border-card-border/50 pt-4 mt-6 flex justify-between items-center">
              <span className="text-[10px] text-muted">Analysis period: Aligned daily quotes</span>
              <span className="text-[10px] text-accent-purple font-semibold flex items-center gap-0.5">
                Pearson Coefficient Engine <ArrowUpRight size={10} />
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
