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
  token: string | null; // 兼容性保留字段（现在由 Cookie 托管，此值通常为 null 或静态占位）
  login: (userData: User, token: string) => void; // 登录成功回调方法
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
  // 【重构】：登出方法（向后端发送注销请求并清除本地 Cookie）
  // ==========================================
  const logout = useCallback(async () => { // 声明登出方法，并使用 useCallback 保证引用稳定
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api'; // 获取 API 基础地址
    try {
      // 1. 呼叫后端注销接口，清除 HttpOnly 患者登录安全 Cookie
      await originalFetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include' // 允许携带凭证以正确删除 Cookie
      });
    } catch (e) {
      // 忽略网络异常，确保本地清除动作强制执行成功
    }

    setUser(null); // 清空全局内存中的用户对象
    localStorage.removeItem('user'); // 移除本地物理存储中残留的患者非敏感缓存
    router.push('/login'); // 将浏览器强制重定向引导至患者登录页
  }, [router]); // 稳定依赖项

  // ==========================================
  // 【重构】：1. 初始化时自动向后端 check-auth 探查 Cookie 是否有效（支持登录页自动跳转）
  // ==========================================
  useEffect(() => {
    const initializeAuth = async () => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api'; // 获取 API 基址
      
      // 如果当前就在登录或注册页面，不需要自动验证状态，直接跳过以优化加载
      if (pathname.includes('/login') || pathname.includes('/register')) {
        setIsInitialized(true); // 仍需标记初始化已完成
        return;
      }

      try {
        // 呼叫后端免密验证状态探查接口
        const res = await originalFetch(`${API_BASE_URL}/auth/check-auth`, {
          method: 'GET',
          credentials: 'include' // 强行显式加上 credentials，防止初始化时因生命周期竞争导致首个请求漏带 Cookie
        });
        
        if (res.ok) { // 若响应状态码为 200
          const result = await res.json(); // 解析 JSON
          if (result.success && result.data?.user) { // 若后端判定登录态依旧有效
            setUser(result.data.user); // 自动将用户信息还原到 React 全局状态，实现免密自动登录
            localStorage.setItem('user', JSON.stringify(result.data.user)); // 同步缓存用户信息
          } else {
            setUser(null); // 状态失效，清空内存用户
          }
        } else {
          setUser(null); // 状态码非 200 清空用户
        }
      } catch (e) {
        setUser(null); // 网络异常时保持未登录状态
      } finally {
        setIsInitialized(true); // 无论成功失败，都标记初始化完成，彻底防止登录态闪烁
      }
    };

    initializeAuth(); // 启动检测
  }, [pathname]); // 依赖于路径变化，在进入新页面时自动校验

  // ==========================================
  // 【重构】：2. 全局安全 Fetch 拦截器 (自动注入 credentials: 'include')
  // ==========================================
  useEffect(() => {
    if (typeof window === 'undefined') return; // 防范 Next.js 服务端渲染环境崩溃

    const rawFetch = window.fetch; // 备份真实的原生 fetch 方法
    window.fetch = async (input, init) => { // 重写 window.fetch，为全局所有网络请求添加安全代理
      const requestUrl = typeof input === 'string' ? input : (input as Request).url; // 提取当前请求的目标物理 API 地址
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api'; // 提取基准 API URL

      let modifiedInit = init || {}; // 初始化配置容器

      // 判断如果当前请求是发往我们 C# 后端的，则强制注入 Cookie 传输凭证
      if (requestUrl.startsWith(API_BASE_URL)) {
        modifiedInit = {
          ...modifiedInit,
          credentials: 'include' // 强制让浏览器所有请求自动携带 Cookie 发送，无需在各个页面手动编写
        };
      }

      const response = await rawFetch(input, modifiedInit); // 执行真正的底层网络呼叫

      // 当发生 401（未授权），且不是登录、注册或验证接口本身时，说明 Token 过期，自动踢出系统
      if (response.status === 401 && 
          !requestUrl.includes('/login') && 
          !requestUrl.includes('/register') && 
          !requestUrl.includes('/check-auth')) {
        console.warn("API请求被拒绝，患者 Cookie 失效，强制登出"); // 控制台提示
        logout(); // 执行登出并清理数据
      }
      return response; // 正常返回接口响应体
    };

    return () => {
      window.fetch = rawFetch; // 组件卸载时安全归还原生 fetch 引用，防止 Strict 模式下的递归干扰冲突
    };
  }, [logout]); // 移除不稳定的 pathname 依赖

  // ==========================================
  // 3. 登录成功回调方法
  // ==========================================
  const login = (userData: User, authToken: string) => { // 登录成功保存方法
    if (!userData) return; // 安全防御
    setUser(userData); // 写入 React 全局用户状态
    localStorage.setItem('user', JSON.stringify(userData)); // 将不敏感的用户资料暂存至本地
    // 【修改】：已不再往本地物理存储写入 token 敏感数据，现已由浏览器 HttpOnly Cookie 安全托管
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token: null, // JWT Token 现隐式保存在 Cookie 中，此处向后兼容返回 null
      login, 
      logout, 
      isAuthenticated: !!user, // 只要内存中的 user 对象存在，即代表已处于登录态
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