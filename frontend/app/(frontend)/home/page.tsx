// app/(frontend)/home/page.tsx
"use client";

import React from 'react';
import Link from 'next/link'; // 导入 Next.js Link
import { useRouter } from 'next/navigation'; // 导入路由跳转钩子
import { Button } from '@/components/frontend/Button';
import { Section } from '@/components/frontend/Section';
import { Hero3DElement } from '@/components/frontend/Hero3DElement';
import { SERVICES, DEPARTMENTS } from '@/constants/frontend/constants';
import { ArrowRight, Star, ChevronRight, ShieldCheck, Play, CheckCircle2 } from 'lucide-react';

/**
 * 【重构说明】
 * 1. 使用 export default：这是 Next.js page.tsx 的强制要求，解决 "not a React Component" 错误。
 * 2. 移除 Props：不再接收 setView 和 setSelectedCategory。
 * 3. 路由跳转：
 *    - 普通跳转使用 <Link>。
 *    - 带逻辑的跳转（如点击科室跳转医生）使用 router.push。
 */
export default function HomePage() {
  const router = useRouter();

  // 处理点击科室的逻辑：跳转到医生列表并携带科室 ID
  const handleDepartmentClick = (deptId: string) => {
    // 通过 URL Query 参数传递数据，例如: /provider?category=cardiology
    router.push(`/provider?category=${deptId}`);
  };

  return (
    <div className="min-h-screen bg-white selection:bg-emerald-100">
      
      {/* --- HERO SECTION --- */}
      <div className="relative pt-12 pb-8 lg:pt-12 lg:pb-12 overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-200/20 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            
            {/* Left Content */}
            <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-100 shadow-sm text-emerald-700 font-bold text-xs uppercase tracking-widest mx-auto lg:mx-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                #1 Trusted Medical Center
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                Your Health, <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Our Commitment.</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Experience world-class healthcare with our state-of-the-art facilities and a team that truly cares about your well-being.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                {/* 使用 Link 包裹 Button 实现跳转 */}
                <Link href="/appointment" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-14 px-8 rounded-2xl text-lg font-bold">
                    Book Appointment <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
                <Link href="/provider" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full h-14 px-8 rounded-2xl text-lg font-bold bg-white/50">
                    Find a Doctor
                  </Button>
                </Link>
              </div>

              {/* Social Proof */}
              <div className="pt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-8 border-t border-slate-100">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="User" />
                  ))}
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex justify-center sm:justify-start text-yellow-400 mb-1">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">4.9/5 Rating from 2k+ Patients</p>
                </div>
              </div>
            </div>

            {/* Right Content - 3D Element */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end animate-in fade-in zoom-in duration-1000 delay-200">
              <Hero3DElement />
            </div>
          </div>
        </div>
      </div>

      {/* --- DEPARTMENTS SECTION --- */}
      <Section variant="alternate" title="Expert Departments" subtitle="Specialized care from leading medical professionals across multiple fields.">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {DEPARTMENTS.slice(0, 6).map((dept) => (
            <div 
              key={dept.id} 
              onClick={() => handleDepartmentClick(dept.id)}
              className="group bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer text-center"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-emerald-500 group-hover:text-white mb-4 mx-auto transition-colors shadow-inner">
                <dept.icon size={28} />
              </div>
              <span className="text-sm md:text-base font-bold text-slate-700 group-hover:text-emerald-800">{dept.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/department">
            <Button variant="ghost" className="font-bold text-emerald-600">
              View All Departments <ChevronRight size={18} className="ml-1" />
            </Button>
          </Link>
        </div>
      </Section>

      {/* --- SERVICES SECTION --- */}
      <Section title="Comprehensive Services" subtitle="We offer a full range of medical services tailored to your individual needs and recovery.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {SERVICES.slice(0, 3).map((service) => (
            <div key={service.id} className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 group">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 group-hover:scale-110 transition-transform">
                <service.icon size={30} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{service.title}</h3>
              <p className="text-slate-500 leading-relaxed mb-8 line-clamp-3">{service.description}</p>
              <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg">
                  {service.priceRange}
                </span>
                <Link href="/service" className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* --- WHY CHOOSE US --- */}
      <Section className="!pb-20">
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 lg:p-24 overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
            <div className="space-y-8">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs tracking-widest">
                <ShieldCheck size={20} /> <span>The Medical Excellence</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">Innovation in <br className="hidden md:block"/> Every Square Foot</h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Our center uses the latest diagnostic technology combined with a warm, human touch to ensure the best patient outcome.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {['Expert Doctors', '24/7 Support', 'Modern Lab', 'Private Suites'].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 text-white">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <span className="font-bold text-sm md:text-base">{text}</span>
                  </div>
                ))}
              </div>
              <Link href="/about">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-emerald-500 hover:text-white px-10 h-14 rounded-2xl font-bold mt-4">
                  Learn More
                </Button>
              </Link>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-emerald-500/10 rounded-[3rem] blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
              <div className="relative bg-white/10 backdrop-blur-md rounded-[3rem] border border-white/10 p-3 transform rotate-2 hover:rotate-0 transition-all duration-700">
                <img src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80" className="rounded-[2.5rem] w-full shadow-2xl" alt="Facility" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition-transform">
                    <Play fill="currentColor" size={32} className="ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <div className="py-12 border-t border-slate-100 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
        © 2026 GreenLifeMed Medical Group. Built for Excellence.
      </div>
    </div>
  );
}