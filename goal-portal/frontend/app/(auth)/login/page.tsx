'use client';

import { useState } from 'react';
import { Target, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand gradient (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand via-primary-container to-brand-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZG90cyIgeD0iMCIgeT0iMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNkb3RzKSIvPjwvc3ZnPg==')] opacity-60" />
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-8">
            <Target size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">GoalTrack</h1>
          <p className="text-xl text-white/80 font-medium mb-8">Set. Track. Achieve.</p>

          {/* Decorative progress chart illustration */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 w-full max-w-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-white/70 text-xs font-medium">
                <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span>
              </div>
              <div className="flex items-end gap-3 h-24">
                <div className="flex-1 bg-white/20 rounded-t-md" style={{ height: '30%' }} />
                <div className="flex-1 bg-white/30 rounded-t-md" style={{ height: '55%' }} />
                <div className="flex-1 bg-white/40 rounded-t-md" style={{ height: '75%' }} />
                <div className="flex-1 bg-white/60 rounded-t-md" style={{ height: '95%' }} />
              </div>
              <p className="text-white/60 text-xs text-center">Quarterly Progress Overview</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="bg-brand rounded-lg p-1.5">
              <Target size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-brand">GoalTrack</span>
          </div>

          <h2 className="text-2xl font-semibold text-text-primary mb-2">Welcome back</h2>
          <p className="text-sm text-text-secondary mb-8">Sign in to your workspace</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary" htmlFor="login-email">
                Work email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full border border-border rounded-md px-4 py-3 text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-border rounded-md px-4 py-3 pr-12 text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary hover:text-text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-danger-light border border-danger/20 rounded-md px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark text-white py-3 rounded-lg font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6">
            <a href="#" className="text-sm text-text-secondary hover:text-brand font-medium transition-colors">
              Forgot password?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
