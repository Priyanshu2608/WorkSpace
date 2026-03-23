'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');
      
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-success/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl z-10 border border-surface-dim/20 mt-8 mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-on-surface mb-2">Create Account</h1>
          <p className="text-on-surface-variant font-medium">Join WorkSpace and start building.</p>
        </div>

        <div className="mb-6 flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                setLoading(true);
                const res = await fetch('/api/auth/google', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ credential: credentialResponse.credential }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Google signup failed');
                router.push('/dashboard');
                router.refresh();
              } catch (err: any) {
                setError(err.message);
                setLoading(false);
              }
            }}
            onError={() => setError('Google signup failed')}
            shape="rectangular"
            theme="outline"
            text="signup_with"
          />
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-surface-dim/30"></div>
          <span className="px-4 text-xs uppercase tracking-wider font-bold text-on-surface-variant">Or sign up with email</span>
          <div className="flex-grow border-t border-surface-dim/30"></div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 text-error-dark border border-error/20 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-dim border-2 border-transparent focus:border-primary focus:bg-white focus:outline-none transition-all font-medium text-on-surface"
              placeholder="Jane Doe"
              required
            />
          </div>

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
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-sm active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-on-surface-variant">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary-hover font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
