"use client";
import React, { ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const Button: React.FC<any> = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => {
  const base = "inline-flex items-center justify-center font-bold transition-all rounded-xl disabled:opacity-50 active:scale-95";
  const variants: any = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md",
    secondary: "bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-md",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  };
  const sizes: any = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm" };
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
};

export const Badge: React.FC<{ children: ReactNode; variant?: 'success' | 'danger' | 'info' | 'warning' }> = ({ children, variant = 'success' }) => {
  const styles = {
    success: "bg-emerald-100 text-emerald-900 border border-emerald-300",
    danger: "bg-red-100 text-red-900 border border-red-300",
    info: "bg-blue-100 text-blue-900 border border-blue-300",
    warning: "bg-amber-100 text-amber-900 border border-amber-300",
  };
  return <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${styles[variant]}`}>{children}</span>;
};

export const Input: React.FC<any> = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-black text-slate-800">{label}</label>
    <input className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-900 font-bold bg-white disabled:bg-slate-50" {...props} />
  </div>
);

export const Select: React.FC<any> = ({ label, options, ...props }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-black text-slate-800">{label}</label>
    <select className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-900 font-bold bg-white disabled:bg-slate-50 disabled:appearance-none" {...props}>
      <option value="">Select Option</option>
      {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

export const Modal: React.FC<any> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const AlertModal: React.FC<any> = ({ alert, onClose }) => {
  if (!alert?.show) return null;
  const icons: any = { success: <CheckCircle className="w-10 h-10 text-emerald-500" />, error: <AlertCircle className="w-10 h-10 text-red-500" />, info: <Info className="w-10 h-10 text-blue-500" /> };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
        <div className="flex justify-center mb-4">{icons[alert.type]}</div>
        <h4 className="text-xl font-black text-slate-900 mb-2 uppercase">{alert.type}</h4>
        <p className="text-slate-600 font-bold mb-6">{alert.message}</p>
        <Button onClick={onClose} className="w-full">Dismiss</Button>
      </div>
    </div>
  );
};

export const ConfirmModal: React.FC<any> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex gap-4 mb-6">
          <div className="p-3 bg-red-100 rounded-full h-fit"><AlertTriangle className="text-red-600" /></div>
          <div><h4 className="text-lg font-black text-slate-900">{title}</h4><p className="text-sm text-slate-500 font-bold mt-1">{message}</p></div>
        </div>
        <div className="flex gap-3 justify-end"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={onConfirm}>Delete</Button></div>
      </div>
    </div>
  );
};