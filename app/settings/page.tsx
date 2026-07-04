'use client';

import React, { useState } from 'react';
import { useStock } from '@/context/StockContext';
import { createClient } from '@/lib/supabase/client';
import { User, Settings, Save, ShieldAlert, Sparkles, Key, CheckCircle, AlertCircle, FileSpreadsheet, Loader2, Activity } from 'lucide-react';

interface ProfileData {
  id: string;
  full_name?: string;
  ai_provider?: string;
  ai_api_key?: string;
  stock_api_key?: string;
}

interface UserData {
  id: string;
  email?: string;
}

interface ProfileFormProps {
  userProfile: ProfileData;
  user: UserData;
}

function ProfileForm({ userProfile, user }: ProfileFormProps) {
  const [fullName, setFullName] = useState(userProfile.full_name || '');
  const [aiProvider, setAiProvider] = useState(userProfile.ai_provider || 'openai');
  const [aiApiKey, setAiApiKey] = useState(userProfile.ai_api_key || '');
  const [stockApiKey, setStockApiKey] = useState(userProfile.stock_api_key || '');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Testing states
  const [testingStock, setTestingStock] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [stockTestResult, setStockTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          ai_provider: aiProvider,
          ai_api_key: aiApiKey,
          stock_api_key: stockApiKey,
        })
        .eq('id', user.id);

      if (error) throw error;
      setSuccessMsg('Settings saved successfully! Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestStock = async () => {
    if (!stockApiKey) {
      setStockTestResult({ success: false, message: 'Please enter a Stock API Key to test.' });
      return;
    }
    setTestingStock(true);
    setStockTestResult(null);
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stock', key: stockApiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setStockTestResult({ success: true, message: data.message });
      } else {
        setStockTestResult({ success: false, message: data.error || 'Connection test failed.' });
      }
    } catch {
      setStockTestResult({ success: false, message: 'Network error occurred.' });
    } finally {
      setTestingStock(false);
    }
  };

  const handleTestAi = async () => {
    if (aiProvider !== 'ollama' && !aiApiKey) {
      setAiTestResult({ success: false, message: 'Please enter an AI API Key to test.' });
      return;
    }
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ai', provider: aiProvider, key: aiApiKey || 'ollama' }),
      });
      const data = await res.json();
      if (data.success) {
        setAiTestResult({ success: true, message: data.message });
      } else {
        setAiTestResult({ success: false, message: data.error || 'Connection test failed.' });
      }
    } catch {
      setAiTestResult({ success: false, message: 'Network error occurred.' });
    } finally {
      setTestingAi(false);
    }
  };

  return (
    <>
      <h3 className="text-base font-bold text-white tracking-wide border-b border-card-border pb-4 flex items-center gap-2">
        <User size={18} className="text-accent-purple" /> Profile & System Configuration
      </h3>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-xs text-green-300">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs text-muted font-medium">Display Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Nathee Rua"
            className="w-full rounded-xl border border-card-border bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/30 transition-all"
          />
        </div>

        {/* Stock Data Configuration */}
        <div className="space-y-4 pt-4 border-t border-card-border/50">
          <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
            <Activity size={14} className="text-accent-purple" />
            STOCK API SETTINGS
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted font-medium">Finnhub API Key (Stock Quote & historical)</label>
              <span className="text-[10px] text-muted flex items-center gap-1">
                <Key size={10} /> Encrypted at rest
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={stockApiKey}
                onChange={(e) => setStockApiKey(e.target.value)}
                placeholder="Enter your Finnhub API Key"
                className="flex-1 rounded-xl border border-card-border bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/30 transition-all"
              />
              <button
                type="button"
                onClick={handleTestStock}
                disabled={testingStock}
                className="rounded-xl border border-card-border bg-white/5 px-4 text-xs font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {testingStock && <Loader2 size={12} className="animate-spin" />}
                Test
              </button>
            </div>

            {stockTestResult && (
              <div className={`mt-2 flex items-center gap-2 rounded-lg border p-2.5 text-[11px] ${
                stockTestResult.success 
                  ? 'border-green-500/20 bg-green-500/5 text-green-300' 
                  : 'border-red-500/20 bg-red-500/5 text-red-300'
              }`}>
                {stockTestResult.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                <span>{stockTestResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Advisor Configuration */}
        <div className="space-y-4 pt-4 border-t border-card-border/50">
          <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
            <Sparkles size={14} className="text-accent-purple" />
            AI ADVISOR SETTINGS
          </h4>
          
          <div className="space-y-2">
            <label className="text-xs text-muted font-medium">AI Model Provider</label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="w-full rounded-xl border border-card-border bg-sidebar px-4 py-2.5 text-xs text-white outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/30 cursor-pointer"
            >
              <option value="openai" className="bg-sidebar">OpenAI (GPT-4o mini)</option>
              <option value="gemini" className="bg-sidebar">Google Gemini (2.5 Flash)</option>
              <option value="grok" className="bg-sidebar">xAI Grok</option>
              <option value="ollama" className="bg-sidebar">Ollama (Localhost - llama3)</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted font-medium">API Token Key</label>
              <span className="text-[10px] text-muted flex items-center gap-1">
                <Key size={10} /> Encrypted at rest
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                disabled={aiProvider === 'ollama'}
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder={aiProvider === 'ollama' ? 'No key required for local Ollama' : 'Enter your private API token'}
                className="flex-1 rounded-xl border border-card-border bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/30 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleTestAi}
                disabled={testingAi}
                className="rounded-xl border border-card-border bg-white/5 px-4 text-xs font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {testingAi && <Loader2 size={12} className="animate-spin" />}
                Test
              </button>
            </div>

            {aiTestResult && (
              <div className={`mt-2 flex items-center gap-2 rounded-lg border p-2.5 text-[11px] ${
                aiTestResult.success 
                  ? 'border-green-500/20 bg-green-500/5 text-green-300' 
                  : 'border-red-500/20 bg-red-500/5 text-red-300'
              }`}>
                {aiTestResult.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                <span>{aiTestResult.message}</span>
              </div>
            )}

            {aiProvider !== 'ollama' && (
              <div className="text-[10px] text-muted/80 leading-normal flex items-start gap-1 mt-1 bg-yellow-500/5 border border-yellow-500/10 p-2.5 rounded-lg">
                <ShieldAlert size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>
                  If you leave this empty, the system will fall back to using default global developer keys (if configured) for testing purposes.
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-accent-purple px-5 py-2.5 text-xs font-semibold text-white shadow-neon-purple hover:bg-accent-purple/90 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Save size={14} /> Save Configurations
            </>
          )}
        </button>
      </form>
    </>
  );
}

export default function SettingsPage() {
  const { user, userProfile, transactions } = useStock();

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export.');
      return;
    }

    // Convert transactions to CSV
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

  const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'Personal Investor';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="text-accent-purple" /> System Settings
        </h1>
        <p className="text-sm text-muted mt-1">Configure your personal profile and AI analysis settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-2xl font-bold text-accent-purple">
              {initials}
            </div>
            <h3 className="text-sm font-bold text-white mt-4">{displayName}</h3>
            <p className="text-xs text-muted mt-1">{user?.email?.endsWith('@stocksviewer.local') ? user.email.split('@')[0] : user?.email}</p>
            <span className="mt-4 rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-semibold text-green-400 border border-green-500/20">
              Verified Account
            </span>
          </div>

          {/* Export card */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-white tracking-wide border-b border-card-border pb-2 flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-accent-purple" /> EXPORT PORTFOLIO
            </h4>
            <p className="text-[11px] text-muted">
              Backup your transaction log containing Buy/Sell details, capital distribution, and average asset prices.
            </p>
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-card-border bg-white/5 py-2 text-xs font-semibold text-white hover:bg-white/10 hover:text-white transition-colors"
            >
              Export log as CSV
            </button>
          </div>
        </div>

        {/* Configurations Forms (Right) */}
        <div className="md:col-span-2 glass rounded-2xl p-6 space-y-6">
          {userProfile && user ? (
            <ProfileForm key={userProfile.id} userProfile={userProfile} user={user} />
          ) : (
            <div className="flex h-64 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-purple border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
