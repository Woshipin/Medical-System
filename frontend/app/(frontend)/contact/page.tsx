// app/(frontend)/contact/page.tsx
"use client";

import React from 'react';
import Link from 'next/link'; // 导入 Next.js Link
import { Button } from '@/components/frontend/Button';
import { 
  MapPin, Phone, Mail, Clock, CalendarOff, 
  ChevronLeft, Sparkles, Navigation, Send 
} from 'lucide-react';

/**
 * 【重构说明】
 * 1. 使用 export default：符合 Next.js 页面组件的导出规范。
 * 2. 移除 Props：不再接收 setView，跳转逻辑由 Link 处理。
 * 3. 导航逻辑：左上角的 "Back to Home" 修改为 <Link>，提供更快的客户端路由转场。
 */
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-emerald-100">
      
      {/* ================= HERO SECTION ================= */}
      <div className="relative pt-24 pb-12 md:pt-36 md:pb-20 px-4 bg-gradient-to-br from-[#f0fdf4] via-white to-transparent border-b border-emerald-50">
        
        {/* --- Standardized Top-Left Back Button using Link --- */}
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
            <Sparkles size={14} /> 24/7 Assistance
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 leading-tight tracking-tight mb-6">
            Get in <span className="text-emerald-500">Touch</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed px-2">
            Have questions or need an appointment? Our team is here to support you with expert medical guidance.
          </p>
        </div>
      </div>

      {/* ================= CONTENT GRID ================= */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          
          {/* Left Column: Contact Cards */}
          <div className="space-y-6">
            
            {/* Direct Contact Card */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-8">Reach Out Directly</h2>
              
              <div className="space-y-8">
                {/* Visit */}
                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 mb-1">Visit Us</h3>
                    <p className="text-slate-500 text-sm md:text-base">123 Health Avenue, Wellness District</p>
                    <p className="text-slate-500 text-sm md:text-base">Los Angeles, CA 90210</p>
                    <button className="mt-2 text-emerald-600 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                      Get Directions <Navigation size={12} />
                    </button>
                  </div>
                </div>

                {/* Call */}
                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 mb-1">Call Us</h3>
                    <p className="text-slate-900 font-bold text-lg">+1 (555) 123-4567</p>
                    <p className="text-red-500 text-xs font-bold uppercase tracking-tighter">Emergency: 911</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 mb-1">Email Us</h3>
                    <p className="text-slate-500 text-sm md:text-base break-all font-medium">contact@greenlifemed.com</p>
                    <p className="text-slate-500 text-sm md:text-base break-all font-medium">appointments@greenlifemed.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Opening Hours Card */}
            <div className="bg-emerald-50/50 rounded-[2.5rem] p-8 md:p-10 border border-emerald-100">
               <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                 <Clock className="text-emerald-600" size={20} /> Operation Hours
               </h3>
               
               <div className="space-y-4">
                 {[
                   { day: 'Monday - Friday', time: '8:00 AM - 8:00 PM' },
                   { day: 'Saturday', time: '9:00 AM - 5:00 PM' },
                   { day: 'Sunday', time: '10:00 AM - 2:00 PM', isSunday: true },
                 ].map((item, i) => (
                   <div key={i} className="flex justify-between items-center border-b border-emerald-100 pb-3">
                     <span className="text-slate-600 font-medium text-sm md:text-base">{item.day}</span>
                     <span className={`font-bold text-sm md:text-base ${item.isSunday ? 'text-emerald-700' : 'text-slate-900'}`}>{item.time}</span>
                   </div>
                 ))}
               </div>

               <h3 className="text-xl font-bold text-slate-900 mt-10 mb-6 flex items-center gap-2">
                 <CalendarOff className="text-red-400" size={20} /> Public Holidays
               </h3>
               <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-500 italic">Christmas & New Year</span>
                   <span className="text-red-500 font-black uppercase">Closed</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-500 italic">Other Major Holidays</span>
                   <span className="text-slate-900 font-bold whitespace-nowrap">9:00 AM - 1:00 PM</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Right Column: Interactive Map */}
          <div className="h-full min-h-[400px] lg:min-h-full bg-slate-100 rounded-[3rem] overflow-hidden shadow-2xl relative border-4 border-white">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3305.7152203584424!2d-118.24368368478918!3d34.05223418060601!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2c648fa1d4803%3A0xdec27bf11f9fdee0!2sLos%20Angeles%2C%20CA!5e0!3m2!1sen!2sus!4v1697223456789!5m2!1sen!2sus" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              className="absolute inset-0 w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
            ></iframe>
            
            {/* Map Overlay Button */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block">
              <Button variant="white" className="rounded-full shadow-xl">
                 Open in Google Maps
              </Button>
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