// app/(frontend)/faq/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link'; // 导入 Next.js Link
import { Button } from '@/components/frontend/Button';
import { FAQS } from '@/constants/frontend/constants';
import { 
  ChevronDown, HelpCircle, ChevronLeft, 
  Sparkles, MessageCircle, ArrowRight 
} from 'lucide-react';

/**
 * 【重构说明】
 * 1. 使用 export default：满足 Next.js 页面组件的要求。
 * 2. 移除 Props：不再接收 setView，导航改由 URL 驱动。
 * 3. 导航逻辑：左上角返回按钮和底部的联系按钮均改为 <Link>。
 */
export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-emerald-100">
      
      {/* ================= HERO SECTION (Standardized Header) ================= */}
      <div className="relative pt-24 pb-12 md:pt-36 md:pb-20 px-4 bg-gradient-to-br from-[#f0fdf4] via-white to-transparent border-b border-emerald-50">
        
        {/* --- Back to Home using Link --- */}
        <div className="absolute top-6 left-4 sm:top-10 sm:left-10 z-20">
          <Link 
            href="/home"
            className="group flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full text-slate-700 font-bold text-xs sm:text-sm shadow-sm hover:border-emerald-500 hover:text-emerald-600 hover:shadow-md transition-all duration-300 active:scale-95 whitespace-nowrap"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-[1400px] mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/50 rounded-lg text-emerald-700 font-bold text-[10px] uppercase tracking-[0.2em] mb-6">
            <Sparkles size={14} /> Help Center
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 leading-tight tracking-tight mb-6">
            Common <span className="text-emerald-500">Questions</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed px-2">
            Find quick answers about our medical services, appointments, insurance, and clinical policies.
          </p>
        </div>
      </div>

      {/* ================= FAQ ACCORDION SECTION ================= */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="space-y-4 md:space-y-6">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`group transition-all duration-500 rounded-[1.5rem] sm:rounded-[2.5rem] border ${
                  isOpen 
                  ? 'bg-white shadow-xl shadow-emerald-900/5 border-emerald-200 ring-1 ring-emerald-50' 
                  : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md'
                }`}
              >
                <button 
                  className="w-full flex items-center justify-between p-6 sm:p-8 text-left focus:outline-none transition-all"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className={`text-base sm:text-xl font-bold pr-4 transition-colors duration-300 ${
                    isOpen ? 'text-emerald-700' : 'text-slate-800 group-hover:text-emerald-600'
                  }`}>
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                    isOpen ? 'bg-emerald-500 text-white rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50'
                  }`}>
                    <ChevronDown size={isOpen ? 20 : 18} strokeWidth={3} />
                  </div>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 sm:px-8 pb-8 text-sm sm:text-base md:text-lg text-slate-500 leading-relaxed border-t border-slate-50 pt-6">
                    {faq.answer || "Please contact our support team for more specific information regarding this inquiry."}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= STILL HAVE QUESTIONS CTA ================= */}
        <div className="mt-16 md:mt-24 p-8 md:p-14 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                 <MessageCircle size={32} />
              </div>
              <div>
                 <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Still have questions?</h3>
                 <p className="text-slate-500 text-sm sm:text-base">Our friendly support team is ready to assist you 24/7.</p>
              </div>
           </div>
           
           <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* 跳转至联系页面 */}
              <Link href="/contact">
                <Button 
                  className="w-full sm:w-auto h-12 sm:h-14 px-8 rounded-xl sm:rounded-2xl whitespace-nowrap text-xs sm:text-base font-bold shadow-lg shadow-emerald-500/10"
                >
                  <span className="whitespace-nowrap">Contact Support</span> <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
           </div>
        </div>
      </div>

      <div className="py-8 text-center text-slate-400 text-[9px] sm:text-[10px] font-black tracking-[0.3em] uppercase border-t border-slate-50 bg-white">
         © 2026 GREENLIFEMED GROUP • KNOWLEDGE BASE
      </div>

    </div>
  );
}