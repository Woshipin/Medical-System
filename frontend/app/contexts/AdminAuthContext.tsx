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
  const pathname = usePathname();

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  }, [router]);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');

    if (storedToken && storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
      }
    }
    setIsInitialized(true);
  }, []);

  // ==========================================
  // 核心修复：全局 Fetch 拦截器 (解决数据库清空后依然保留登录状态的问题)
  // 如果后端返回 401 (Unauthorized)，说明查无此人或Token失效，强制登出
  // ==========================================
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      // 如果收到 401 且当前不在登录页，立刻清除数据并踢回登录页
      if (response.status === 401 && !pathname.includes('/login')) {
        console.warn("Session invalid or user deleted from DB. Force logout.");
        logout();
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch; // 组件卸载时恢复原状
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