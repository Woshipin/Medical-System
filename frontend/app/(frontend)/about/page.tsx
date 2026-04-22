// app/(frontend)/about/page.tsx
"use client";

import React from 'react';
import Link from 'next/link'; // 导入 Next.js 的 Link 组件
import { Section } from '@/components/frontend/Section';
import { Button } from '@/components/frontend/Button';
import { 
  Shield, Users, Award, HeartHandshake, 
  Stethoscope, ChevronLeft, Target, Activity, Microscope,
  Rocket, ArrowRight, Sparkles
} from 'lucide-react';

/**
 * 【重构说明】
 * 1. 使用 export default：满足 Next.js 页面组件的标准要求。
 * 2. 移除 Props：页面不再接收 setView，跳转改为由 URL 驱动。
 * 3. 导航优化：所有的跳转操作都使用 <Link> 组件包裹，这在 Next.js 中性能最优且支持 SEO。
 */
export default function AboutPage() {
  const timelineData = [
    { year: "1995", title: "Foundation", desc: "Started as a small neighborhood clinic with 3 specialists.", icon: Target },
    { year: "2005", title: "Expansion", desc: "Opened our first major hospital wing with Cardiology.", icon: Activity },
    { year: "2012", title: "Robotics", desc: "Adopted region's first AI-assisted robotic surgery.", icon: Microscope },
    { year: "2024", title: "Digital Era", desc: "Launched full-scale telemedicine and smart portals.", icon: Rocket }
  ];

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-emerald-100">
      
      {/* ================= HERO AREA ================= */}
      <div className="relative pt-24 pb-12 md:pt-36 md:pb-20 px-4 bg-gradient-to-br from-[#f0fdf4] via-white to-transparent border-b border-emerald-50">
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-50/60 rounded-full blur-[80px] -z-10"></div>
        
        {/* --- Back Button using Link --- */}
        <div className="absolute top-6 left-4 sm:top-10 sm:left-10 z-20">
          <Link 
            href="/home"
            className="group flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full text-slate-700 font-bold text-xs sm:text-sm shadow-sm hover:border-emerald-500 hover:text-emerald-600 hover:shadow-md transition-all duration-300 active:scale-95 whitespace-nowrap"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-[1400px] mx-auto relative z-10 px-2 sm:px-6 lg:px-8">
          <div className="max-w-4xl animate-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/50 rounded-lg text-emerald-700 font-bold text-[10px] uppercase tracking-[0.2em] mb-6">
              <Sparkles size={14} /> Established 1995
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8">
              Pioneering <span className="text-emerald-500">Healthcare</span> <br /> 
              Legacy of Trust.
            </h1>
            
            <p className="text-base sm:text-xl md:text-2xl text-slate-500 leading-relaxed max-w-2xl font-light">
              For over 28 years, we have pushed the boundaries of medical science while keeping compassion at the heart of our practice.
            </p>
          </div>
        </div>
      </div>

      {/* ================= OUR STORY ================= */}
      <Section variant="default" className="!py-16 md:!py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-emerald-600 font-bold tracking-[0.2em] uppercase text-xs">Our Mission</h2>
              <h3 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight">
                Revolutionizing Patient Care Standards.
              </h3>
            </div>
            <p className="text-slate-500 text-base md:text-lg leading-relaxed">
              GreenLife combines world-class technology with a warm, human touch. What started as a modest neighborhood clinic has evolved into a premier multi-specialty medical landmark.
            </p>
            <div className="grid grid-cols-2 gap-6 p-6 sm:p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 shadow-inner">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-700">120+</div>
                <div className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mt-1">Expert Doctors</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-700">50k+</div>
                <div className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mt-1">Happy Patients</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="flex flex-col sm:grid sm:grid-cols-12 gap-4 h-auto sm:h-[450px] md:h-[550px]">
               <div className="sm:col-span-8 h-64 sm:h-full overflow-hidden rounded-[2.5rem] shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Hospital" />
               </div>
               <div className="sm:col-span-4 grid grid-cols-2 sm:grid-cols-1 gap-4 h-auto sm:h-full">
                  <div className="h-40 sm:h-full overflow-hidden rounded-[2rem] shadow-xl">
                    <img src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Lab" />
                  </div>
                  <div className="bg-slate-900 rounded-[2rem] p-6 flex flex-col justify-center items-center text-white text-center shadow-lg">
                     <Award size={32} className="text-emerald-400 mb-4" />
                     <div className="text-xs font-bold uppercase tracking-widest">Excellence</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ================= TIMELINE ================= */}
      <Section className="bg-emerald-50/30 !py-16 md:!py-32 relative">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 px-4">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Our Medical Journey</h2>
          <p className="text-slate-500 text-lg">Charting decades of innovation and patient-first evolution.</p>
        </div>

        <div className="max-w-5xl mx-auto relative px-4 sm:px-10">
          <div className="absolute left-8 sm:left-1/2 top-0 bottom-0 w-px bg-emerald-200 md:-translate-x-1/2"></div>

          <div className="space-y-12 md:space-y-20">
            {timelineData.map((item, idx) => (
              <div key={idx} className={`relative flex flex-row items-start md:items-center ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                
                <div className="absolute left-8 md:left-1/2 w-8 h-8 bg-white border-4 border-emerald-500 rounded-full z-10 -translate-x-1/2 shadow-lg flex items-center justify-center">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                </div>

                <div className="w-full md:w-[45%] ml-14 md:ml-0">
                   <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <item.icon size={24} />
                        </div>
                        <span className="text-2xl font-black text-emerald-600 tracking-tight">{item.year}</span>
                      </div>
                      <h4 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h4>
                      <p className="text-slate-500 text-sm sm:text-base leading-relaxed">{item.desc}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ================= FINAL CTA ================= */}
      <div className="px-4 sm:px-8 pb-16">
        <div className="max-w-[1400px] mx-auto bg-slate-900 rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-10">
             <h2 className="text-3xl md:text-6xl font-black text-white leading-tight">Join Our Legacy of Health.</h2>
             <p className="text-slate-400 text-lg md:text-xl font-light">Experience the GreenLife difference today. Our specialized teams are ready to care for you.</p>
             
             <div className="flex flex-col sm:flex-row justify-center gap-4">
                {/* 底部按钮同样使用 Link 跳转 */}
                <Link href="/appointment">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto h-14 px-10 rounded-2xl whitespace-nowrap text-sm sm:text-base shadow-lg shadow-emerald-500/20 font-bold" 
                  >
                    <span className="whitespace-nowrap">Book Appointment</span> <ArrowRight className="ml-2" size={18} />
                  </Button>
                </Link>
                <Link href="/provider">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto h-14 px-10 rounded-2xl border-white/20 text-white hover:bg-white/10 whitespace-nowrap text-sm sm:text-base font-bold" 
                  >
                    <span className="whitespace-nowrap">Meet Our Doctors</span>
                  </Button>
                </Link>
             </div>
          </div>
        </div>
      </div>

      <div className="py-10 text-center text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase border-t border-slate-50">
         © 2026 GREENLIFEMED GROUP • EXCELLENCE IN MEDICINE
      </div>

    </div>
  );
}