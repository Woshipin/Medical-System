"use client";

import React from 'react';
import { Menu } from 'lucide-react';

export const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center px-6 md:px-8 shrink-0">
      <button 
        onClick={onMenuClick} 
        className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
        aria-label="Toggle Sidebar"
      >
        <Menu size={22} />
      </button>
    </header>
  );
};