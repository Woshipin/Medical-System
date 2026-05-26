"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Leaf, Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft,
  CheckCircle2, ArrowRight, Loader2, AlertCircle, X, ChevronDown, CheckCircle,
} from "lucide-react";

// --- 辅助函数：解析后端多重嵌套错误（全面适配 C# FluentValidation 和 Identity） ---
const parseBackendError = (result: any): string => {
  if (!result) return "Registration failed. Please check your inputs.";

  const errors = result.errors || result.Errors || result.data || result.Data;
  if (errors) {
    if (Array.isArray(errors)) return errors.join(" | ");
    if (typeof errors === 'object') {
      return Object.values(errors).flatMap((err: any) => Array.isArray(err) ? err : [err]).join(" | ");
    }
  }

  return result.message || result.Message || "Registration failed.";
};

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+65");
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    role: 3,
    genderId: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiErrorMsg, setApiErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) setIsCountryOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isValidName = formData.fullName.trim().length > 0;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isValidPassword = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(formData.password);
  const isValidPhone = countryCode === "+65" ? /^[89]\d{7}$/.test(formData.phone) : /^1\d{8,9}$/.test(formData.phone);

  const [completionStep, setCompletionStep] = useState(0);

  useEffect(() => {
    let step = 0;
    if (isValidName) step++;
    if (isValidPhone) step++;
    if (isValidEmail) step++;
    if (isValidPassword) step++;
    setCompletionStep(step);
  }, [formData, countryCode, isValidName, isValidPhone, isValidEmail, isValidPassword]);

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    if (!isValidName || !isValidPhone || !isValidEmail || !isValidPassword) return;

    setIsLoading(true);
    setApiErrorMsg(null);
    setSuccessMsg(null);

    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5062/api";

    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          genderId: formData.genderId,
          role: formData.role,
          phoneNumber: `${countryCode}${formData.phone}`,
        }),
        // 【优化】：注册不一定需要带着现有的身份凭证，不过带了也无妨
      });

      // 【安全处理】：即使是 400 Bad Request（密码错误等），C# 后端依然返回的是 JSON，千万不能抛异常
      const result = await response.json(); 

      if (response.ok && (result.success || result.Success)) {
        setSuccessMsg("Registration successful! You can now log in. Redirecting...");
        setTimeout(() => router.push("/login"), 1800); 
      } else {
        // 【优化】：处理所有从后端抛出的详细验证错误并拦截
        setApiErrorMsg(parseBackendError(result));
      }
    } catch (err: any) {
      setApiErrorMsg(err.message || "Cannot connect to server. Please ensure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-teal-900 via-emerald-800 to-emerald-500 flex items-center justify-center p-4 relative overflow-hidden">
      
      <div className="fixed top-6 left-0 w-full flex justify-center z-50 pointer-events-none px-4">
        {apiErrorMsg && (
          <div className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-xl border-l-4 border-red-500 text-slate-800 px-5 py-4 rounded-xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-top-6 fade-in duration-300">
            <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-red-700">Registration Failed</h4>
              <p className="text-sm text-slate-600 mt-1 break-words">{apiErrorMsg}</p>
            </div>
            <button onClick={() => setApiErrorMsg(null)} className="text-slate-400 hover:text-slate-600 p-1 shrink-0"><X size={18} /></button>
          </div>
        )}

        {successMsg && (
          <div className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-xl border-l-4 border-emerald-500 text-slate-800 px-5 py-4 rounded-xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-top-6 fade-in duration-300">
            <CheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={20} />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-emerald-700">Registration Successful</h4>
              <p className="text-sm text-slate-600 mt-1">{successMsg}</p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-500/30 rounded-full mix-blend-overlay filter blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-400/20 rounded-full mix-blend-overlay filter blur-3xl opacity-40 animate-pulse delay-700"></div>

      <Link href="/home" className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white hover:text-teal-900 transition-all text-sm shadow-lg">
        <ArrowLeft size={16} />
        <span className="font-medium hidden sm:block">Back to Home</span>
      </Link>

      <div className="relative z-10 bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[600px] max-h-[92vh] border border-white/50">
        <div className="hidden md:flex md:w-5/12 relative flex-col text-white bg-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-60"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-teal-900/90 via-emerald-900/80 to-slate-900/95"></div>
          <div className="relative z-10 p-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-6 text-emerald-400">
                <Leaf size={28} />
                <span className="text-2xl font-bold tracking-tight text-white">GreenLife<span className="text-emerald-400">Med</span></span>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-4xl font-bold leading-tight">Join the future of <br /><span className="text-emerald-400">Healthcare</span></h3>
              <div className="space-y-4">
                {["24/7 Access to Medical Records", "Instant Appointment Booking", "Secure Direct Messaging"].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 text-emerald-50">
                    <CheckCircle2 className="text-emerald-400" size={18} />
                    <span className="text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-6">© 2026 GreenLife Medical Systems.</p>
          </div>
        </div>

        <div className="md:w-7/12 p-8 sm:p-10 lg:p-12 flex flex-col justify-center w-full bg-white overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <div className="flex items-end justify-between gap-4 mb-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">Create Account</h2>
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 mb-1">
                <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">Step {completionStep}/4</span>
              </div>
            </div>
            <div className="flex gap-1.5 h-1.5 mt-2 rounded-full overflow-hidden w-full bg-slate-100">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className={`flex-1 transition-all duration-500 ${completionStep >= step ? "bg-emerald-500" : "bg-transparent"}`}></div>
              ))}
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleRegisterSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="group flex flex-col">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500">Full Name</label>
                <div className="relative flex items-center">
                  <User className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidName ? "text-red-400" : "text-slate-400"}`} size={18} />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    placeholder="John Doe"
                    className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all border ${
                      hasSubmitted && !isValidName ? "bg-red-50 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900" : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                    }`}
                  />
                  {isValidName && <CheckCircle2 className="absolute right-3 text-emerald-500" size={16} />}
                </div>
                {hasSubmitted && !isValidName && <span className="text-red-500 text-[11px] mt-1.5 ml-1 font-medium">Please enter your full name.</span>}
              </div>

              <div className="group flex flex-col">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500">Phone Number</label>
                <div className={`relative flex items-center rounded-xl transition-all border ${hasSubmitted && !isValidPhone ? "bg-red-50 border-red-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20" : "bg-slate-50 border-slate-200 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"}`}>
                  <div className="relative" ref={countryRef}>
                    <Phone className={`absolute left-3.5 top-3.5 z-10 pointer-events-none ${hasSubmitted && !isValidPhone ? "text-red-400" : "text-slate-400"}`} size={18} />

                    <button
                      type="button"
                      onClick={() => setIsCountryOpen(!isCountryOpen)}
                      className={`flex items-center gap-1.5 pl-10 pr-2 py-3 border-r outline-none transition-colors rounded-l-xl ${
                        hasSubmitted && !isValidPhone ? "border-red-200 hover:bg-red-100/50" : "border-slate-200 hover:bg-slate-100/50"
                      }`}
                    >
                      <span className={`text-sm font-bold ${hasSubmitted && !isValidPhone ? "text-red-900" : "text-slate-700"}`}>{countryCode}</span>
                      <ChevronDown size={14} className={`${hasSubmitted && !isValidPhone ? "text-red-400" : "text-slate-400"} transition-transform duration-300 ${isCountryOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isCountryOpen && (
                      <div className="absolute top-full left-0 mt-2 w-36 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {[{ name: "Singapore", code: "+65" }, { name: "Malaysia", code: "+60" }].map((item) => (
                          <div
                            key={item.code}
                            onClick={() => {
                              setCountryCode(item.code);
                              setIsCountryOpen(false);
                              const limit = item.code === "+65" ? 8 : 10;
                              if (formData.phone.length > limit) handleChange("phone", formData.phone.substring(0, limit));
                            }}
                            className={`px-4 py-3 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                              countryCode === item.code ? "bg-emerald-50 text-emerald-600 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-emerald-500"
                            }`}
                          >
                            <span>{item.name}</span>
                            <span className="text-[10px] font-medium opacity-50">{item.code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ""); 
                      const limit = countryCode === "+65" ? 8 : 10; 
                      handleChange("phone", val.substring(0, limit)); 
                    }}
                    maxLength={countryCode === "+65" ? 8 : 10} 
                    placeholder={countryCode === "+65" ? "8123 4567" : "12 345 6789"}
                    className={`w-full pl-3 pr-8 py-3 text-sm bg-transparent outline-none ${hasSubmitted && !isValidPhone ? "text-red-900 placeholder:text-red-300" : "text-slate-900 placeholder:text-slate-400"}`}
                  />
                  {isValidPhone && <CheckCircle2 className="absolute right-3 text-emerald-500" size={16} />}
                </div>
                {hasSubmitted && !isValidPhone && (
                  <span className="text-red-500 text-[11px] mt-1.5 ml-1 font-medium animate-in slide-in-from-top-1">
                    {countryCode === "+65" ? "Singapore numbers must be 8 digits." : "Malaysia numbers must be 9-10 digits."}
                  </span>
                )}
              </div>
            </div>

            <div className="group flex flex-col">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500">Email Address</label>
              <div className="relative flex items-center">
                <Mail className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidEmail ? "text-red-400" : "text-slate-400"}`} size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all border ${
                    hasSubmitted && !isValidEmail ? "bg-red-50 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 placeholder:text-red-300" : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400"
                  }`}
                />
                {isValidEmail && <CheckCircle2 className="absolute right-3 text-emerald-500" size={16} />}
              </div>
              {hasSubmitted && !isValidEmail && <span className="text-red-500 text-[11px] mt-1.5 ml-1 font-medium">Please enter a valid email address.</span>}
            </div>

            <div className="group flex flex-col">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500">Password</label>
              <div className="relative flex items-center">
                <Lock className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidPassword ? "text-red-400" : "text-slate-400"}`} size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Min 6 chars, letters & numbers"
                  className={`w-full pl-10 pr-10 py-3 text-sm rounded-xl outline-none transition-all border ${
                    hasSubmitted && !isValidPassword ? "bg-red-50 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 placeholder:text-red-300" : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400"
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-400 hover:text-emerald-600 p-1">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {hasSubmitted && !isValidPassword && <span className="text-red-500 text-[11px] mt-1.5 ml-1 font-medium">Password must be at least 6 characters, including letters and numbers.</span>}
            </div>

            <button
              type="submit"
              disabled={isLoading || successMsg !== null}
              className="w-full mt-4 py-3.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30 active:scale-[0.98]"
            >
              {isLoading || successMsg ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {successMsg ? "Creating..." : "Processing..."}
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account? <Link href="/login" className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline">Log In</Link>
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