// app/(frontend)/doctor/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // 导入 Next.js 导航钩子
import { Button } from '@/components/frontend/Button';
import { DOCTORS, DEPARTMENTS } from '@/constants/frontend/constants';
import { 
  Calendar, Clock, Star, Filter, X, 
  Stethoscope, ChevronLeft, Sparkles, UserCheck, ArrowRight 
} from 'lucide-react';

/**
 * 【重构说明】
 * 1. 命名改动：按照要求将 Provider 统一改名为 Doctor。
 * 2. 导出方式：使用 export default 以符合 Next.js page 规范。
 * 3. 参数获取：使用 useSearchParams() 从 URL 获取选中的科室信息。
 * 4. 路由逻辑：删除了 setView，改为使用 Link 或 router.push。
 */
export default function DoctorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 从 URL 中获取 category 参数 (例如: ?category=Cardiology)
  const categoryParam = searchParams.get('category');
  
  const [filterDept, setFilterDept] = useState<string>('All');
  const [filterDay, setFilterDay] = useState<string>('Any');

  // 当 URL 参数变化时，同步更新过滤状态
  useEffect(() => {
    if (categoryParam) {
      // 检查 categoryParam 是否在科室列表中，或者直接设置
      setFilterDept(categoryParam);
    } else {
      setFilterDept('All');
    }
  }, [categoryParam]);

  const days = ['Any', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const deptNames = ['All', ...DEPARTMENTS.map(d => d.name)];

  // 核心过滤逻辑
  const filteredDoctors = DOCTORS.filter(doc => {
    const matchesDept = filterDept === 'All' || doc.specialty.includes(filterDept);
    const matchesDay = filterDay === 'Any' || doc.availability.includes(filterDay);
    return matchesDept && matchesDay;
  });

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-emerald-100">
      
      {/* ================= HEADER AREA ================= */}
      <div className="relative pt-24 pb-12 md:pt-36 md:pb-20 px-4 bg-gradient-to-br from-emerald-50 via-white to-transparent border-b border-emerald-50">
        
        {/* --- 返回首页按钮：使用 Link 组件 --- */}
        <div className="absolute top-6 left-4 sm:top-10 sm:left-10 z-20">
          <Link 
            href="/home"
            className="group flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full text-slate-700 font-bold text-xs sm:text-sm shadow-sm hover:border-emerald-500 hover:text-emerald-600 hover:shadow-md transition-all duration-300 active:scale-95 whitespace-nowrap"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-[1400px] mx-auto text-center relative z-10 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/50 rounded-lg text-emerald-700 font-bold text-[10px] uppercase tracking-[0.2em] mb-6">
            <UserCheck size={14} /> Expert Network
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-slate-900 leading-tight tracking-tight mb-6">
            Meet our <span className="text-emerald-500">Doctor Specialists</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed px-2">
            {categoryParam 
              ? `Available doctors in ${categoryParam}. Choose your preferred specialist below.` 
              : "Discover our dedicated team of world-class healthcare professionals."}
          </p>
        </div>
      </div>

      {/* ================= FILTER BAR SECTION ================= */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl md:rounded-full shadow-2xl shadow-emerald-900/5 border border-slate-100">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-stretch md:items-center">
            
            {/* Dept Filter */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl md:rounded-full border border-slate-100">
                <Filter size={16} className="text-emerald-600 shrink-0" />
                <select 
                    value={filterDept} 
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                >
                    {deptNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
            </div>
            
            {/* Day Filter */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl md:rounded-full border border-slate-100">
                <Calendar size={16} className="text-emerald-600 shrink-0" />
                <select 
                    value={filterDay} 
                    onChange={(e) => setFilterDay(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                >
                    {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
            </div>

            {/* Clear Filter */}
            <Button 
                variant="ghost" 
                size="sm"
                onClick={() => { setFilterDept('All'); setFilterDay('Any'); router.push('/doctor'); }}
                className="text-slate-400 hover:text-emerald-600 font-bold"
            >
                <X size={16} className="mr-2" /> Reset
            </Button>
          </div>
        </div>
      </div>

      {/* ================= DOCTORS GRID ================= */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
              {filteredDoctors.map((doctor) => (
              <div 
                  key={doctor.id} 
                  className="group bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 border border-slate-100 overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-2 h-full"
              >
                  {/* Doctor Image Container */}
                  <div className="relative aspect-[4/5] sm:aspect-square md:aspect-[4/5] overflow-hidden">
                    <img 
                        src={doctor.image} 
                        alt={doctor.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute top-5 right-5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[10px] font-black text-slate-900 shadow-xl flex items-center gap-1.5 border border-white">
                        <Star size={12} className="text-yellow-500 fill-yellow-500" /> 4.9
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-[0.15em] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                        <Sparkles size={12} /> {doctor.specialty}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                      {doctor.name}
                    </h3>
                    
                    <p className="text-slate-500 text-sm md:text-base mb-8 flex-1 leading-relaxed line-clamp-3">
                      {doctor.bio}
                    </p>
                    
                    <div className="border-t border-slate-50 pt-6 mt-auto">
                        <div className="flex items-center text-slate-400 text-xs font-bold mb-6">
                            <Clock size={16} className="mr-2 text-emerald-500" />
                            <span>Availability: <span className="text-slate-800 font-black uppercase tracking-tighter">{doctor.availability}</span></span>
                        </div>

                        {/* 操作按钮：改为 Link 跳转到预约页 */}
                        <Link href="/appointment" className="w-full">
                            <Button 
                              fullWidth 
                              size="lg"
                              className="h-14 rounded-2xl whitespace-nowrap text-sm sm:text-base font-bold shadow-lg shadow-emerald-500/20"
                            >
                                <span className="whitespace-nowrap">Select Doctor</span> <ArrowRight size={18} className="ml-2" />
                            </Button>
                        </Link>
                    </div>
                  </div>
              </div>
              ))}
          </div>
        ) : (
            <div className="text-center py-32 bg-emerald-50/30 rounded-[3rem] border border-emerald-100">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-sm">
                   <Filter size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No doctors found</h3>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">Try adjusting your filters to find other specialists in our network.</p>
                <Button variant="outline" onClick={() => { setFilterDept('All'); setFilterDay('Any'); router.push('/doctor'); }} className="rounded-xl px-10">
                   Reset All Filters
                </Button>
            </div>
        )}
      </div>

      {/* FOOTER PAD */}
      <div className="py-10 text-center text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase border-t border-slate-50 bg-white">
         © 2026 GREENLIFEMED GROUP • EXPERT CARE NETWORK
      </div>

    </div>
  );
}