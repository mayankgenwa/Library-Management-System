import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Shield, ArrowRight } from 'lucide-react';
import { User } from '../types.js';

interface AuthCardProps {
  onAuthSuccess: (token: string, user: User) => void;
}

export default function AuthCard({ onAuthSuccess }: AuthCardProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'member' | 'librarian'>('member');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick seed logins
  const handleQuickLogin = async (type: 'librarian' | 'member') => {
    setLoading(true);
    setError(null);
    const targetEmail = type === 'librarian' ? 'eleanor@library.org' : 'julian@member.com';
    const targetPassword = 'password123';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onAuthSuccess(data.token, data.user);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const bodyObj = isLogin 
      ? { email, password } 
      : { name, email, password, role };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (isLogin) {
          onAuthSuccess(data.token, data.user);
        } else {
          // After successful register, auto log in
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const loginData = await loginRes.json();
          if (loginRes.ok && loginData.success) {
            onAuthSuccess(loginData.token, loginData.user);
          } else {
            setIsLogin(true);
            setError('Account created! Please log in.');
          }
        }
      } else {
        setError(data.message || 'An error occurred');
      }
    } catch (err) {
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-card" className="w-full max-w-md bg-[#faf9f5] border border-stone-200 rounded-xl p-8 shadow-sm transition-all duration-300">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-serif text-stone-900 tracking-tight font-medium">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="text-xs text-stone-500 mt-1 font-sans">
          {isLogin ? 'Access books, records, and librarian tools' : 'Register as a library member or administrator'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <UserIcon size={14} />
              </span>
              <input
                id="auth-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                required
                className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-md text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
              <Mail size={14} />
            </span>
            <input
              id="auth-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="@gmail.com"
              required
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-md text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
              <Lock size={14} />
            </span>
            <input
              id="auth-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-md text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>
        </div>

        {!isLogin && (
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-2">Select System Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="role-member-btn"
                type="button"
                onClick={() => setRole('member')}
                className={`py-2 px-3 border rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  role === 'member'
                    ? 'border-stone-800 bg-stone-800 text-white'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <UserIcon size={12} />
                Library Member
              </button>
              <button
                id="role-librarian-btn"
                type="button"
                onClick={() => setRole('librarian')}
                className={`py-2 px-3 border rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  role === 'librarian'
                    ? 'border-stone-800 bg-stone-800 text-white'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Shield size={12} />
                Librarian
              </button>
            </div>
          </div>
        )}

        <button
          id="auth-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#1b3d2f] hover:bg-[#153025] text-white font-medium rounded-md text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
        >
          {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          {!loading && <ArrowRight size={14} />}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#faf9f5] px-2 text-stone-400">or use demo accounts</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          id="demo-member-btn"
          onClick={() => handleQuickLogin('member')}
          disabled={loading}
          className="py-2 px-3 border border-stone-200 hover:border-stone-400 bg-white rounded-md text-xs text-stone-700 font-medium transition-colors text-left"
        >
          <div className="text-[10px] text-stone-400 font-normal">Member Account</div>
          <span className="text-stone-800 font-semibold block truncate">Julian Barnes</span>
          <span className="text-[10px] block text-stone-500 truncate">julian@member.com</span>
        </button>

        <button
          id="demo-librarian-btn"
          onClick={() => handleQuickLogin('librarian')}
          disabled={loading}
          className="py-2 px-3 border border-stone-200 hover:border-stone-400 bg-white rounded-md text-xs text-stone-700 font-medium transition-colors text-left"
        >
          <div className="text-[10px] text-stone-400 font-normal">Librarian Account</div>
          <span className="text-stone-800 font-semibold block truncate">Eleanor Vance</span>
          <span className="text-[10px] block text-stone-500 truncate">eleanor@library.org</span>
        </button>
      </div>

      <div className="text-center">
        <button
          id="auth-toggle-mode-btn"
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-xs text-stone-600 hover:text-stone-900 underline underline-offset-4"
        >
          {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
        </button>
      </div>
    </div>
  );
}
