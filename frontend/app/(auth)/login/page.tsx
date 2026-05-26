"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Leaf, Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, 
  Loader2, AlertCircle, CheckCircle, X, CheckCircle2, Info, Check
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

const parseBackendError = (result: any): string => {
  if (!result) return "Login failed. Please check your credentials."; 
  const errors = result.errors || result.Errors || result.data || result.Data; 
  if (errors) { 
    if (Array.isArray(errors)) return errors.join(" | "); 
    if (typeof errors === 'object') { 
      return Object.values(errors).flatMap((err: any) => Array.isArray(err) ? err : [err]).join(" | "); 
    } 
  } 
  return result.message || result.Message || "Login failed. Please check your credentials."; 
}; 

const AlreadyLoggedInAlert = () => { 
  const router = useRouter(); 
  useEffect(() => { 
    const timer = setTimeout(() => router.replace('/home'), 2000); 
    return () => clearTimeout(timer); 
  }, [router]); 

  return ( 
    <div className="h-screen w-full bg-gradient-to-br from-teal-900 via-emerald-800 to-emerald-500 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="relative z-50 bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 border border-white/20 flex flex-col items-center text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner border border-emerald-100">
          <Info size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2">Already Logged In</h2>
        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
          You currently have an active session. No need to log in again.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full w-full">
          <Loader2 size={14} className="animate-spin" /> Returning to homepage...
        </div>
      </div>
    </div>
  );
};

