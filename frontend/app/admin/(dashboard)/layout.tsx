"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { Header } from "@/components/admin/Header";
import { AdminAuthProvider, useAdminAuth } from "@/app/contexts/AdminAuthContext";
import { AlertCircle, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

// --- 独立的红色警告弹窗：只有非法闯入才会展示 ---
const AccessDeniedAlert = () => {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => router.replace("/admin/login"), 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-sans relative overflow-hidden">
      <div className="relative z-50 bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner border border-red-100">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
          Please login first to access the secure admin dashboard.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full w-full">
          <Loader2 size={14} className="animate-spin" /> Redirecting to login...
        </div>
      </div>
    </div>
  );
};

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isAuthenticated, isInitialized } = useAdminAuth();
  const pathname = usePathname();
  
  const isPublicPath = pathname === "/admin/login" || pathname === "/admin/register";

  // 1. 初始化中
  if (!isInitialized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  // 2. 公开页面直接放行
  if (isPublicPath) {
    return <>{children}</>;
  }

  // 3. 没登录，拦截（展示独立组件，组件负责2秒后跳转）
  if (!isAuthenticated) {
    return <AccessDeniedAlert />;
  }

  // 4. 正常渲染后台主体
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  );
}