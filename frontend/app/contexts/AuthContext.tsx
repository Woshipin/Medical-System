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
  0: "Super Admin",
  1: "Admin",
  2: "Doctor",
  3: "Patient" // 3 代表普通患者
};

interface AuthContextType { // 声明患者端上下文类型
  user: User | null; // 用户实体
  token: string | null; // 令牌
  login: (userData: User, token: string) => void; // 登录方法
  logout: () => void; // 登出方法
  isAuthenticated: boolean; // 是否登录
  isInitialized: boolean; // 是否初始化完毕
}

const AuthContext = createContext<AuthContextType | undefined>(undefined); // 实例化上下文

export const AuthProvider = ({ children }: { children: ReactNode }) => { // 导出提供者组件
  const [user, setUser] = useState<User | null>(null); // 用户状态
  const [token, setToken] = useState<string | null>(null); // Token 状态
  const [isInitialized, setIsInitialized] = useState(false); // 初始化加载状态
  const router = useRouter(); // 路由导航
  const pathname = usePathname(); // 监听路径变化

  const logout = useCallback(() => { // 声明登出方法
    setUser(null); // 清空内存
    setToken(null); // 清空内存
    localStorage.removeItem('user'); // 移除本地患者用户信息
    localStorage.removeItem('token'); // 移除本地患者 Token
    router.push('/login'); // 将浏览器引导至患者登录页
  }, [router]); // 稳定依赖项

  // ==========================================
  // 1. 初始化读取本地存储
  // ==========================================
  useEffect(() => {
    const storedToken = localStorage.getItem('token'); // 提取 Token
    const storedUser = localStorage.getItem('user'); // 提取用户信息

    if (storedToken && storedUser) { // 若数据均存在
      try {
        if (storedUser !== "undefined" && storedUser !== "null") { // 且数据内容合法
          const parsedUser = JSON.parse(storedUser); // 反序列化为对象
          setUser(parsedUser); // 注入状态
          setToken(storedToken); // 注入状态
        } else {
          logout(); // 异常则执行登出
        }
      } catch (error) {
        console.error("Failed to parse user info from local storage:", error); // 打印异常
        logout(); // 强制登出
      }
    }
    
    setIsInitialized(true); // 标记加载完成
  }, [logout]);

  // ==========================================
  // 2. 监听路由变化，自动向后台查岗
  // ==========================================
  useEffect(() => {
    const checkUserStatus = async () => {
      const storedToken = localStorage.getItem('token'); // 获取本地 Token
      if (!storedToken || pathname.includes('/login') || pathname.includes('/register')) return; // 无需检测则跳过

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api'; // 获取 API 基址
      
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, { // 呼叫患者端探针接口
          headers: { 'Authorization': `Bearer ${storedToken}` } // 附带 Token
        });
        
        if (res.status === 401) { // 账号被删
          console.warn("前台账号已被删除，强制踢出"); // 提示
          logout(); // 强制踢出
        }
      } catch (e) {
        // 网络错误忽略
      }
    };

    checkUserStatus(); // 启动检测
  }, [pathname, logout]); 

  // ==========================================
  // 3. 【核心修复】：全局安全 Fetch 拦截器
  // ==========================================
  useEffect(() => {
    const originalFetch = window.fetch; // 备份原生 fetch 引用
    window.fetch = async (...args) => { // 覆盖重写全局 fetch
      const response = await originalFetch(...args); // 获取原始请求响应
      
      // 【关键改动】：提取当前正在请求的 API 接口的物理 URL 地址
      const requestUrl = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;

      // 【关键改动】：只有当返回 401 且请求的 API 本身不属于登录和注册接口时，才触发强制登出
      if (response.status === 401 && !requestUrl.includes('/login') && !requestUrl.includes('/register')) {
        console.warn("API请求被拒绝，Token失效，强制登出"); // 控制台提示
        logout(); // 执行登出并清理数据
      }
      return response; // 正常返回接口响应体
    };
    return () => {
      window.fetch = originalFetch; // 组件卸载时安全归还原生 fetch 引用，防 Strict 模式下的干扰冲突
    };
  }, [logout]); // 移除不稳定的 pathname 依赖

  const login = (userData: User, authToken: string) => { // 登录成功保存方法
    if (!userData || !authToken) { // 安全防空
      console.error("Login failed: User info or Token is missing"); // 打印错误
      return;
    }

    setUser(userData); // 写入状态
    setToken(authToken); // 写入状态
    localStorage.setItem('user', JSON.stringify(userData)); // 持久化写入本地存储
    localStorage.setItem('token', authToken); // 持久化写入本地存储
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

export const useAuth = () => { // 导出患者端鉴权自定义钩子
  const context = useContext(AuthContext); // 引用上下文
  if (context === undefined) { // 防御性判断
    throw new Error('useAuth must be used within an AuthProvider'); // 限制范围
  }
  return context; // 返回上下文对象
};