export default function LoginPage() { 
  const router = useRouter(); 
  const { login, isAuthenticated, isInitialized } = useAuth(); 

  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [showPassword, setShowPassword] = useState(false); 
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false); 
  const [apiErrorMsg, setApiErrorMsg] = useState<string | null>(null); 
  const [successMsg, setSuccessMsg] = useState<string | null>(null); 
  const [hasSubmitted, setHasSubmitted] = useState(false); 

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); 
  const isValidPassword = password.trim().length > 0; 

  // ==========================================
  // 读取 Remember Me 记忆数据
  // ==========================================
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true); 
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    setHasSubmitted(true); 

    if (!isValidEmail || !isValidPassword) return; 

    setIsLoading(true); 
    setApiErrorMsg(null); 
    setSuccessMsg(null); 

    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5062/api"; 

    try { 
      const response = await fetch(`${BASE_URL}/auth/login`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email, password }),
        credentials: 'include', // 必须加上，允许后端颁发 Cookie
      }); 

      const result = await response.json(); 
      const isSuccess = result?.success === true || result?.Success === true; 

      if (response.ok && isSuccess && result?.data?.user) { 
        // 【优化】：删除繁冗的 Token 提取和重组，直接取后端干净的用户实体并记录登录态
        const rawUserData = result.data.user;
        const formattedUser = { 
            ...rawUserData, 
            id: String(rawUserData.id || rawUserData.Id || "0") 
        }; 

        // 维护 Remember me 缓存
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
          localStorage.setItem("rememberedPassword", password);
        } else {
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("rememberedPassword");
        }

        login(formattedUser); // 注入全局状态，鉴权及令牌由浏览器 Cookie 全权托管
        setSuccessMsg("Login successful! Redirecting to dashboard..."); 
        setTimeout(() => router.push('/home'), 2000); 

      } else { 
        // 【优化】：错误处理拦截简化
        const errorMsg = result?.message || result?.Message || "";

        if (errorMsg === "请前往后台系统登录") {
          setApiErrorMsg("Your account is not a patient."); 
          setIsLoading(false); 
          setTimeout(() => router.push('/admin/login'), 2500); 
        } else { 
          setApiErrorMsg(parseBackendError(result)); 
          setIsLoading(false); 
        }
      } 
    } catch (err) { 
      console.error("Fetch Error:", err); 
      setApiErrorMsg("Unable to connect to the server. Please ensure the backend is running."); 
      setIsLoading(false); 
    } 
  }; 

  if (!isInitialized) return <div className="h-screen w-full bg-gradient-to-br from-teal-900 via-emerald-800 to-emerald-500"></div>; 
  if (isAuthenticated) return <AlreadyLoggedInAlert />; 

  return ( 
    <div className="h-screen w-full bg-gradient-to-br from-teal-900 via-emerald-800 to-emerald-500 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* 提示层 */}
      <div className="fixed top-6 left-0 w-full flex justify-center z-50 pointer-events-none px-4">
        {apiErrorMsg && ( 
          <div className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-xl border-l-4 border-red-500 text-slate-800 px-5 py-4 rounded-xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-top-6 fade-in duration-300">
            <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-red-700">Login Failed</h4>
              <p className="text-sm text-slate-600 mt-1">{apiErrorMsg}</p>
            </div>
            <button onClick={() => setApiErrorMsg(null)} className="text-slate-400 hover:text-slate-600 p-1 shrink-0"><X size={18} /></button>
          </div>
        )}

        {successMsg && (
          <div className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-xl border-l-4 border-emerald-500 text-slate-800 px-5 py-4 rounded-xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-top-6 fade-in duration-300">
            <CheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={20} />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-emerald-700">Login Successful</h4>
              <p className="text-sm text-slate-600 mt-1">{successMsg}</p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/30 rounded-full mix-blend-overlay filter blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-400/20 rounded-full mix-blend-overlay filter blur-3xl opacity-40 animate-pulse delay-700"></div>

      <Link 
        href="/home" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white hover:text-teal-900 transition-all text-sm shadow-lg"
      >
        <ArrowLeft size={16} />
        <span className="font-medium hidden sm:block">Back to Home</span>
      </Link>

      <div className="relative z-10 bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[600px] max-h-[92vh] border border-white/50">
        
        {/* 表单区 */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 lg:p-16 flex flex-col justify-center bg-white overflow-y-auto custom-scrollbar">
          <div className="mb-8">
             <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full w-fit">
                <div className="p-1.5 bg-emerald-500 rounded-full text-white">
                    <Leaf size={14} fill="currentColor" />
                </div>
                <span className="text-sm font-bold text-emerald-800 tracking-tight">GreenLife Med</span>
             </div>
             <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome Back</h2>
             <p className="text-slate-500 text-sm">Please log in to your patient portal account.</p>
          </div>

          <form className="space-y-5" onSubmit={handleLoginSubmit} noValidate>
            
            <div className="group flex flex-col">
               <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500">Email Address</label>
               <div className="relative flex items-center">
                  <Mail className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidEmail ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                  <input 
                    type="email" 
                    name="email" 
                    id="email" 
                    autoComplete="username" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="example@mail.com" 
                    className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all border ${
                        hasSubmitted && !isValidEmail 
                        ? 'bg-red-50 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 placeholder:text-red-300' 
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  {isValidEmail && <CheckCircle2 className="absolute right-3 text-emerald-500" size={16} />}
               </div>
               {hasSubmitted && !isValidEmail && <span className="text-red-500 text-[11px] mt-1.5 ml-1 font-medium">Please enter a valid email address.</span>}
            </div>

            <div className="group flex flex-col">
               <div className="flex justify-between items-center mb-1.5">
                   <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                   <Link href="#" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline">Forgot password?</Link>
               </div>
               <div className="relative flex items-center">
                  <Lock className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidPassword ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="password" 
                    id="password" 
                    autoComplete="current-password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className={`w-full pl-10 pr-10 py-3 text-sm rounded-xl outline-none transition-all border ${
                        hasSubmitted && !isValidPassword 
                        ? 'bg-red-50 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 placeholder:text-red-300' 
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-400 hover:text-emerald-600 p-1">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
               </div>
               {hasSubmitted && !isValidPassword && <span className="text-red-500 text-[11px] mt-1.5 ml-1 font-medium">Please enter your password.</span>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border flex items-center justify-center transition-all ${
                  rememberMe ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300 group-hover:border-emerald-400'
                }`}>
                  {rememberMe && <Check size={12} className="text-white sm:w-3.5 sm:h-3.5" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-xs sm:text-sm font-medium text-slate-600 group-hover:text-emerald-700 transition-colors select-none">
                  Remember me
                </span>
              </label>
            </div>

            <button 
                type="submit" 
                disabled={isLoading || successMsg !== null} 
                className="w-full mt-2 py-3.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-80"
            >
                {isLoading || successMsg ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {successMsg ? "Redirecting..." : "Logging in..."}
                  </>
                ) : (
                  <>
                    Log In Now
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <p className="text-slate-500">
              Don't have an account? <Link href="/register" className="text-emerald-600 font-bold hover:underline transition-all">Create one now</Link>
            </p>
          </div>
        </div>

        {/* 右侧海报区 */}
        <div className="hidden md:block md:w-1/2 relative overflow-hidden bg-slate-900">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80')] bg-cover bg-center transform hover:scale-105 transition-transform duration-[20s] opacity-80"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/95 via-teal-900/60 to-transparent mix-blend-multiply"></div>
           
           <div className="absolute inset-0 p-12 flex flex-col justify-end text-white z-10">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl mb-4 shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                     <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                     </span>
                     <span className="font-semibold text-emerald-100 text-xs tracking-wide uppercase">System Operational</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Patient-Centric Technology</h3>
                  <p className="text-emerald-50 text-opacity-90 leading-relaxed text-sm">
                    Experience seamless medical management. Your data is protected by military-grade encryption protocols.
                  </p>
              </div>
           </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}