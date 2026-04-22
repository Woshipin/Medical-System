// app/(frontend)/profile/page.tsx
"use client";

import React from 'react';
import Link from 'next/link'; // 导入 Next.js 的 Link 组件
import { Button } from '@/components/frontend/Button';
import { 
  FileText, Activity, Pill, Download, User, 
  Settings, Bell, LogOut, Calendar, Heart, Shield 
} from 'lucide-react';

/**
 * 【重构说明】
 * 1. 使用 export default：确保 Next.js 能够将其作为独立路由渲染。
 * 2. 移除 Props：页面不再接收 setView，导航改由 URL 驱动。
 * 3. 导航逻辑：点击 "Sign Out" 会直接通过 <Link> 跳转回 /home 路径。
 */
export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* 个人资料顶部 (Profile Header) - 采用深色渐变设计 */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 pt-32 pb-20 text-white px-4 shadow-xl">
         <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
               {/* 头像区域 */}
               <div className="relative">
                  <div className="w-32 h-32 md:w-44 md:h-44 bg-white p-1.5 rounded-3xl shadow-2xl relative z-10 overflow-hidden">
                     <img 
                        src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80" 
                        alt="Profile" 
                        className="w-full h-full rounded-2xl object-cover" 
                     />
                  </div>
                  <div className="absolute -bottom-2 -right-2 z-20 bg-green-500 p-2 rounded-xl border-4 border-emerald-900 flex items-center justify-center shadow-lg">
                     <Shield size={18} className="text-white" />
                  </div>
               </div>

               {/* 用户基本信息 */}
               <div className="flex-1 pb-2 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                    <h1 className="text-3xl md:text-5xl font-bold">Johnathon Doe</h1>
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest border border-white/10">Verified Patient</span>
                  </div>
                  <p className="text-emerald-100 text-lg mb-6 opacity-90">ID: #GL-882910 • Member since 2020</p>
                  
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                     <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl text-sm border border-white/10 flex items-center gap-2">
                        <Heart size={14} className="text-red-400" /> 
                        <span>Blood Type: O+</span>
                     </div>
                     <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl text-sm border border-white/10 flex items-center gap-2">
                        <Activity size={14} className="text-blue-300" />
                        <span>Allergies: Penicillin</span>
                     </div>
                     <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl text-sm border border-white/10 flex items-center gap-2">
                        <Calendar size={14} className="text-emerald-200" />
                        <span>Dob: Jan 15, 1985</span>
                     </div>
                  </div>
               </div>

               {/* 操作按钮组 */}
               <div className="pb-2 flex items-center gap-3">
                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur transition-all border border-white/10 group">
                     <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                  </button>
                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur transition-all border border-white/10 relative">
                     <Bell size={20} />
                     <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-emerald-900"></span>
                  </button>
                  
                  {/* 使用 Link 实现退出登录跳转回首页 */}
                  <Link href="/home">
                    <Button 
                      variant="outline" 
                      className="border-white/40 text-white hover:bg-white hover:text-emerald-900 rounded-2xl px-6"
                    >
                       <LogOut size={18} className="mr-2" /> Sign Out
                    </Button>
                  </Link>
               </div>
            </div>
         </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-12 -mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 左侧栏：健康指标 */}
            <div className="space-y-6">
               <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center">
                    <Activity size={20} className="mr-3 text-emerald-600" /> Vitals Snapshot
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                     {[
                       { label: 'Heart Rate', value: '72', unit: 'bpm', color: 'text-rose-500' },
                       { label: 'Blood Pressure', value: '120/80', unit: '', color: 'text-blue-600' },
                       { label: 'Weight', value: '175', unit: 'lbs', color: 'text-slate-700' },
                       { label: 'Height', value: "5'11\"", unit: '', color: 'text-slate-700' }
                     ].map((stat, idx) => (
                       <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-50 hover:border-emerald-100 transition-colors">
                          <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">{stat.label}</span>
                          <span className={`text-xl font-bold ${stat.color}`}>{stat.value} <span className="text-xs font-normal text-slate-400">{stat.unit}</span></span>
                       </div>
                     ))}
                  </div>
               </div>

               {/* 预约卡片 */}
               <div className="bg-emerald-600 rounded-[2rem] p-8 shadow-lg text-white relative overflow-hidden group">
                  <div className="relative z-10">
                     <h3 className="text-xl font-bold mb-2">Next Appointment</h3>
                     <p className="text-emerald-100/80 mb-6 text-sm">Dr. Sarah Chen • Cardiology</p>
                     <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-6 border border-white/10">
                        <div className="font-bold text-lg">Oct 24, 2023</div>
                        <div className="text-emerald-100 text-sm">10:00 AM</div>
                     </div>
                     <Button className="bg-white text-emerald-700 hover:bg-emerald-50 w-full border-none rounded-xl font-bold">
                        Manage Booking
                     </Button>
                  </div>
               </div>
            </div>

            {/* 右侧主内容：药物与病历 */}
            <div className="lg:col-span-2 space-y-8">
               
               {/* 药物 */}
               <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="font-bold text-2xl text-slate-800 flex items-center">
                        <Pill size={26} className="mr-3 text-blue-500" /> Medications
                     </h3>
                     <button className="text-sm font-bold text-blue-600 bg-blue-50 px-5 py-2.5 rounded-xl">Request Refill</button>
                  </div>
                  <div className="grid gap-4">
                     <div className="flex items-center justify-between p-5 border border-slate-50 bg-slate-50/30 rounded-2xl">
                        <div className="flex items-center gap-5">
                           <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl">Li</div>
                           <div>
                              <div className="font-bold text-slate-900 text-lg">Lisinopril</div>
                              <div className="text-slate-500 text-sm">10mg • Daily</div>
                           </div>
                        </div>
                        <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-black">Active</span>
                     </div>
                  </div>
               </div>

               {/* 病历报告 */}
               <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="font-bold text-2xl text-slate-800 flex items-center">
                        <FileText size={26} className="mr-3 text-emerald-500" /> Medical Records
                     </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all cursor-pointer">
                        <FileText size={24} className="text-emerald-600 mb-4" />
                        <h4 className="font-bold text-slate-900 mb-1 text-lg">Blood Test Results</h4>
                        <p className="text-xs text-slate-400">Date: Oct 10, 2023</p>
                     </div>
                  </div>
               </div>

            </div>
        </div>
      </div>
    </div>
  );
}