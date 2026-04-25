"use client";

import React from 'react';
import { Menu, Activity } from 'lucide-react';

export const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  return (
    <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-10 relative">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick} 
          className="p-2 -ml-2 md:ml-0 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>

        {/* 仅在移动端显示的 Logo，当侧边栏收起时保持品牌感 */}
        <div className="md:hidden flex items-center gap-2">
          <div className="bg-emerald-500 p-1.5 rounded-lg text-white">
            <Activity size={18} />
          </div>
          <span className="font-black text-slate-800 text-lg tracking-tighter">
            Medicare<span className="text-emerald-500">Pro</span>
          </span>
        </div>
      </div>
    </header>
  );
};