"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; 
import { 
  LayoutDashboard, Stethoscope, Activity, 
  Building2, ChevronLeft, LogOut, UserCircle,
  ShieldCheck, LogOut as LogOutIcon, Users, MapPin, Award, ChevronDown, UserCheck
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

  // 1. 普通的一级导航项
  const generalMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { id: 'activity_log', label: 'Activity Log', icon: ShieldCheck, href: '/admin/activity-log' },
    { id: 'users', label: 'System Users', icon: ShieldCheck, href: '/admin/users' },
    { id: 'services', label: 'Services', icon: Activity, href: '/admin/services' },
    { id: 'departments', label: 'Departments', icon: Building2, href: '/admin/departments' },
    { id: 'genders', label: 'Genders', icon: Users, href: '/admin/genders' }, // 新增性别管理项
  ];

  // 2. 医生配置组下的二级子项 (Doctor在最上面)
  const doctorMenuItems = [
    { id: 'doctors', label: 'Doctors', icon: UserCheck, href: '/admin/doctors' },
    { id: 'office_locations', label: 'Office Locations', icon: MapPin, href: '/admin/office-locations' },
    { id: 'specialties', label: 'Specialties', icon: Activity, href: '/admin/specialties' },
    { id: 'titles', label: 'Titles', icon: Award, href: '/admin/titles' },
  ];

  // 判定医生组下是否有任意子项正处于激活状态
  const isDoctorActive = doctorMenuItems.some(item => pathname === item.href);

  // 状态管理：控制医生组下拉框的打开和收起
  const [isDoctorGroupOpen, setIsDoctorGroupOpen] = useState(false);

  // 当路径变动时，若访问的是医生组子路由，自动展开下拉框，提升用户体验
  useEffect(() => {
    if (isDoctorActive) {
      setIsDoctorGroupOpen(true);
    }
  }, [pathname, isDoctorActive]);

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
      {/* 移动端遮罩层 */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed md:relative top-0 left-0 h-screen bg-slate-900 text-slate-300 
          transition-all duration-300 ease-in-out flex flex-col shadow-2xl z-50 md:z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isOpen ? 'w-64' : 'w-64 md:w-20'}
        `}
      >
        {/* Header Logo */}
        <div className="flex flex-col border-b border-slate-800/80 shrink-0 pb-4">
          <div className="p-6 flex items-center gap-3 h-20 shrink-0">
            <div className="bg-emerald-500 p-2 rounded-xl text-white shrink-0">
              <Activity size={24} />
            </div>
            <span className={`font-black text-white text-xl tracking-tighter whitespace-nowrap overflow-hidden transition-opacity ${!isOpen && 'md:hidden'}`}>
              Medicare<span className="text-emerald-500">Pro</span>
            </span>
          </div>

          {/* User Profile */}
          {isInitialized && user && (
            <div className={`mx-4 px-3 py-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-3 transition-all duration-300 ${!isOpen && 'md:justify-center md:mx-2'}`}>
              <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg shrink-0">
                <UserCircle size={20} />
              </div>
              <div className={`flex flex-col overflow-hidden whitespace-nowrap ${!isOpen && 'md:hidden'}`}>
                <span className="text-sm font-bold text-white truncate w-[130px]">{user.fullName}</span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
                  {typeof user.roleValue === 'number' 
                    ? (ADMIN_ROLE_NAMES?.[user.roleValue] || user.role) 
                    : user.role}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 px-4 pt-4 pb-4 space-y-2 overflow-y-auto custom-scrollbar">
          {/* 渲染普通一级导航 */}
          {generalMenuItems.map((item) => {
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

          {/* ========================================== */}
          {/* 【重构新增】：医生管理配置下拉组 (Dropdown) */}
          {/* ========================================== */}
          <div className="space-y-1.5">
            <button
              onClick={() => {
                if (!isOpen) {
                  setIsOpen(true); // 缩起状态下点击，先展开侧边栏
                }
                setIsDoctorGroupOpen(!isDoctorGroupOpen);
              }}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all group ${
                isDoctorActive && !isDoctorGroupOpen
                  ? 'bg-slate-800/80 text-emerald-400 font-bold' 
                  : 'hover:bg-slate-800 hover:text-white'
              } ${!isOpen && 'md:justify-center'}`}
            >
              <div className="flex items-center gap-4">
                <Stethoscope 
                  size={22} 
                  className={`shrink-0 ${isDoctorActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} 
                />
                <span className={`font-bold text-sm tracking-wide whitespace-nowrap ${!isOpen && 'md:hidden'}`}>
                  Doctor Config
                </span>
              </div>
              {isOpen && (
                <ChevronDown 
                  size={16} 
                  className={`text-slate-400 transition-transform duration-300 shrink-0 ${isDoctorGroupOpen ? 'rotate-180' : ''}`} 
                />
              )}
            </button>

            {/* 下拉子项列表 */}
            {isDoctorGroupOpen && isOpen && (
              <div className="pl-4 pr-1 py-1.5 space-y-1.5 border-l border-slate-800 ml-6 animate-in fade-in slide-in-from-top-2 duration-200">
                {doctorMenuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={handleMenuClick}
                      className={`flex items-center gap-4 p-3 rounded-xl transition-all group ${
                        isActive 
                        ? 'bg-emerald-600/20 text-emerald-400 font-bold border border-emerald-500/10' 
                        : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                      }`}
                    >
                      <item.icon 
                        size={18} 
                        className={`shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400'}`} 
                      />
                      <span className="font-bold text-xs tracking-wide whitespace-nowrap">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Logout Bottom Area */}
        <div className="p-4 border-t border-slate-800/80 shrink-0 mt-auto">
          <button
            onClick={() => setShowLogoutModal(true)} 
            className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all text-slate-400 hover:bg-red-500/10 hover:text-red-400 group ${!isOpen && 'md:justify-center'}`}
          >
            <LogOut size={22} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
            <span className={`font-bold text-sm tracking-wide ${!isOpen && 'md:hidden'}`}>Logout</span>
          </button>
        </div>

        {/* 桌面端折叠/展开按钮 */}
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
                <LogOutIcon size={32} className="text-red-500 ml-1" />
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

      {/* 
        =========================================================
        【重构新增】：精细化的滚动条定制样式，彻底消除老旧的不雅外观
        =========================================================
      */}
      <style jsx global>{`
        /* 定制滚动条滑道与滑块 */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px; /* 控制滑块的宽度，使其纤细 */
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; /* 轨道背景全透明，无突兀边界 */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155; /* 使用 slate-700 柔和填充色，完美贴合暗灰色的背景 */
          border-radius: 99px; /* 圆角处理 */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #10b981; /* 鼠标悬停时过渡为亮绿色（emerald-500），指示状态 */
        }
      `}</style>
    </>
  );
};