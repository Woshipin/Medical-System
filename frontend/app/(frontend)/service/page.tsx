// app/(frontend)/service/page.tsx
"use client";

import React from 'react';
import Link from 'next/link'; // 导入 Next.js 的 Link 组件
import { Section } from '@/components/frontend/Section';
import { Button } from '@/components/frontend/Button';
import { SERVICES } from '@/constants/frontend/constants';
import { 
  CheckCircle2, ChevronLeft, ArrowRight, 
  ShieldCheck, Wallet, BadgePercent, Activity, Sparkles
} from 'lucide-react';

/**
 * 【重构说明】
 * 1. 使用 export default：满足 Next.js 页面组件的导出规范。
 * 2. 移除 Props：页面不再接收 setView，所有跳转由 URL 驱动。
 * 3. 导航逻辑：
 *    - "Back to Home" 使用 <Link> 实现。
 *    - "Book This Service" 同样使用 <Link> 跳转到预约页面。
 */
export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      
      {/* ================= SERVICE HERO ================= */}
      <div className="relative pt-28 pb-12 md:pt-40 md:pb-20 px-4 bg-gradient-to-br from-[#f0fdf4] to-white border-b border-emerald-50">
        
        {/* --- 使用 Link 组件返回首页 --- */}
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
            <Sparkles size={14} /> Care Standards
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-slate-900 leading-tight tracking-tight mb-6">
            Medical <span className="text-emerald-500">Services</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed px-2">
            World-class medical standards paired with transparent, upfront pricing for your peace of mind.
          </p>
        </div>
      </div>

      {/* ================= SERVICES LIST ================= */}
      <Section variant="default" className="!py-10 md:!py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
          {SERVICES.map((service) => (
            <div 
              key={service.id} 
              className="group bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 flex flex-col sm:flex-row gap-6 items-start h-full"
            >
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-inner group-hover:scale-110">
                <service.icon size={28} strokeWidth={1.5} />
              </div>

              <div className="flex-1 w-full flex flex-col h-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900">{service.title}</h3>
                  <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    {service.priceRange}
                  </span>
                </div>
                
                <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 flex-1">
                  {service.description}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center text-[11px] sm:text-sm text-slate-400 font-medium">
                    <CheckCircle2 size={14} className="text-emerald-500 mr-2 shrink-0" /> Specialists
                  </div>
                  <div className="flex items-center text-[11px] sm:text-sm text-slate-400 font-medium">
                    <CheckCircle2 size={14} className="text-emerald-500 mr-2 shrink-0" /> Modern Tech
                  </div>
                </div>

                {/* 点击跳转到预约页面 */}
                <Link href="/appointment">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-0 w-fit hover:bg-transparent text-emerald-600 font-bold flex items-center group/btn"
                  >
                    <span className="whitespace-nowrap">Book This Service</span> <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ================= PRICING TRANSPARENCY ================= */}
      <Section variant="alternate" className="!py-16 md:!py-24">
        <div className="text-center max-w-3xl mx-auto mb-12 px-4">
           <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">Pricing Transparency</h2>
           <p className="text-slate-500 text-sm sm:text-lg">Predictable costs. No hidden fees. Discussed upfront.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8">
          {[
            { icon: ShieldCheck, title: "Insurance", desc: "Most major providers accepted including BlueCross, Aetna." },
            { icon: BadgePercent, title: "Self-Pay", desc: "15% discount for patients paying upfront without insurance." },
            { icon: Wallet, title: "Installments", desc: "Interest-free monthly plans for bills over $500." }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <item.icon size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="py-10 text-center text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase border-t border-slate-50 bg-white">
         © 2026 GREENLIFEMED GROUP • MEDICAL CARE SERVICES
      </div>
    </div>
  );
}