// app/(frontend)/appointment/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link'; // 导入 Link 组件
import { useRouter } from 'next/navigation'; // 导入路由器
import { Button } from '@/components/frontend/Button';
import { DOCTORS } from '@/constants/frontend/constants';
import { 
  CheckCircle, Calendar, Clock, User, Phone, Mail, 
  FileText, AlertCircle, ChevronLeft, ChevronRight, 
  MapPin, Sparkles, HeartPulse
} from 'lucide-react';

/**
 * 【重构说明】
 * 1. 使用 export default：确保页面可以被 Next.js 路由正确加载。
 * 2. 移除 Props：不再通过父组件传参，页面导航改为 URL 驱动。
 * 3. 路由处理：
 *    - "Back to Home" 使用 <Link> 实现最快跳转。
 *    - "Done & Home" 使用 router.push 实现逻辑跳转。
 */
export default function AppointmentPage() {
  const router = useRouter(); // 初始化路由器
  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    reason: ''
  });

  const upcomingDates = [
    { day: "Today", date: "Oct 24" },
    { day: "Tomorrow", date: "Oct 25" },
    { day: "Mon", date: "Oct 27" },
    { day: "Tue", date: "Oct 28" },
    { day: "Wed", date: "Oct 29" },
    { day: "Thu", date: "Oct 30" },
  ];

  const timeSlots = ["09:00 AM", "10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "04:30 PM"];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);
  const getDoctor = (id: number | null) => DOCTORS.find(d => d.id === id);

  // 统一样式定义
  const activeStepClass = "bg-emerald-600 text-white border-white shadow-lg ring-4 ring-emerald-100 scale-110";
  const inactiveStepClass = "bg-slate-100 text-slate-400 border-white";
  const selectedItemStyle = "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 text-slate-900 shadow-md";
  const defaultItemStyle = "border-slate-200 bg-white hover:border-emerald-300 text-slate-600";
  const inputBaseStyle = "w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition-all shadow-sm";

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-emerald-100">
      
      {/* ================= HERO & HEADER AREA ================= */}
      <div className="relative pt-24 pb-12 md:pt-36 md:pb-20 px-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-b border-emerald-50">
        
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

        <div className="max-w-[1400px] mx-auto text-center relative z-10 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/50 rounded-lg text-emerald-700 font-bold text-[10px] uppercase tracking-[0.2em] mb-6">
            <Sparkles size={14} /> Instant Booking
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight mb-4">
            Book an <span className="text-emerald-500">Appointment</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed px-2">
            Secure your slot in minutes. Follow our simple steps to meet your specialist.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 -mt-10 md:-mt-16 relative z-30">
        
        {/* ================= STEP INDICATOR ================= */}
        <div className="mb-12 md:mb-20">
          <div className="relative flex justify-between items-center max-w-2xl mx-auto">
             <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 rounded-full -z-10"></div>
             <div 
                className="absolute top-5 left-0 h-1 bg-emerald-500 rounded-full -z-10 transition-all duration-700 ease-in-out"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
             ></div>

             {[
               { id: 1, label: 'Selection' },
               { id: 2, label: 'Patient Info' },
               { id: 3, label: 'Review' }
             ].map((s) => (
               <div key={s.id} className="flex flex-col items-center">
                 <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-4 flex items-center justify-center font-black text-sm md:text-lg transition-all duration-500 ${step >= s.id ? activeStepClass : inactiveStepClass}`}>
                   {step > s.id ? <CheckCircle size={20} /> : s.id}
                 </div>
                 <span className={`mt-3 text-[10px] md:text-xs font-black uppercase tracking-widest ${step >= s.id ? 'text-emerald-700' : 'text-slate-300'}`}>
                   {s.label}
                 </span>
               </div>
             ))}
          </div>
        </div>

        {/* ================= MAIN CONTENT CARD ================= */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 border border-white flex flex-col overflow-hidden min-h-[550px]">
           
           {/* STEP 1: SELECTION */}
           {step === 1 && (
             <div className="p-6 md:p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4">
                <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><User size={20}/></div>
                      Choose Specialist
                   </h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {DOCTORS.slice(0, 6).map((doc) => (
                        <button key={doc.id} onClick={() => setSelectedDoctor(doc.id)} className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${selectedDoctor === doc.id ? selectedItemStyle : defaultItemStyle}`}>
                          <img src={doc.image} className="w-12 h-12 rounded-full object-cover border border-slate-100" alt="" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{doc.name}</p>
                            <p className="text-xs opacity-70 truncate">{doc.specialty}</p>
                          </div>
                        </button>
                      ))}
                   </div>
                </div>

                <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Calendar size={20}/></div>
                      Available Dates
                   </h3>
                   <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x px-1">
                      {upcomingDates.map((item, i) => (
                        <button key={i} onClick={() => setSelectedDate(item.date)} className={`flex-shrink-0 w-24 p-4 rounded-2xl border text-center transition-all snap-start ${selectedDate === item.date ? selectedItemStyle : defaultItemStyle}`}>
                          <p className="text-[10px] font-black uppercase mb-1 opacity-60">{item.day}</p>
                          <p className="text-lg font-bold">{item.date}</p>
                        </button>
                      ))}
                   </div>
                </div>

                <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Clock size={20}/></div>
                      Select Time
                   </h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {timeSlots.map((time) => (
                        <button key={time} onClick={() => setSelectedTime(time)} className={`py-3 rounded-xl text-xs font-black border transition-all ${selectedTime === time ? selectedItemStyle : defaultItemStyle}`}>
                          {time}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {/* STEP 2: PATIENT INFO */}
           {step === 2 && (
             <div className="p-6 md:p-12 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-right-4">
                <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                   <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={24}/></div>
                   Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2 space-y-2">
                      <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider ml-1">Full Name</label>
                      <input 
                        type="text" name="fullName" value={formData.fullName} onChange={handleInputChange}
                        className={inputBaseStyle}
                        placeholder="e.g. John Doe"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider ml-1">Phone Number</label>
                      <input 
                        type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                        className={inputBaseStyle}
                        placeholder="+1 (555) 000-0000"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider ml-1">Email Address</label>
                      <input 
                        type="email" name="email" value={formData.email} onChange={handleInputChange}
                        className={inputBaseStyle}
                        placeholder="john@example.com"
                      />
                   </div>
                   <div className="md:col-span-2 space-y-2">
                      <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider ml-1">Symptoms / Reason for Visit</label>
                      <textarea 
                        name="reason" value={formData.reason} onChange={handleInputChange} rows={4}
                        className={`${inputBaseStyle} resize-none`}
                        placeholder="Briefly describe why you are booking an appointment..."
                      />
                   </div>
                </div>
             </div>
           )}

           {/* STEP 3: REVIEW */}
           {step === 3 && (
             <div className="p-6 md:p-12 max-w-4xl mx-auto w-full animate-in zoom-in-95">
                <h3 className="text-2xl font-bold text-slate-900 mb-10 text-center">Confirm Your Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100 space-y-6">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Appointment Detail</p>
                      <div className="flex items-center gap-4">
                         <img src={getDoctor(selectedDoctor)?.image} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt="" />
                         <div>
                            <p className="font-bold text-slate-900 text-lg">{getDoctor(selectedDoctor)?.name}</p>
                            <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest">{getDoctor(selectedDoctor)?.specialty}</p>
                         </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         <div className="bg-white px-4 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-sm flex items-center gap-2"><Calendar size={14} className="text-emerald-500" /> {selectedDate}</div>
                         <div className="bg-white px-4 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-sm flex items-center gap-2"><Clock size={14} className="text-emerald-500" /> {selectedTime}</div>
                      </div>
                   </div>
                   <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 space-y-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Detail</p>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3"><User size={16} className="text-slate-400" /> <span className="font-bold text-slate-800">{formData.fullName}</span></div>
                        <div className="flex items-center gap-3"><Phone size={16} className="text-slate-400" /> <span className="text-sm text-slate-600">{formData.phone}</span></div>
                        <div className="flex items-center gap-3"><Mail size={16} className="text-slate-400" /> <span className="text-sm text-slate-600">{formData.email}</span></div>
                        <div className="p-4 bg-white rounded-xl border border-slate-100 text-xs text-slate-500 italic leading-relaxed">"{formData.reason || 'No description provided'}"</div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* STEP 4: SUCCESS */}
           {step === 4 && (
             <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000 min-h-[500px]">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-inner animate-bounce">
                  <HeartPulse size={48} />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Confirmed!</h2>
                <p className="text-slate-500 text-lg max-w-md leading-relaxed mb-10 px-4">
                   Your visit with <span className="text-emerald-600 font-bold">{getDoctor(selectedDoctor)?.name}</span> has been scheduled for <span className="font-bold text-slate-900">{selectedDate} at {selectedTime}</span>.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4">
                   <Button variant="outline" className="h-14 rounded-xl px-10" onClick={() => window.print()}>Print Ticket</Button>
                   {/* 成功后跳转回首页 */}
                   <Button className="h-14 rounded-xl px-10" onClick={() => router.push('/home')}>Done & Home</Button>
                </div>
             </div>
           )}

           {/* FOOTER NAVIGATION */}
           {step < 4 && (
             <div className="mt-auto bg-slate-50/80 border-t border-slate-100 p-6 md:p-10 flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="w-full sm:w-auto text-center sm:text-left">
                  {step > 1 && (
                    <button onClick={prevStep} className="text-slate-400 font-bold hover:text-emerald-600 flex items-center gap-1 transition-all mx-auto sm:mx-0">
                      <ChevronLeft size={20} /> Back to Previous
                    </button>
                  )}
                </div>

                <div className="w-full sm:w-auto">
                   <Button 
                     fullWidth
                     onClick={step === 3 ? () => setStep(4) : nextStep}
                     disabled={
                       (step === 1 && (!selectedDoctor || !selectedDate || !selectedTime)) ||
                       (step === 2 && (!formData.fullName || !formData.phone || !formData.email))
                     }
                     className="h-14 px-12 rounded-2xl shadow-xl shadow-emerald-500/20 font-black tracking-wide"
                   >
                     {step === 3 ? "Confirm Appointment" : "Continue to Next Step"} 
                     {step < 3 && <ChevronRight size={20} className="ml-2" />}
                   </Button>
                </div>
             </div>
           )}

        </div>
      </div>

    </div>
  );
}