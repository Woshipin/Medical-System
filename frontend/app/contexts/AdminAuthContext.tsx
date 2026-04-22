"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// 定义 Admin 用户数据的接口
export interface AdminUser {
  id: string;
  fullName: string;
  role: string;
  roleValue: number;
}

// 角色映射字典
export const ADMIN_ROLE_NAMES: { [key: number]: string } = {
  0: "Super Admin",
  1: "Admin",
  2: "Doctor"
};

// 定义 Context 的内容
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

  // 组件挂载时，从 localStorage 读取 admin 的专属数据
  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsInitialized(true);
  }, []);

  // 登录方法：保存数据到 state 和 localStorage
  const login = (userData: AdminUser, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    localStorage.setItem('admin_token', authToken);
  };

  // 登出方法：清除 admin 数据并跳转回 admin 登录页
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
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

// 自定义 Hook，方便在 Admin 组件中调用
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};