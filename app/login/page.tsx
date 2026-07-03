'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Sparkles, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setErrorMsg(error);
    }
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
            },
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });

        if (error) throw error;
        setSuccessMsg('Registration successful! Please check your email for a verification link.');
        setEmail('');
        setPassword('');
        setFullName('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md">
        {/* Decorative background glow elements */}
        <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-accent-purple/15 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-accent-blue/15 blur-3xl" />

        {/* Card Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-3xl p-8 shadow-2xl relative border border-card-border"
        >
          {/* Header Title */}
          <div className="flex flex-col items-center space-y-2 text-center pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-purple/10 text-accent-purple shadow-neon-purple/20">
              <TrendingUp size={24} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-3">
              {isSignUp ? 'Create an Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-muted">
              {isSignUp
                ? 'Sign up to sync your portfolio across all devices'
                : 'Enter your credentials to access your financial dashboard'}
            </p>
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-[11px] text-red-300"
            >
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-[11px] text-green-300"
            >
              <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[10px] text-muted font-medium">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-white/5 pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/30 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-muted font-medium">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  required
                  placeholder="yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-white/5 pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/30 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-muted font-medium">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    className="text-[10px] text-accent-purple hover:underline"
                    onClick={() => setErrorMsg('Reset password flow is not configured.')}
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-white/5 pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/30 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-accent-purple py-2.5 text-xs font-semibold text-white shadow-neon-purple hover:bg-accent-purple/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : isSignUp ? (
                <>
                  <Sparkles size={14} /> Create Account
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Toggle Switch */}
          <div className="mt-6 text-center text-xs">
            <span className="text-muted">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-accent-purple font-semibold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-purple border-t-transparent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
