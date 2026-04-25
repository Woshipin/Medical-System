"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // 【新增】引入 usePathname

// Interface for user data
export interface User {
  id: string;
  fullName: string;
  email: string;
  role?: string;
  roleValue?: number;
}

export const ROLE_NAMES: { [key: number]: string } = {
  0: "Super Admin",
  1: "Admin",
  2: "Doctor",
  3: "Patient"
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname(); // 【新增】获取当前路由

  // 【重构】：将 logout 包裹在 useCallback 中，方便 useEffect 稳定调用
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  }, [router]);

  // ==========================================
  // 1. 初始化读取本地存储
  // ==========================================
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        if (storedUser !== "undefined" && storedUser !== "null") {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch (error) {
        console.error("Failed to parse user info from local storage:", error);
        logout();
      }
    }
    
    setIsInitialized(true);
  }, [logout]);

  // ==========================================
  // 2. 【核心修改】：监听路由变化！每次切换页面都去后台查一次岗
  // ==========================================
  useEffect(() => {
    const checkUserStatus = async () => {
      const storedToken = localStorage.getItem('token');
      // 如果没有 token，或者当前在登录/注册页，不发请求
      if (!storedToken || pathname.includes('/login') || pathname.includes('/register')) return;

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api';
      
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, { 
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        
        // 如果后端发现数据库里没这个人了，会返回 401
        if (res.status === 401) {
          console.warn("前台账号已被删除，强制踢出");
          logout();
        }
      } catch (e) {
        // 网络错误忽略
      }
    };

    checkUserStatus();
  }, [pathname, logout]); 

  // ==========================================
  // 3. 全局 Fetch 拦截器 (拦截页面里触发的其它业务请求)
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

  const login = (userData: User, authToken: string) => {
    if (!userData || !authToken) {
      console.error("Login failed: User info or Token is missing");
      return;
    }

    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      isAuthenticated: !!user,
      isInitialized
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};