"use client";

import React, { useState } from 'react';
import { Mail, Lock, Activity, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle, X, CheckCircle2, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/app/contexts/AdminAuthContext'; 

// --- 独立的绿色提示组件：防止重复登录 ---
const AlreadyLoggedInAlert = () => {
  const router = useRouter();
  React.useEffect(() => {
    const timer = setTimeout(() => router.replace('/admin/dashboard'), 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700 font-sans overflow-hidden">
      <div className="relative z-50 bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 border border-white/20 flex flex-col items-center text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner border border-emerald-100">
          <Info size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2">Already Logged In</h2>
        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
          You currently have an active session. No need to login again.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full w-full">
          <Loader2 size={14} className="animate-spin" /> Returning to dashboard...
        </div>
      </div>
    </div>
  );
};

export default function AdminLoginPage() {
  const { login, isAuthenticated, isInitialized } = useAdminAuth(); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiErrorMsg, setApiErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = password.trim().length > 0;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    if (!isValidEmail || !isValidPassword) return;

    setIsLoading(true);
    setApiErrorMsg(null);
    setSuccessMsg(null);

    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5062/api";

    try {
      const response = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        login(result.data.user, result.data.token);
        setSuccessMsg("Welcome back! Accessing dashboard...");
      } else {
        setApiErrorMsg(result.message || "Invalid admin credentials.");
      }
    } catch (err) {
      setApiErrorMsg("Cannot connect to server. Please check your connection.");
    } finally {
      if (!successMsg) setIsLoading(false);
    }
  };

  // 1. 初始化中
  if (!isInitialized) return <div className="h-screen w-full bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700"></div>;

  // 2. 如果系统发现你已经登录了，展示绿色组件拦截
  if (isAuthenticated) {
    return <AlreadyLoggedInAlert />;
  }

  // 3. 正常显示登录表单 
  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700 font-sans overflow-hidden">
      
      <div className="fixed top-6 left-0 w-full flex justify-center z-50 pointer-events-none px-4">
        {apiErrorMsg && (
          <div className="pointer-events-auto w-full max-w-sm bg-white/95 backdrop-blur-xl border-l-4 border-red-500 text-slate-800 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-6 fade-in duration-300">
            <AlertCircle className="text-red-600 mt-0.5" size={18} />
            <div className="flex-1">
              <h4 className="font-bold text-xs text-red-700">Login Failed</h4>
              <p className="text-xs text-slate-600 mt-0.5">{apiErrorMsg}</p>
            </div>
            <button onClick={() => setApiErrorMsg(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={16} /></button>
          </div>
        )}
      </div>

      <div className="w-full max-w-[420px] z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white p-2.5 rounded-2xl shadow-xl mb-3">
            <Activity className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight text-center">MedicarePro</h1>
          <p className="text-emerald-50 text-xs mt-1 opacity-90">Admin Management System</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-white/20 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-extrabold text-slate-800">Welcome Back</h2>
            <p className="text-slate-500 text-xs mt-1 font-medium">Please enter your credentials</p>
          </div>

          <form className="space-y-4" onSubmit={handleLoginSubmit} noValidate>
            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative flex items-center">
                <Mail className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidEmail ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 text-sm font-medium rounded-xl outline-none transition-all border ${
                    hasSubmitted && !isValidEmail 
                    ? 'bg-red-50 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 placeholder:text-red-300' 
                    : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400'
                  }`}
                  placeholder="admin@medicarepro.com"
                />
              </div>
            </div>

            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative flex items-center">
                <Lock className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidPassword ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 text-sm font-medium rounded-xl outline-none transition-all border ${
                    hasSubmitted && !isValidPassword 
                    ? 'bg-red-50 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 placeholder:text-red-300' 
                    : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || successMsg !== null}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 text-sm disabled:opacity-80"
            >
              {isLoading || successMsg ? (
                  <span className="flex items-center gap-2">Processing...</span>
              ) : (
                  <>Sign In to Dashboard <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-xs font-medium">
              New administrator?{' '}
              <Link href="/admin/register" className="font-extrabold text-emerald-600 hover:underline transition-all">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}