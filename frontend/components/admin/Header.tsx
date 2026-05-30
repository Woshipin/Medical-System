"use client";

import React from 'react';
import Link from 'next/link';
import { Menu, Activity, ChevronRight, User } from 'lucide-react';
import { useAdminAuth, ADMIN_ROLE_NAMES } from '@/app/contexts/AdminAuthContext'; // 引入真实状态

export const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  // 抓取当前登录用户的数据
  const { user, isInitialized } = useAdminAuth();

  // 处理角色显示名称
  const roleName = user ? (
    typeof user.roleValue === 'number' 
      ? ADMIN_ROLE_NAMES?.[user.roleValue] || user.role 
      : user.role
  ) : 'STAFF';

  // 处理用户名显示 (如果有全名显示全名，没有则显示邮箱前缀)
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User';

  return (
    <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-40 relative">
      {/* 左侧：菜单按钮与移动端 Logo */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick} 
          className="p-2 -ml-2 md:ml-0 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>

        <div className="md:hidden flex items-center gap-2">
          <div className="bg-emerald-500 p-1.5 rounded-lg text-white">
            <Activity size={18} />
          </div>
          <span className="font-black text-slate-800 text-lg tracking-tighter">
            Medicare<span className="text-emerald-500">Pro</span>
          </span>
        </div>
      </div>

      {/* 右侧：动态 Profile 按钮 */}
      <div className="flex items-center">
        <Link
          href="/admin/admin-profile"
          className="flex items-center gap-2.5 p-2 rounded-[18px] border border-emerald-300 bg-emerald-50/10 hover:bg-emerald-50/30 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          aria-label="View Admin Profile"
        >
          {/* 头像 Icon */}
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <User size={18} className="text-emerald-600" />
          </div>
          
          {/* 真实用户信息绑定 */}
          <div className="flex flex-col text-left">
            <span className="text-xs md:text-sm font-semibold text-[#1e293b] leading-tight max-w-[120px] truncate">
              {isInitialized ? displayName : 'Loading...'}
            </span>
            <span className="text-[10px] md:text-xs text-slate-400 font-bold uppercase">
              {isInitialized ? roleName : '---'}
            </span>
          </div>

          <ChevronRight size={14} className="text-slate-400 hidden sm:block" />
        </Link>
      </div>
    </header>
  );
};