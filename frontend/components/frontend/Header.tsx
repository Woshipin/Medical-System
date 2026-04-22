// components/Header.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// 引入所需的图标，增加 LogOut 图标
import { Menu, X, Leaf, User, LogIn, UserPlus, LogOut } from 'lucide-react'; 
// 引入我们的全局状态 Hook (路径请根据你的实际情况调整，通常使用 @/app/contexts/AuthContext)
import { useAuth, ROLE_NAMES } from '@/app/contexts/AuthContext';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // 获取全局登录状态
  const { user, isAuthenticated, logout, isInitialized } = useAuth();

  const navItems = [
    { label: 'Home', href: '/home' },
    { label: 'Departments', href: '/department' },
    { label: 'About Us', href: '/about' },
    { label: 'Services', href: '/service' },
    { label: 'Doctors', href: '/doctor' },
    { label: 'Contact', href: '/contact' },
  ];

  // 导航按钮子组件
  const ActionButton = ({ icon: Icon, label, href }: { icon: any, label: string, href: string }) => {
    const isActive = pathname === href;
    return (
      <Link href={href} className="flex flex-col items-center group gap-1 min-w-[60px]">
        <div className={`transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-500 group-hover:text-emerald-500'}`}>
          <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
        </div>
        <span className={`text-[11px] font-bold uppercase tracking-wide ${isActive ? 'text-emerald-500' : 'text-slate-500 group-hover:text-emerald-500'}`}>
          {label}
        </span>
      </Link>
    );
  };

  // 登出按钮子组件 (保持与 ActionButton 相同样式)
  const LogoutButton = () => (
    <button onClick={logout} className="flex flex-col items-center group gap-1 min-w-[60px]">
      <div className="text-slate-500 group-hover:text-red-500 transition-colors">
        <LogOut size={24} strokeWidth={1.5} />
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 group-hover:text-red-500">
        Logout
      </span>
    </button>
  );

  return (
    <header className="sticky top-0 z-[100] bg-white border-b border-slate-100 shadow-sm">
      <div className="container mx-auto px-4 h-20 md:h-24 flex items-center justify-between">
        
        <Link href="/home" className="flex items-center space-x-2 group shrink-0">
          <div className="text-emerald-500 bg-emerald-50 p-2 rounded-xl group-hover:bg-emerald-100 transition-colors">
            <Leaf size={28} strokeWidth={2.5} />
          </div>
          <span className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            GreenLife<span className="text-emerald-500">Med</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-base font-semibold transition-all ${
                pathname === item.href ? 'text-emerald-500' : 'text-slate-600 hover:text-emerald-500'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-6 border-l pl-6 h-10">
              
              {/* 为了防止页面加载闪烁，等 isInitialized 为 true 时才渲染 */}
              {!isInitialized ? (
                 <div className="flex gap-6 animate-pulse">
                    <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
                    <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
                 </div>
              ) : isAuthenticated ? (
                 // =========== 登录后的状态 ===========
                 <>
                    <div className="flex flex-col text-right mr-2 justify-center hidden lg:flex">
                      <span className="text-sm font-bold text-slate-800">{user?.fullName}</span>
                      {/* 2. 使用 ROLE_NAMES 映射，通过 roleValue 获取友好的名字 */}
                      <span className="text-xs text-slate-400">
                        {ROLE_NAMES[user?.roleValue ?? 3] || "User"}
                      </span>
                    </div>
                    <ActionButton icon={User} label="Profile" href="/profile" />
                    <div className="h-6 w-[1px] bg-slate-200" />
                    <LogoutButton />
                 </>
              ) : (
                 // =========== 未登录的状态 ===========
                 <>
                    <ActionButton icon={LogIn} label="Login" href="/login" />
                    <ActionButton icon={UserPlus} label="Register" href="/register" />
                 </>
              )}
           </div>

          <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>
      
      {/* 移动端展开菜单 */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-slate-100 shadow-xl z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col p-6 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-lg font-bold ${pathname === item.href ? 'text-emerald-500' : 'text-slate-600'}`}
              >
                {item.label}
              </Link>
            ))}
            
            <div className="grid grid-cols-3 gap-2 pt-6 border-t border-slate-100">
               {/* 移动端同样需要判断登录状态 */}
               {isInitialized && isAuthenticated ? (
                 <>
                   <ActionButton icon={User} label="Profile" href="/profile" />
                   <LogoutButton />
                 </>
               ) : (
                 <>
                   <ActionButton icon={LogIn} label="Login" href="/login" />
                   <ActionButton icon={UserPlus} label="Register" href="/register" />
                 </>
               )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};