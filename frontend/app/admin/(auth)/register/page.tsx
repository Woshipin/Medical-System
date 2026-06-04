"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, Lock, User, Activity, ArrowLeft, CheckCircle2,
  Eye, EyeOff, ShieldCheck, ChevronDown, AlertCircle,
  X, CheckCircle, Loader2, ArrowRight, Phone
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ── Extracts the plain-text message from any backend response shape ───────────
const getBackendMessage = (result: any): string | null => {
  if (!result) return null;
  const msg = result.message ?? result.Message;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  return null;
};

// ── Extracts field-level errors: { "fullname": "msg", "email": "msg", ... } ──
const getFieldErrors = (result: any): Record<string, string> => {
  const map: Record<string, string> = {};
  const errors = result?.errors ?? result?.Errors;
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return map;
  for (const [key, val] of Object.entries(errors)) {
    map[key.toLowerCase().replace(/\s/g, '')] =
      Array.isArray(val) ? String((val as any[])[0]) : String(val);
  }
  return map;
};

export default function AdminRegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [countryCode, setCountryCode] = useState('+65');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole]               = useState('');

  const [isCountryCodeOpen, setIsCountryCodeOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen]               = useState(false);
  const countryCodeRef = useRef<HTMLDivElement>(null);
  const roleRef        = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading]       = useState(false);
  const [toastError, setToastError]     = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);

  // Field errors received directly from backend Model validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const roleOptions = [
    { value: 'superadmin', label: 'Super Admin' },
    { value: 'admin',      label: 'Admin'       },
    { value: 'doctor',     label: 'Doctor'      },
  ];
  const countryCodes = [
    { code: '+65', label: 'SG (+65)' },
    { code: '+60', label: 'MY (+60)' },
  ];

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setIsRoleOpen(false);
      if (countryCodeRef.current && !countryCodeRef.current.contains(e.target as Node)) setIsCountryCodeOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // ── Client format checks (Only used to toggle the green checkmarks in UI) ───
  const clientOkName     = fullName.trim().length > 0;
  const clientOkEmail    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const clientOkRole     = role !== '';
  const clientOkPassword = /^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
  const clientOkPhone    = countryCode === '+65'
    ? phoneNumber.length === 8
    : phoneNumber.length === 9 || phoneNumber.length === 10;

  // Red borders trigger strictly on backend validation errors
  const nameBorderRed     = !!fieldErrors['fullname'];
  const emailBorderRed    = !!fieldErrors['email'];
  const phoneBorderRed    = !!fieldErrors['phonenumber'];
  const roleBorderRed     = !!fieldErrors['role'];
  const passwordBorderRed = !!fieldErrors['password'] || !!fieldErrors['general'];

  const clearFieldErr = (key: string) =>
    setFieldErrors(p => { const n = { ...p }; delete n[key]; return n; });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setToastError(null);
    setToastSuccess(null);

    setIsLoading(true);
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api';

    try {
      const response = await fetch(`${BASE_URL}/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName, email, role, password,
          phoneNumber: `${countryCode}${phoneNumber}`,
        }),
      });

      const result = await response.json();
      const isSuccess = result?.success === true || result?.Success === true;

      if (response.ok && isSuccess) {
        setToastSuccess(getBackendMessage(result) ?? 'Registration successful.');
        setTimeout(() => router.push('/admin/login'), 2000);
      } else {
        // Hydrate precisely mapped C# Model validation errors into corresponding input states
        const fields = getFieldErrors(result);
        if (Object.keys(fields).length > 0) setFieldErrors(fields);
        setToastError(getBackendMessage(result) ?? 'Registration failed. Please correct the fields below.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setToastError(typeof err?.message === 'string' ? err.message : 'Cannot connect to server. Please check your backend connection.');
      setIsLoading(false);
    }
  };

  const inputCls = (isRed: boolean) =>
    `w-full py-2.5 text-sm font-medium rounded-xl outline-none transition-all border ${
      isRed
        ? 'bg-red-50 border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-red-900 placeholder:text-red-300'
        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400'
    }`;

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700 font-sans overflow-hidden px-4">

      {/* ── Toasts ──────────────────────────────────────────────────────────── */}
      <div className="fixed top-5 left-0 w-full flex flex-col items-center gap-2 z-50 pointer-events-none px-4">
        {toastError && (
          <div className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-xl border-l-4 border-red-500 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
            <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={17} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-red-700">Registration Failed</p>
              <p className="text-xs text-slate-600 mt-0.5 break-words">{toastError}</p>
            </div>
            <button type="button" onClick={() => setToastError(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
              <X size={15} />
            </button>
          </div>
        )}
        {toastSuccess && (
          <div className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-xl border-l-4 border-emerald-500 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
            <CheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={17} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-emerald-700">Registration Successful</p>
              <p className="text-xs text-slate-600 mt-0.5 break-words">{toastSuccess}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Card ─────────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-[480px] bg-white rounded-[1.75rem] shadow-2xl px-7 py-5 border border-white/20 animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Register</h2>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">Create your system profile</p>
          </div>
          <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100 shrink-0">
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit} noValidate>

          {/* Row 1: Full Name + Email */}
          <div className="grid grid-cols-2 gap-3">
            {/* Full Name */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1">Full Name</label>
              <div className="relative flex items-center">
                <User className={`absolute left-3 z-10 ${nameBorderRed ? 'text-red-400' : 'text-slate-400'}`} size={15} />
                <input
                  type="text" name="fullName" autoComplete="name" value={fullName}
                  onChange={e => { setFullName(e.target.value); clearFieldErr('fullname'); }}
                  className={`${inputCls(nameBorderRed)} pl-9 pr-8`}
                  placeholder="Full name"
                />
                {clientOkName && !nameBorderRed && (
                  <CheckCircle2 className="absolute right-2.5 text-emerald-500" size={13} />
                )}
              </div>
              {fieldErrors['fullname'] && (
                <p className="text-[10px] text-red-500 mt-1 ml-1 font-semibold">{fieldErrors['fullname']}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1">Email</label>
              <div className="relative flex items-center">
                <Mail className={`absolute left-3 z-10 ${emailBorderRed ? 'text-red-400' : 'text-slate-400'}`} size={15} />
                <input
                  type="email" name="email" autoComplete="email" value={email}
                  onChange={e => { setEmail(e.target.value); clearFieldErr('email'); }}
                  className={`${inputCls(emailBorderRed)} pl-9 pr-8`}
                  placeholder="admin@example.com"
                />
                {clientOkEmail && !emailBorderRed && (
                  <CheckCircle2 className="absolute right-2.5 text-emerald-500" size={13} />
                )}
              </div>
              {fieldErrors['email'] && (
                <p className="text-[10px] text-red-500 mt-1 ml-1 font-semibold">{fieldErrors['email']}</p>
              )}
            </div>
          </div>

          {/* Row 2: Phone + System Role */}
          <div className="grid grid-cols-2 gap-3">
            {/* Phone Number */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1">Phone Number</label>
              <div className="flex gap-1.5">
                <div className="relative w-[68px] shrink-0" ref={countryCodeRef}>
                  <button
                    type="button"
                    onClick={() => setIsCountryCodeOpen(!isCountryCodeOpen)}
                    className={`w-full h-full flex items-center justify-between px-2 py-2.5 text-xs font-semibold rounded-xl border outline-none transition-all ${phoneBorderRed ? 'bg-red-50 border-red-300 text-red-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900'}`}
                  >
                    <span>{countryCode}</span>
                    <ChevronDown size={10} className={`text-slate-400 transition-transform ${isCountryCodeOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isCountryCodeOpen && (
                    <div className="absolute top-full left-0 mt-1 w-[110px] bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden">
                      {countryCodes.map(c => (
                        <div key={c.code}
                          onClick={() => { setCountryCode(c.code); setPhoneNumber(''); setIsCountryCodeOpen(false); }}
                          className={`px-3 py-2 text-xs cursor-pointer transition-colors ${countryCode === c.code ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-medium'}`}>
                          {c.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative flex-1">
                  <Phone className={`absolute left-2.5 top-1/2 -translate-y-1/2 z-10 ${phoneBorderRed ? 'text-red-400' : 'text-slate-400'}`} size={14} />
                  <input
                    type="tel"
                    maxLength={countryCode === '+65' ? 8 : 10}
                    value={phoneNumber}
                    onChange={e => { setPhoneNumber(e.target.value.replace(/[^0-9]/g, '')); clearFieldErr('phonenumber'); }}
                    className={`w-full pl-8 pr-2 py-2.5 text-sm font-medium rounded-xl outline-none transition-all border ${phoneBorderRed ? 'bg-red-50 border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200 text-red-900 placeholder:text-red-300' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400'}`}
                    placeholder={countryCode === '+65' ? '8 digits' : '9-10 digits'}
                  />
                </div>
              </div>
              {fieldErrors['phonenumber'] && (
                <p className="text-[10px] text-red-500 mt-1 ml-1 font-semibold">{fieldErrors['phonenumber']}</p>
              )}
            </div>

            {/* System Role */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1">System Role</label>
              <div className="relative" ref={roleRef}>
                <ShieldCheck className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none ${roleBorderRed ? 'text-red-400' : 'text-slate-400'}`} size={15} />
                <button
                  type="button"
                  onClick={() => setIsRoleOpen(!isRoleOpen)}
                  className={`w-full flex items-center justify-between pl-9 pr-3 py-2.5 text-sm font-medium rounded-xl border outline-none transition-all ${roleBorderRed ? 'bg-red-50 border-red-300 text-red-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900'}`}
                >
                  <span className={role ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                    {role ? roleOptions.find(o => o.value === role)?.label : 'Select role'}
                  </span>
                  <ChevronDown size={13} className={`${roleBorderRed ? 'text-red-400' : 'text-slate-400'} transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} />
                </button>
                {isRoleOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden">
                    {roleOptions.map(option => (
                      <div key={option.value}
                        onClick={() => { setRole(option.value); setIsRoleOpen(false); clearFieldErr('role'); }}
                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${role === option.value ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-medium'}`}>
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
                {clientOkRole && !roleBorderRed && (
                  <CheckCircle2 className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" size={13} />
                )}
              </div>
              {fieldErrors['role'] && (
                <p className="text-[10px] text-red-500 mt-1 ml-1 font-semibold">{fieldErrors['role']}</p>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-wider block mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className={`absolute left-3 z-10 ${passwordBorderRed ? 'text-red-400' : 'text-slate-400'}`} size={15} />
              <input
                type={showPassword ? 'text' : 'password'} name="password" autoComplete="new-password" value={password}
                onChange={e => { setPassword(e.target.value); clearFieldErr('password'); clearFieldErr('general'); }}
                className={`${inputCls(passwordBorderRed)} pl-9 pr-10`}
                placeholder="Create strong password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-emerald-600 transition-colors">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {/* Password verification box */}
            <div className={`mt-1.5 px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${passwordBorderRed ? 'bg-red-50 border-red-100' : 'bg-emerald-50/60 border-emerald-100'}`}>
              {passwordBorderRed
                ? <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
              <p className={`text-[10px] font-semibold leading-snug transition-colors ${passwordBorderRed ? 'text-red-600' : 'text-emerald-700'}`}>
                {/* Dynamically loads backend's precise validation message, falling back to default styling */}
                {fieldErrors['password'] ?? fieldErrors['general'] ?? 'Min 8 chars, must include numbers & special symbols (!@#$).'}
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || toastSuccess !== null}
            className="w-full py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-80"
          >
            {isLoading || toastSuccess ? (
              <span className="flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" />
                {toastSuccess ? 'Redirecting...' : 'Processing...'}
              </span>
            ) : (
              <>Create Account <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </form>

        <div className="mt-4 text-center border-t border-slate-100 pt-3.5">
          <Link href="/admin/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">
            <ArrowLeft size={12} /> Already have an account? Sign In
          </Link>
        </div>
      </div>

      <style jsx global>{`
        * { scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}