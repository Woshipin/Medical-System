"use client"; // 启用客户端渲染模式

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'; // 引入 React 核心库及钩子
import { useRouter, usePathname } from 'next/navigation'; // 引入 Next.js 路由和路径依赖

export interface User { // 定义患者用户实体接口
  id: string; // 用户 ID
  fullName: string; // 真实姓名
  email: string; // 电子邮箱
  role?: string; // 角色描述
  roleValue?: number; // 角色整型值
}

export const ROLE_NAMES: { [key: number]: string } = { // 声明角色静态字典映射
  0: "Super Admin", // 0 代表超级管理员
  1: "Admin", // 1 代表普通管理员
  2: "Doctor", // 2 代表医生
  3: "Patient" // 3 代表普通患者
};

interface AuthContextType { // 声明患者端上下文类型
  user: User | null; // 用户实体，未登录则为 null
  token: string | null; // 兼容性保留字段（现在由 Cookie 托管，此值始终为 null）
  login: (userData: User, token?: string) => void; // 【修复】：将 token 改为可选参数（?），兼容旧组件的调用
  logout: () => void; // 登出方法
  isAuthenticated: boolean; // 是否登录的布尔标志
  isInitialized: boolean; // 初始化加载状态是否完成的标志
}

const AuthContext = createContext<AuthContextType | undefined>(undefined); // 实例化 React 上下文

export const AuthProvider = ({ children }: { children: ReactNode }) => { // 导出提供者组件
  const [user, setUser] = useState<User | null>(null); // 初始化用户状态为 null
  const [isInitialized, setIsInitialized] = useState(false); // 初始化加载状态默认为 false
  const router = useRouter(); // 注册 Next 路由导航
  const pathname = usePathname(); // 注册路径监听

  // 保存原生 fetch 引用，以便在拦截器外以及注销时安全使用
  const originalFetch = typeof window !== 'undefined' ? window.fetch : null!;

  // ==========================================
  // 登出方法（向后端发送注销请求并清除本地 Cookie）
  // ==========================================
  const logout = useCallback(async () => { 
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api'; 
    try {
      // 1. 呼叫后端注销接口，清除 HttpOnly 患者登录安全 Cookie
      await originalFetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include' 
      });
    } catch (e) {
      // 忽略网络异常，确保本地清除动作强制执行成功
    }

    setUser(null); // 清空全局内存中的用户对象
    localStorage.removeItem('user'); // 移除本地物理存储中残留的患者非敏感缓存
    router.push('/login'); // 将浏览器强制重定向引导至患者登录页
  }, [router]); 

  // ==========================================
  // 1. 初始化时自动向后端 check-auth 探查 Cookie 是否有效（完全移除拦截）
  // ==========================================
  useEffect(() => {
    const initializeAuth = async () => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api'; 
      
      try {
        // 【关键修复】：不拦截任何页面，只要刷新，哪怕在 /login 页面也去查一下状态！
        // 这样如果你有有效的 Cookie，就能实现打开登录页自动跳入首页的“无感登录”。
        const res = await originalFetch(`${API_BASE_URL}/auth/check-auth`, {
          method: 'GET',
          credentials: 'include' // 强行显式加上 credentials，防止初始化时漏带 Cookie
        });
        
        if (res.ok) { 
          const result = await res.json(); 
          if (result.success && result.data?.user) { 
            setUser(result.data.user); // 自动还原用户信息到 React 全局状态
            localStorage.setItem('user', JSON.stringify(result.data.user)); // 缓存用户信息备用
          } else {
            setUser(null); 
          }
        } else {
          setUser(null); 
        }
      } catch (e) {
        setUser(null); 
      } finally {
        setIsInitialized(true); // 标记初始化完成，彻底防止登录态闪烁
      }
    };

    initializeAuth(); 
  }, [pathname]); // 当路径变化时自动触发检测

  // ==========================================
  // 2. 全局安全 Fetch 拦截器 (自动注入 credentials: 'include')
  // ==========================================
  useEffect(() => {
    if (typeof window === 'undefined') return; 

    const rawFetch = window.fetch; 
    window.fetch = async (input, init) => { // 覆写全局网络请求
      const requestUrl = typeof input === 'string' ? input : (input as Request).url; 
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api'; 

      let modifiedInit = init || {}; 

      // 只要是发给后端的请求，自动附加跨域 Cookie 权限
      if (requestUrl.startsWith(API_BASE_URL)) {
        modifiedInit = {
          ...modifiedInit,
          credentials: 'include' 
        };
      }

      const response = await rawFetch(input, modifiedInit); 

      // 任何业务接口若报 401 (且不是登录注册验证时)，说明 Cookie 失效，自动踢出
      if (response.status === 401 && 
          !requestUrl.includes('/login') && 
          !requestUrl.includes('/register') && 
          !requestUrl.includes('/check-auth')) {
        console.warn("API请求被拒绝，患者 Cookie 失效，强制登出"); 
        logout(); 
      }
      return response; 
    };

    return () => {
      window.fetch = rawFetch; // 安全释放拦截器
    };
  }, [logout]); 

  // ==========================================
  // 3. 登录成功回调方法
  // ==========================================
  // 【修复】：接受第二个可选参数 authToken 以兼容 LoginPage 旧写法，但在内部忽略它，彻底告别明文 Token！
  const login = (userData: User, authToken?: string) => { 
    if (!userData) return; 
    setUser(userData); 
    localStorage.setItem('user', JSON.stringify(userData)); 
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token: null, // JWT Token 已隐式保存于 Cookie，此处返回 null
      login, 
      logout, 
      isAuthenticated: !!user, // 只要内存中的 user 有值，代表身份校验通过
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