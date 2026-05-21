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
    { id: 'activity_log', label: 'Activity Log', icon: ShieldCheck, href: '/admin/activity-log' },
    { id: 'users', label: 'System Users', icon: ShieldCheck, href: '/admin/users' },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope, href: '/admin/doctors' },
    { id: 'services', label: 'Services', icon: Activity, href: '/admin/services' },
    { id: 'departments', label: 'Departments', icon: Building2, href: '/admin/departments' },
    { id: 'positions', label: 'Doctor Positions', icon: Briefcase, href: '/admin/positions' },
    { id: 'levels', label: 'Doctor Levels', icon: Award, href: '/admin/levels' },
  ];

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout(); 
    window.location.replace('/admin/login');
  };

  // 移动端点击任意菜单后，自动收起侧边栏
  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* 移动端遮罩层 (点击遮罩关闭菜单) */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 
        核心修复：
        移动端 (<md): 使用 fixed 脱离文档流，用 translate-x 控制划入划出。固定 w-64。
        桌面端 (>=md): 使用 relative 在文档流内，用 w-64 和 w-20 控制展开与收起。
      */}
      <aside 
        className={`
          fixed md:relative top-0 left-0 h-screen bg-slate-900 text-slate-300 
          transition-all duration-300 ease-in-out flex flex-col shadow-2xl z-50 md:z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isOpen ? 'w-64' : 'w-64 md:w-20'}
        `}
      >
        <div className="flex flex-col border-b border-slate-800/80 shrink-0 pb-4">
          <div className="p-6 flex items-center gap-3 h-20 shrink-0">
            <div className="bg-emerald-500 p-2 rounded-xl text-white shrink-0">
              <Activity size={24} />
            </div>
            {/* 移动端强制显示文字，桌面端根据状态显示 */}
            <span className={`font-black text-white text-xl tracking-tighter whitespace-nowrap overflow-hidden transition-opacity ${!isOpen && 'md:hidden'}`}>
              Medicare<span className="text-emerald-500">Pro</span>
            </span>
          </div>

          {isInitialized && user && (
            <div className={`mx-4 px-3 py-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-3 transition-all duration-300 ${!isOpen && 'md:justify-center md:mx-2'}`}>
              <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg shrink-0">
                <UserCircle size={20} />
              </div>
              <div className={`flex flex-col overflow-hidden whitespace-nowrap ${!isOpen && 'md:hidden'}`}>
                <span className="text-sm font-bold text-white truncate w-[130px]">{user.fullName}</span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
                  {/* 修复：先检查 roleValue 是否为数字，再作为索引取值 */}
                  {typeof user.roleValue === 'number' 
                    ? (ADMIN_ROLE_NAMES?.[user.roleValue] || user.role) 
                    : user.role}
                </span>
              </div>
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
                onClick={handleMenuClick}
                className={`flex items-center gap-4 p-3.5 rounded-xl transition-all group ${
                  isActive 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' 
                  : 'hover:bg-slate-800 hover:text-white'
                } ${!isOpen && 'md:justify-center'}`}
              >
                <item.icon 
                  size={22} 
                  className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} 
                />
                <span className={`font-bold text-sm tracking-wide whitespace-nowrap ${!isOpen && 'md:hidden'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80 shrink-0 mt-auto">
          <button
            onClick={() => setShowLogoutModal(true)} 
            className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all text-slate-400 hover:bg-red-500/10 hover:text-red-400 group ${!isOpen && 'md:justify-center'}`}
          >
            <LogOut size={22} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
            <span className={`font-bold text-sm tracking-wide ${!isOpen && 'md:hidden'}`}>Logout</span>
          </button>
        </div>

        {/* 桌面端折叠按钮（移动端隐藏） */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="hidden md:flex absolute -right-3 top-24 bg-emerald-500 text-white p-1 rounded-full border-4 border-slate-50 shadow-md z-50 hover:bg-emerald-600 transition-colors"
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