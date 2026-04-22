// src/components/Hero3DElement.tsx
"use client";
import React, { useRef, useState } from 'react';
import { Activity, Heart, ShieldCheck, Calendar, Users, Bell } from 'lucide-react';

export const Hero3DElement = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRotation({ 
      x: ((y - rect.height / 2) / (rect.height / 2)) * -10, 
      y: ((x - rect.width / 2) / (rect.width / 2)) * 10 
    });
  };

  return (
    // 使用 scale 确保在不同屏幕下 3D 卡片大小合适
    <div 
      className="relative w-full flex items-center justify-center perspective-1000 py-10 scale-[0.8] sm:scale-90 md:scale-95 lg:scale-100 transition-transform duration-500"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setRotation({ x: 0, y: 0 })}
    >
      <div
        ref={cardRef}
        className="relative w-[300px] sm:w-[350px] h-[450px] transition-transform duration-200 ease-out preserve-3d"
        style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
      >
        {/* 卡片内部设计保持不变，但在 iPad 上会有更好的容器适配 */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden">
                <img src="https://i.pravatar.cc/150?img=32" alt="User" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Patient Portal</p>
                <p className="text-sm font-bold text-slate-800">Sarah Jenkins</p>
              </div>
            </div>
            <Bell size={18} className="text-slate-400" />
          </div>
          
          <div className="flex-1 bg-emerald-50/50 rounded-3xl p-5 border border-emerald-100 mb-4 shadow-inner">
            <div className="flex justify-between text-xs font-bold text-emerald-600 mb-4">
              <span className="flex items-center gap-1"><Activity size={14}/> Vital Signs</span>
              <span>Live</span>
            </div>
            <div className="text-4xl font-black text-slate-800">72 <span className="text-sm text-slate-400">bpm</span></div>
            <div className="h-16 flex items-end gap-1 mt-6">
              {[40, 70, 45, 90, 65, 80, 50, 75].map((h, i) => (
                <div key={i} className="flex-1 bg-emerald-400 rounded-t-sm" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                <Users size={16} className="mx-auto text-blue-500 mb-1" />
                <p className="text-[10px] text-slate-400 font-bold">Doctor</p>
                <p className="text-xs font-bold text-slate-700">Dr. Smith</p>
             </div>
             <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                <Calendar size={16} className="mx-auto text-purple-500 mb-1" />
                <p className="text-[10px] text-slate-400 font-bold">Next Appt</p>
                <p className="text-xs font-bold text-slate-700">Oct 24</p>
             </div>
          </div>
        </div>

        {/* Floating Heart Badge */}
        <div className="absolute -top-6 -right-6 bg-white p-3 rounded-2xl shadow-xl border border-white flex items-center gap-2 animate-bounce" style={{ transform: 'translateZ(50px)' }}>
          <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center"><Heart size={18} fill="currentColor"/></div>
          <span className="text-xs font-bold text-slate-700">Perfect</span>
        </div>
      </div>
    </div>
  );
};