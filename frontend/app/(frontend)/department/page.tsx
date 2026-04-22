// app/(frontend)/department/page.tsx
"use client";

import React from 'react';
import Link from 'next/link'; // 导入 Link 组件
import { useRouter } from 'next/navigation'; // 导入路由跳转钩子
import { Button } from '@/components/frontend/Button'; 
import { DEPARTMENTS } from '@/constants/frontend/constants';
import { ArrowRight, ChevronLeft, Sparkles, Grid2X2 } from 'lucide-react';

/**
 * 【重构说明】
 * 1. 使用 export default：这是 Next.js 页面文件的强制要求。
 * 2. 移除 Props：页面不再接收函数，跳转由 URL 驱动。
 * 3. 跨页面传参：点击科室后，使用 router.push 跳转到医生页面并带上查询参数 (?category=id)。
 */
export default function DepartmentsPage() {
  const router = useRouter();
  
  // 处理科室点击逻辑：跳转并传参
  const handleDeptClick = (deptId: string) => {
    // 跳转到 /provider 页面，并在 URL 中带上选中的科室 ID
    router.push(`/provider?category=${deptId}`);
  };

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      
      {/* ================= HEADER AREA ================= */}
      <div className="relative pt-24 pb-12 md:pt-36 md:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#f0fdf4] via-white to-transparent border-b border-emerald-50">
        
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

        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl text-left">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-4">
                <Grid2X2 size={14} /> Our Specializations
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-tight tracking-tight">
                Medical <span className="text-emerald-500">Departments</span>
              </h1>
              <p className="text-base md:text-xl text-slate-500 mt-6 leading-relaxed max-w-xl">
                Access specialized care across multiple disciplines, powered by innovation and expert medical staff.
              </p>
            </div>

            {/* Stats Card */}
            <div className="hidden sm:flex items-center gap-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
               <div className="text-center px-4">
                  <div className="text-2xl font-black text-slate-900">24+</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units</div>
               </div>
               <div className="w-px h-10 bg-slate-100"></div>
               <div className="text-center px-4">
                  <div className="text-2xl font-black text-slate-900">150+</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Doctors</div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= TIGHT GRID SECTION ================= */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {DEPARTMENTS.map((dept) => (
            <div 
              key={dept.id} 
              onClick={() => handleDeptClick(dept.id)}
              className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[320px]"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-inner group-hover:scale-110">
                  <dept.icon size={30} strokeWidth={1.5} />
                </div>
                <div className="text-slate-100 group-hover:text-emerald-100 transition-colors">
                  <Sparkles size={20} fill="currentColor" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-emerald-700 transition-colors">
                  {dept.name}
                </h3>
                <p className="text-slate-500 leading-relaxed text-sm md:text-base line-clamp-3">
                  {dept.description || "Providing comprehensive care with state-of-the-art diagnostic tools and patient-focused treatment plans."}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                  Find Specialists
                </span>
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-emerald-600 transition-all duration-300">
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ================= COMPACT CTA ================= */}
        <div className="mt-20 bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]"></div>
           <div className="relative z-10 max-w-xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Need Help Choosing?</h2>
              <p className="text-slate-400 text-base md:text-lg">
                Our medical team is available 24/7 to guide you to the right specialist for your specific healthcare needs.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <Link href="/contact">
                   <Button size="lg" className="h-14 px-10 rounded-2xl whitespace-nowrap w-full sm:w-auto">Contact Support</Button>
                 </Link>
                 <Link href="/faq">
                   <Button variant="outline" size="lg" className="h-14 px-10 rounded-2xl border-white/20 text-white hover:bg-white/10 whitespace-nowrap w-full sm:w-auto">Help Center</Button>
                 </Link>
              </div>
           </div>
        </div>
      </div>

      <div className="py-10 text-center text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase border-t border-slate-50">
         © 2026 GREENLIFEMED • MEDICAL SYSTEM
      </div>
    </div>
  );
}