"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  roleValue?: number;
}

export const ADMIN_ROLE_NAMES: { [key: number]: string } = {
  0: "Super Admin",
  1: "Admin",
  2: "Doctor"
};

interface AdminAuthContextType {
  user: AdminUser | null;
  token: string | null;
  login: (userData: AdminUser, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isInitialized: boolean; 
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname(); // 监听当前路由路径

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  }, [router]);

  // ==========================================
  // 1. 初始化时加载本地存储
  // ==========================================
  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');

    if (storedToken && storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        logout();
      }
    }
    setIsInitialized(true);
  }, [logout]); 

  // ==========================================
  // 2. 【核心修复】：监听路由变化！每次点击菜单切换页面，都去后台查一次岗
  // ==========================================
  useEffect(() => {
    const checkUserStatus = async () => {
      const storedToken = localStorage.getItem('admin_token');
      // 如果没有 token，或者当前在登录/注册页，不需要查岗
      if (!storedToken || pathname.includes('/login') || pathname.includes('/register')) return;

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api';
      
      try {
        const res = await fetch(`${API_BASE_URL}/admin/me`, { 
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        
        // 如果后端发现数据库里没这个人了，会返回 401
        if (res.status === 401) {
          console.warn("账号已被删除，强制踢出系统");
          logout();
        }
      } catch (e) {
        // 网络错误忽略
      }
    };

    // 只要 pathname (路由) 发生变化，就会执行这个函数
    checkUserStatus();
  }, [pathname, logout]); 

  // ==========================================
  // 3. 全局 Fetch 拦截器 (拦截你在页面里点的各种按钮请求)
  // ==========================================
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401 && !pathname.includes('/login')) {
        console.warn("API请求被拒绝，Token失效，强制登出");
        logout();
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch; 
    };
  }, [logout, pathname]);

  const login = (userData: AdminUser, authToken: string) => {
    if (!userData || !authToken) return;
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    localStorage.setItem('admin_token', authToken);
  };

  return (
    <AdminAuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      isAuthenticated: !!user,
      isInitialized
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};