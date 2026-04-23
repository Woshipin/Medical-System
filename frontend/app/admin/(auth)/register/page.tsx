"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mail, Lock, User, Activity, ArrowLeft, CheckCircle2,
  Eye, EyeOff, ShieldCheck, ChevronDown, AlertCircle,
  X, CheckCircle, Loader2, ArrowRight, Phone
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Phone Number States
  const [countryCode, setCountryCode] = useState("+65");
  const [isCountryCodeOpen, setIsCountryCodeOpen] = useState(false);
  const countryCodeRef = useRef<HTMLDivElement>(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  const [role, setRole] = useState("");
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [apiErrorMsg, setApiErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const roleOptions = [
    { value: "superadmin", label: "Super Admin" },
    { value: "admin", label: "Admin" },
    { value: "doctor", label: "Doctor" },
  ];

  const countryCodes = [
    { code: "+65", label: "SG (+65)" },
    { code: "+60", label: "MYR (+60)" }
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setIsRoleOpen(false);
      }
      if (countryCodeRef.current && !countryCodeRef.current.contains(event.target as Node)) {
        setIsCountryCodeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isValidName = fullName.trim().length > 0;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidRole = role !== "";
  const isValidPassword = /^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
  
  // 【优化项 1】：动态判断手机号长度是否合法
  const isValidPhone = countryCode === "+65" 
    ? phoneNumber.length === 8 
    : (phoneNumber.length === 9 || phoneNumber.length === 10);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    if (!isValidName || !isValidEmail || !isValidRole || !isValidPassword || !isValidPhone)
      return;

    setIsLoading(true);
    setApiErrorMsg(null);
    setSuccessMsg(null);

    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5062/api";

    try {
      const response = await fetch(`${BASE_URL}/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fullName, 
          email, 
          role, 
          password,
          phoneNumber: `${countryCode}${phoneNumber}`
        }),
      });

      const result = await response.json();
      const isSuccess = result?.success === true || result?.Success === true;

      if (response.ok && isSuccess) {
        setSuccessMsg("Registration successful! Redirecting to login...");
        setTimeout(() => router.push("/admin/login"), 2000);
      } else {
        const serverErrors = result?.errors || result?.Errors;
        let errorMessage = "Registration failed.";
        
        if (Array.isArray(serverErrors)) {
            errorMessage = serverErrors.join(" | ");
        } else if (result?.message || result?.Message) {
            errorMessage = result.message || result.Message;
        } else if (serverErrors && typeof serverErrors === 'object') {
            errorMessage = Object.values(serverErrors).flat().join(" | ");
        }
        
        setApiErrorMsg(errorMessage);
        setIsLoading(false);
      }
    } catch (err: any) {
      setApiErrorMsg("Cannot connect to server. Please check your backend connection.");
      setIsLoading(false);
    } 
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700 font-sans overflow-hidden">
      <div className="fixed top-6 left-0 w-full flex justify-center z-50 pointer-events-none px-4">
        {apiErrorMsg && (
          <div className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-xl border-l-4 border-red-500 text-slate-800 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-6 fade-in duration-300">
            <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={18} />
            <div className="flex-1">
              <h4 className="font-bold text-xs text-red-700">Registration Failed</h4>
              <p className="text-xs text-slate-600 mt-0.5 break-words">{apiErrorMsg}</p>
            </div>
            <button onClick={() => setApiErrorMsg(null)} className="text-slate-400 hover:text-slate-600 p-1 shrink-0"><X size={16} /></button>
          </div>
        )}
        {successMsg && (
          <div className="pointer-events-auto w-full max-w-sm bg-white/95 backdrop-blur-xl border-l-4 border-emerald-500 text-slate-800 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-6 fade-in duration-300">
            <CheckCircle className="text-emerald-600 mt-0.5" size={18} />
            <div className="flex-1">
              <h4 className="font-bold text-xs text-emerald-700">Registration Successful</h4>
              <p className="text-xs text-slate-600 mt-0.5">{successMsg}</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-[460px] z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-white/20 max-h-[92vh] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Register</h2>
              <p className="text-slate-500 text-xs mt-1 font-medium">Create your system profile</p>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 shrink-0">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleRegisterSubmit} noValidate>
            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative flex items-center">
                <User className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidName ? "text-red-400" : "text-slate-400"}`} size={18} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 text-sm font-semibold rounded-xl outline-none transition-all border ${
                    hasSubmitted && !isValidName
                      ? "bg-red-50 border-red-300 focus:border-red-500 text-red-900"
                      : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                  }`}
                  placeholder="Enter your full name"
                />
                {isValidName && <CheckCircle2 className="absolute right-3 text-emerald-500" size={16} />}
              </div>
              {hasSubmitted && !isValidName && <span className="text-[10px] text-red-500 mt-1 ml-1 font-medium">Full name is required.</span>}
            </div>

            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5">Work Email</label>
              <div className="relative flex items-center">
                <Mail className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidEmail ? "text-red-400" : "text-slate-400"}`} size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 text-sm font-semibold rounded-xl outline-none transition-all border ${
                    hasSubmitted && !isValidEmail
                      ? "bg-red-50 border-red-300 focus:border-red-500 text-red-900 placeholder:text-red-300"
                      : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400"
                  }`}
                  placeholder="admin@medicarepro.com"
                />
                {isValidEmail && <CheckCircle2 className="absolute right-3 text-emerald-500" size={16} />}
              </div>
              {hasSubmitted && !isValidEmail && <span className="text-[10px] text-red-500 mt-1 ml-1 font-medium">Valid email is required.</span>}
            </div>

            {/* --- Phone Number Field with Country Code --- */}
            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5">Phone Number</label>
              <div className="flex gap-2">
                
                {/* Country Code Dropdown */}
                <div className="relative w-[100px] sm:w-[120px] shrink-0" ref={countryCodeRef}>
                  <button
                    type="button"
                    onClick={() => setIsCountryCodeOpen(!isCountryCodeOpen)}
                    className={`w-full h-full flex items-center justify-between px-3 py-3 text-sm font-semibold rounded-xl outline-none transition-all border ${
                      hasSubmitted && !isValidPhone
                        ? "bg-red-50 border-red-300 text-red-900"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900"
                    }`}
                  >
                    <span>{countryCode}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isCountryCodeOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isCountryCodeOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-[120px] bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {countryCodes.map((c) => (
                        <div
                          key={c.code}
                          onClick={() => {
                            setCountryCode(c.code);
                            // 切换国家代码时清空之前输入的号码，防止长度不匹配
                            setPhoneNumber(""); 
                            setIsCountryCodeOpen(false);
                          }}
                          className={`px-3 py-2.5 text-xs cursor-pointer transition-colors ${
                            countryCode === c.code ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-medium"
                          }`}
                        >
                          {c.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone Input */}
                <div className="relative flex-1">
                  <Phone className={`absolute left-3.5 top-3 z-10 ${hasSubmitted && !isValidPhone ? "text-red-400" : "text-slate-400"}`} size={18} />
                  <input
                    type="tel"
                    // 【优化项 2】：根据选择的区号动态限制最大输入长度
                    maxLength={countryCode === "+65" ? 8 : 10}
                    value={phoneNumber}
                    onChange={(e) => {
                      // 【优化项 3】：正则表达式，强制只能输入纯数字
                      const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                      setPhoneNumber(onlyNums);
                    }}
                    className={`w-full pl-10 pr-10 py-3 text-sm font-semibold rounded-xl outline-none transition-all border ${
                      hasSubmitted && !isValidPhone
                        ? "bg-red-50 border-red-300 focus:border-red-500 text-red-900 placeholder:text-red-300"
                        : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400"
                    }`}
                    placeholder={countryCode === "+65" ? "8 digits" : "9-10 digits"}
                  />
                  {isValidPhone && <CheckCircle2 className="absolute right-3 top-3 text-emerald-500" size={16} />}
                </div>
              </div>
              {/* 【优化项 4】：动态报错提示 */}
              {hasSubmitted && !isValidPhone && (
                <span className="text-[10px] text-red-500 mt-1 ml-1 font-medium">
                  {countryCode === "+65" ? "Singapore numbers must be exactly 8 digits." : "Malaysia numbers must be 9 or 10 digits."}
                </span>
              )}
            </div>

            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5">System Role</label>
              <div className="relative" ref={roleRef}>
                <ShieldCheck className={`absolute left-3.5 top-3 z-10 pointer-events-none ${hasSubmitted && !isValidRole ? "text-red-400" : "text-slate-400"}`} size={18} />
                <button
                  type="button"
                  onClick={() => setIsRoleOpen(!isRoleOpen)}
                  className={`w-full flex items-center justify-between pl-10 pr-3 py-3 text-sm font-semibold rounded-xl outline-none transition-all border ${
                    hasSubmitted && !isValidRole ? "bg-red-50 border-red-300 text-red-900" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900"
                  }`}
                >
                  <span className={role ? "text-slate-900" : "text-slate-400 font-medium"}>
                    {role ? roleOptions.find((o) => o.value === role)?.label : "Select your role"}
                  </span>
                  <ChevronDown size={16} className={`${hasSubmitted && !isValidRole ? "text-red-400" : "text-slate-400"} transition-transform duration-300 ${isRoleOpen ? "rotate-180" : ""}`} />
                </button>
                {isRoleOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {roleOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => { setRole(option.value); setIsRoleOpen(false); }}
                        className={`px-4 py-3 text-sm cursor-pointer flex items-center transition-colors ${
                          role === option.value ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-medium"
                        }`}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
                {isValidRole && <CheckCircle2 className="absolute right-9 top-3 text-emerald-500 pointer-events-none" size={16} />}
              </div>
              {hasSubmitted && !isValidRole && <span className="text-[10px] text-red-500 mt-1 ml-1 font-medium">Please select a system role.</span>}
            </div>

            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative flex items-center">
                <Lock className={`absolute left-3.5 z-10 ${hasSubmitted && !isValidPassword ? "text-red-400" : "text-slate-400"}`} size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 text-sm font-semibold rounded-xl outline-none transition-all border ${
                    hasSubmitted && !isValidPassword
                      ? "bg-red-50 border-red-300 focus:border-red-500 text-red-900 placeholder:text-red-300"
                      : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400"
                  }`}
                  placeholder="Create strong password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-400 hover:text-emerald-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className={`mt-2 p-2.5 rounded-lg border flex items-start gap-2 ${hasSubmitted && !isValidPassword ? "bg-red-50 border-red-100" : "bg-emerald-50/50 border-emerald-100"}`}>
                {hasSubmitted && !isValidPassword ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                )}
                <p className={`text-[10px] font-semibold leading-snug ${hasSubmitted && !isValidPassword ? "text-red-600" : "text-emerald-700"}`}>
                  Min 8 chars, must include numbers & special symbols (!@#$).
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || successMsg !== null}
              className="w-full mt-2 py-3.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-80"
            >
              {isLoading || successMsg ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  {successMsg ? "Success!" : "Processing..."}
                </span>
              ) : (
                <>Create Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-5">
            <Link href="/admin/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">
              <ArrowLeft size={14} /> Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
}