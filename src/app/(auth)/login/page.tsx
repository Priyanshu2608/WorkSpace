'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login');
      
      router.push('/dashboard');
      router.refresh(); // Force a full navigation refresh
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-success/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl z-10 border border-surface-dim/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-on-surface mb-2">Welcome back</h1>
          <p className="text-on-surface-variant font-medium">Log in to your continuous workspace.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 text-error-dark border border-error/20 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-dim border-2 border-transparent focus:border-primary focus:bg-white focus:outline-none transition-all font-medium text-on-surface"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-dim border-2 border-transparent focus:border-primary focus:bg-white focus:outline-none transition-all font-medium text-on-surface"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-sm active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-on-surface-variant">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary hover:text-primary-hover font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
