'use client';

import React, { useState } from 'react';
import { useStock } from '@/context/StockContext';
import { INITIAL_STOCKS } from '@/lib/stockStore';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Plus, Trash2, Wallet, ArrowUpRight, ArrowDownRight, FolderSync } from 'lucide-react';

export default function PortfolioPage() {
  const { stocksMap, transactions, addTransaction, removeTransaction, getPortfolioMetrics, isLoaded } = useStock();
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [tradeSymbol, setTradeSymbol] = useState('AAPL');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradePrice, setTradePrice] = useState('');
  const [tradeQty, setTradeQty] = useState('');

  if (!isLoaded) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-purple border-t-transparent" />
      </div>
    );
  }

  const metrics = getPortfolioMetrics();
  const isProfit = metrics.gainLoss >= 0;

  const handleAddTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradePrice || !tradeQty) return;
    addTransaction({
      symbol: tradeSymbol,
      type: tradeType,
      price: parseFloat(tradePrice),
      quantity: parseFloat(tradeQty),
      date: new Date().toISOString().split('T')[0],
    });
    setTradePrice('');
    setTradeQty('');
    setShowAddTrade(false);
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export.');
      return;
    }
    const headers = ['ID', 'Symbol', 'Type', 'Price', 'Quantity', 'Date'];
    const rows = transactions.map((t) => [
      t.id,
      t.symbol,
      t.type.toUpperCase(),
      t.price,
      t.quantity,
      t.date,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `portfolio_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Portfolio Overview</h1>
          <p className="text-sm text-muted mt-1">Track and manage your stock logs and capital distributions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-card-border bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowAddTrade(true)}
            className="flex items-center gap-2 rounded-xl bg-accent-purple px-4 py-2 text-xs font-semibold text-white shadow-neon-purple hover:bg-accent-purple/90 transition-colors"
          >
            <Plus size={14} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Portfolio Performance Summary Widgets */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Invested */}
        <div className="glass rounded-2xl p-6 flex flex-col justify-between h-32">
          <span className="text-xs text-muted font-medium">Total Invested</span>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            ${metrics.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-muted">Original capital allocation</span>
        </div>

        {/* Current Portfolio Value */}
        <div className="glass rounded-2xl p-6 flex flex-col justify-between h-32">
          <span className="text-xs text-muted font-medium">Current Portfolio Value</span>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            ${metrics.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-muted">Evaluated at current ticker prices</span>
        </div>

        {/* Net Gain/Loss */}
        <div className="glass rounded-2xl p-6 flex flex-col justify-between h-32">
          <span className="text-xs text-muted font-medium">Net Profit / Loss</span>
          <span className={`text-2xl font-extrabold tracking-tight ${isProfit ? 'text-up' : 'text-down'}`}>
            ${metrics.gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-muted">Overall portfolio balance</span>
        </div>

        {/* Portfolio ROI */}
        <div className={`glass rounded-2xl p-6 flex flex-col justify-between h-32 border ${
          isProfit ? 'border-up/20 bg-up/5' : 'border-down/20 bg-down/5'
        }`}>
          <span className="text-xs text-muted font-medium">Portfolio ROI</span>
          <span className={`text-2xl font-extrabold tracking-tight ${isProfit ? 'text-up' : 'text-down'} flex items-center`}>
            {isProfit ? '+' : ''}{metrics.gainLossPercent.toFixed(2)}%
            {isProfit ? <ArrowUpRight size={20} className="ml-1" /> : <ArrowDownRight size={20} className="ml-1" />}
          </span>
          <span className="text-[10px] text-muted">Percentage yield return</span>
        </div>
      </div>

      {/* Transactions Log Section */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white tracking-wide border-b border-card-border pb-4 flex items-center gap-2">
          <FolderSync size={18} className="text-accent-purple" />
          Historical Transaction Log
        </h3>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <Wallet size={36} className="mb-2 opacity-50" />
            <p className="text-sm">You haven&apos;t logged any trades yet.</p>
            <button
              onClick={() => setShowAddTrade(true)}
              className="mt-3 text-xs text-accent-purple hover:underline"
            >
              Log your first transaction now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-card-border bg-sidebar/30">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-sidebar/55 border-b border-card-border text-muted">
                  <th className="p-4">Symbol</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Total Value</th>
                  <th className="p-4">Current Value</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {transactions.map((tx) => {
                  const currentPrice = stocksMap[tx.symbol]?.price || tx.price;
                  const totalInvested = tx.price * tx.quantity;
                  const currentVal = currentPrice * tx.quantity;
                  const isBuy = tx.type === 'buy';

                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors">
                      {/* Symbol */}
                      <td className="p-4 font-bold text-white">
                        <Link href={`/stock/${tx.symbol}`} className="hover:underline flex items-center gap-2">
                          <span className="text-base">{stocksMap[tx.symbol]?.logo || '📦'}</span>
                          {tx.symbol}
                        </Link>
                      </td>
                      {/* Type */}
                      <td className="p-4">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          isBuy ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
                        }`}>
                          {tx.type.toUpperCase()}
                        </span>
                      </td>
                      {/* Quantity */}
                      <td className="p-4 text-white font-semibold">{tx.quantity}</td>
                      {/* Price */}
                      <td className="p-4 text-muted">${tx.price.toFixed(2)}</td>
                      {/* Total Value */}
                      <td className="p-4 text-white font-semibold">
                        ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      {/* Current Value */}
                      <td className="p-4 text-white font-semibold">
                        ${currentVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      {/* Date */}
                      <td className="p-4 text-muted">{tx.date}</td>
                      {/* Action */}
                      <td className="p-4">
                        <button
                          onClick={() => removeTransaction(tx.id)}
                          className="text-down hover:text-red-400 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
                {/* Stock Symbol Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] text-muted">Stock Symbol</label>
                  <select
                    value={tradeSymbol}
                    onChange={(e) => setTradeSymbol(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-accent-purple/50 cursor-pointer"
                  >
                    {Object.keys(INITIAL_STOCKS).map((symbol) => (
                      <option key={symbol} value={symbol} className="bg-sidebar text-white">
                        {symbol} - {INITIAL_STOCKS[symbol].name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] text-muted">Transaction Type</label>
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
                </div>

                {/* Price input */}
                <div className="space-y-1">
                  <label className="text-[10px] text-muted">Price per share (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 175.50"
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
