"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; 
import { 
  LayoutDashboard, Stethoscope, Activity, 
  Building2, Briefcase, Award, ChevronLeft,
  ShieldCheck, LogOut, UserCircle
} from 'lucide-react';
import { useAdminAuth, ADMIN_ROLE_NAMES } from '@/app/contexts/AdminAuthContext'; 

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const pathname = usePathname();
  const { user, logout, isInitialized } = useAdminAuth(); 

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { id: 'users', label: 'System Users', icon: ShieldCheck, href: '/admin/users' },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope, href: '/admin/doctors' },
    { id: 'services', label: 'Services', icon: Activity, href: '/admin/services' },
    { id: 'departments', label: 'Departments', icon: Building2, href: '/admin/departments' },
    { id: 'positions', label: 'Doctor Positions', icon: Briefcase, href: '/admin/positions' },
    { id: 'levels', label: 'Doctor Levels', icon: Award, href: '/admin/levels' },
  ];

  // ==========================================
  // 核心修复大招：使用原生强制跳转，彻底斩断死循环
  // ==========================================
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    
    // 1. 执行清空 Token 操作
    logout(); 
    
    // 2. 原生浏览器硬跳转（不要用 router.replace）。这会瞬间销毁当前页面，绝不弹窗，直接去 login。
    window.location.replace('/admin/login');
  };

  return (
    <>
      <aside className={`${isOpen ? 'w-64' : 'w-20'} h-screen bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col relative shadow-2xl z-40`}>
        
        <div className="flex flex-col border-b border-slate-800/80 shrink-0 pb-4">
          <div className="p-6 flex items-center gap-3 h-20 shrink-0">
            <div className="bg-emerald-500 p-2 rounded-xl text-white shrink-0">
              <Activity size={24} />
            </div>
            {isOpen && (
              <span className="font-black text-white text-xl tracking-tighter whitespace-nowrap overflow-hidden">
                Medicare<span className="text-emerald-500">Pro</span>
              </span>
            )}
          </div>

          {isInitialized && user && (
            <div className={`mx-4 px-3 py-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-3 transition-all duration-300 ${!isOpen && 'justify-center mx-2'}`}>
              <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg shrink-0">
                <UserCircle size={20} />
              </div>
              {isOpen && (
                <div className="flex flex-col overflow-hidden whitespace-nowrap">
                  <span className="text-sm font-bold text-white truncate w-[130px]">{user.fullName}</span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
                    {ADMIN_ROLE_NAMES?.[user.roleValue] || user.role}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 pt-4 pb-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-4 p-3.5 rounded-xl transition-all group ${
                  isActive 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' 
                  : 'hover:bg-slate-800 hover:text-white'
                } ${!isOpen && 'justify-center'}`}
              >
                <item.icon 
                  size={22} 
                  className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} 
                />
                {isOpen && <span className="font-bold text-sm tracking-wide whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80 shrink-0 mt-auto">
          <button
            onClick={() => setShowLogoutModal(true)} 
            className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all text-slate-400 hover:bg-red-500/10 hover:text-red-400 group ${!isOpen && 'justify-center'}`}
          >
            <LogOut size={22} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
            {isOpen && <span className="font-bold text-sm tracking-wide">Logout</span>}
          </button>
        </div>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="hidden md:flex absolute -right-3 top-24 bg-emerald-500 text-white p-1 rounded-full border-4 border-slate-50 shadow-md z-50"
        >
          <ChevronLeft size={16} className={`${!isOpen && 'rotate-180'} transition-transform`} />
        </button>
      </aside>

      {/* Logout 确认弹窗 */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowLogoutModal(false)}
          ></div>
          
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 border-2 border-red-500/20 flex flex-col items-center text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
            <div className="p-8 w-full flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner border border-red-100">
                <LogOut size={32} className="text-red-500 ml-1" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2">
                Confirm Logout
              </h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 px-2">
                Are you sure you want to log out of the admin panel? You will need to sign in again to access your dashboard.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowLogoutModal(false)} 
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmLogout} 
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all active:scale-[0.98]"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};