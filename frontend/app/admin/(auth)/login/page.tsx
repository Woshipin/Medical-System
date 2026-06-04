"use client";

import React, { useState, useEffect } from 'react';
import {
  Mail, Lock, Activity, ArrowRight, Eye, EyeOff,
  AlertCircle, CheckCircle, X, Info, Loader2, Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/app/contexts/AdminAuthContext';

// ── Extracts the plain-text message from any backend response shape ───────────
const getBackendMessage = (result: any): string | null => {
  if (!result) return null;
  const msg = result.message ?? result.Message;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  return null;
};

// ── Extracts field-level errors: { "Email": "msg", "Password": "msg" } ───────
const getFieldErrors = (result: any): Record<string, string> => {
  const map: Record<string, string> = {};
  const errors = result?.errors ?? result?.Errors;
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return map;
  for (const [key, val] of Object.entries(errors)) {
    map[key.toLowerCase()] = Array.isArray(val) ? String((val as any[])[0]) : String(val);
  }
  return map;
};

// ── Already-logged-in redirect screen ────────────────────────────────────────
const AlreadyLoggedInAlert = () => {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.replace('/admin/dashboard'), 2000);
    return () => clearTimeout(t);
  }, [router]);
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
          <Info size={28} className="text-emerald-500" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 mb-1">Already Logged In</h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-5">
          You have an active session. Redirecting you to the dashboard.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full w-full">
          <Loader2 size={13} className="animate-spin" /> Returning to dashboard...
        </div>
      </div>
    </div>
  );
};

export default function AdminLoginPage() {
  const { login, isAuthenticated, isInitialized } = useAdminAuth();
  const router = useRouter();

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]   = useState(false);
  const [isLoading, setIsLoading]     = useState(false);

  // Success and error state variables matching response payload
  const [toastError, setToastError]   = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const emailBorderRed   = !!fieldErrors['email'];
  const passwordBorderRed = !!fieldErrors['password'];

  useEffect(() => {
    const savedEmail    = localStorage.getItem('adminRememberedEmail');
    const savedPassword = localStorage.getItem('adminRememberedPassword');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setToastError(null);
    setToastSuccess(null);

    setIsLoading(true);
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api';

    try {
      const response = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 404) throw new Error('API endpoint not found (404). Backend server might be offline.');
      const ct = response.headers.get('content-type');
      if (!ct?.toLowerCase().includes('application/json'))
        throw new Error(`Server returned a non-JSON response (Status: ${response.status}).`);

      const result = await response.json();
      const isSuccess = result?.success === true || result?.Success === true;

      if (response.ok && isSuccess && result?.data?.user && result?.data?.token) {
        if (rememberMe) {
          localStorage.setItem('adminRememberedEmail', email);
          localStorage.setItem('adminRememberedPassword', password);
        } else {
          localStorage.removeItem('adminRememberedEmail');
          localStorage.removeItem('adminRememberedPassword');
        }
        
        const rawUser = result.data.user;

        // Show successful login alert toast
        setToastSuccess(getBackendMessage(result) ?? 'Welcome back! You have successfully logged in.');

        // Delay updating session state and loading dashboard to display alert for 2 seconds
        setTimeout(() => {
          login({ ...rawUser, id: String(rawUser.id ?? rawUser.Id ?? '0') }, result.data.token);
          router.push('/admin/dashboard');
        }, 2000);

      } else {
        const fields = getFieldErrors(result);
        if (Object.keys(fields).length > 0) setFieldErrors(fields);
        setToastError(getBackendMessage(result) ?? 'Incorrect email or password.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setToastError(typeof err?.message === 'string' ? err.message : 'Cannot connect to server. Please check your connection.');
      setIsLoading(false);
    }
  };

  if (!isInitialized) return <div className="h-screen w-full bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700" />;
  if (isAuthenticated) return <AlreadyLoggedInAlert />;

  const inputCls = (isRed: boolean) =>
    `w-full pl-10 pr-10 py-2.5 text-sm font-medium rounded-xl outline-none transition-all border ${
      isRed
        ? 'bg-red-50 border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-red-900 placeholder:text-red-300'
        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400'
    }`;

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700 font-sans overflow-hidden px-4">

      {/* ── Toasts ──────────────────────────────────────────────────────────── */}
      <div className="fixed top-5 left-0 w-full flex flex-col items-center gap-2 z-50 pointer-events-none px-4">
        {toastError && (
          <div className="pointer-events-auto w-full max-sm bg-white/95 backdrop-blur-xl border-l-4 border-red-500 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
            <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={17} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-red-700">Login Failed</p>
              <p className="text-xs text-slate-600 mt-0.5 break-words">{toastError}</p>
            </div>
            <button type="button" onClick={() => setToastError(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
              <X size={15} />
            </button>
          </div>
        )}
        {toastSuccess && (
          <div className="pointer-events-auto w-full max-w-sm bg-white/95 backdrop-blur-xl border-l-4 border-emerald-500 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
            <CheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={17} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-emerald-700">Login Successful</p>
              <p className="text-xs text-slate-600 mt-0.5 break-words">{toastSuccess}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Branding ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center mb-5">
        <div className="bg-white p-2.5 rounded-2xl shadow-xl mb-3">
          <Activity className="w-7 h-7 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">MedicarePro</h1>
        <p className="text-emerald-100 text-xs mt-0.5 opacity-90">Admin Management System</p>
      </div>

      {/* ── Card ─────────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-[400px] bg-white rounded-[1.75rem] shadow-2xl px-7 py-6 border border-white/20">
        <div className="text-center mb-5">
          <h2 className="text-lg font-extrabold text-slate-800">Login Dashboard</h2>
          <p className="text-slate-400 text-xs mt-0.5 font-medium">Please enter your credentials</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className={`absolute left-3.5 z-10 ${emailBorderRed ? 'text-red-400' : 'text-slate-400'}`} size={16} />
              <input
                type="email" name="email" id="email" autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors(p => { const n = { ...p }; delete n['email']; return n; });
                }}
                className={inputCls(emailBorderRed)}
                placeholder="admin@medicarepro.com"
              />
            </div>
            {fieldErrors['email'] && (
              <p className="text-[10px] text-red-500 mt-1 ml-1 font-semibold">{fieldErrors['email']}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className={`absolute left-3.5 z-10 ${passwordBorderRed ? 'text-red-400' : 'text-slate-400'}`} size={16} />
              <input
                type={showPassword ? 'text' : 'password'} name="password" id="password" autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors(p => { const n = { ...p }; delete n['password']; return n; });
                }}
                className={inputCls(passwordBorderRed)}
                placeholder="Enter your password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-emerald-600 transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors['password'] && (
              <p className="text-[10px] text-red-500 mt-1 ml-1 font-semibold">{fieldErrors['password']}</p>
            )}
          </div>

          {/* Remember me */}
          <div className="flex items-center pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${rememberMe ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300 group-hover:border-emerald-400'}`}
              >
                {rememberMe && <Check size={11} className="text-white" />}
              </div>
              <input type="checkbox" className="hidden" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
              <span className="text-xs font-medium text-slate-600 select-none group-hover:text-emerald-700 transition-colors">
                Remember me
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || toastSuccess !== null}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-80"
          >
            {isLoading || toastSuccess ? (
              <span className="flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" />
                {toastSuccess ? 'Redirecting...' : 'Signing in...'}
              </span>
            ) : (
              <>Sign In to Dashboard <ArrowRight size={15} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}