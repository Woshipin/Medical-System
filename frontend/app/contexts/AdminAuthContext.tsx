"use client"; // 启用 Next.js 客户端组件模式

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'; // 引入 React 核心依赖和钩子
import { useRouter, usePathname } from 'next/navigation'; // 引入 Next.js 导航和路径钩子

export interface AdminUser { // 定义管理员用户实体接口
  id: string; // 用户唯一 ID
  fullName: string; // 真实姓名
  email: string; // 电子邮箱
  role: string; // 角色字符
  roleValue?: number; // 角色整型值
}

export const ADMIN_ROLE_NAMES: { [key: number]: string } = { // 声明管理员角色静态字典映射
  0: "Super Admin", // 0 代表超级管理员
  1: "Admin", // 1 代表普通管理员
  2: "Doctor" // 2 代表医生
};

interface AdminAuthContextType { // 声明上下文状态暴露的属性与方法接口
  user: AdminUser | null; // 当前登录的管理员用户对象，未登录则为 null
  login: (userData: AdminUser) => void; // 【核心修复】：移除了多余的 token 参数，只保留 userData
  logout: () => void; // 退出登录方法
  isAuthenticated: boolean; // 是否已通过身份验证的标志
  isInitialized: boolean; // 上下文是否完成 Cookie 初始化状态读取的标志
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined); // 创建 React 上下文实例

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => { // 导出管理员上下文提供者组件
  const [user, setUser] = useState<AdminUser | null>(null); // 初始化管理员用户状态
  const [isInitialized, setIsInitialized] = useState(false); // 初始化加载状态默认为 false
  const router = useRouter(); // 注册路由导航
  const pathname = usePathname(); // 监听当前浏览器所在的路由路径

  // 保存原生 fetch 引用，以便在拦截器外以及注销时安全使用
  const originalFetch = typeof window !== 'undefined' ? window.fetch : null!;

  // ==========================================
  // 【重构】：退出登录方法（异步清理 HttpOnly Cookie，废弃 LocalStorage）
  // ==========================================
  const logout = useCallback(async () => { // 声明登出方法，并使用 useCallback 保证引用地址稳定
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api'; // 获取 API 基础地址
    try {
      // 1. 呼叫后端注销接口，清除 HttpOnly 安全 Cookie
      await originalFetch(`${API_BASE_URL}/admin/logout`, {
        method: 'POST',
        credentials: 'include' // 允许携带凭证
      });
    } catch (e) {
      // 忽略注销网络异常，防止网络波动阻塞本地状态清除
    }

    setUser(null); // 清空当前内存中的用户对象
    router.push('/admin/login'); // 强制将页面引导至管理端登录页
  }, [router]); // 依赖于路由实例

  // ==========================================
  // 【重构】：1. 初始化时自动向后端 check-auth 探查 Cookie 是否有效（支持登录页自动跳转）
  // ==========================================
  useEffect(() => {
    const initializeAuth = async () => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api'; // 获取 API 基础地址
      
      // 如果当前就在登录或注册页面，不需要自动验证状态，直接跳过以优化加载
      if (pathname.includes('/login') || pathname.includes('/register')) {
        setIsInitialized(true); // 仍需标记初始化已完成
        return;
      }

      try {
        // 呼叫后端免密验证状态探查接口
        const res = await originalFetch(`${API_BASE_URL}/admin/check-auth`, {
          method: 'GET',
          credentials: 'include' // 强行显式加上 credentials，防止加载顺序竞争
        });
        
        if (res.ok) { // 如果响应状态码为 200
          const result = await res.json(); // 解析 JSON
          if (result.success && result.data?.user) { // 如果后端业务表明登录态依然有效
            setUser(result.data.user); // 自动将用户信息还原到全局状态，实现免密自动登录
          } else {
            setUser(null); // 状态失效清空用户
          }
        } else {
          setUser(null); // 状态码非 200 清空用户
        }
      } catch (e) {
        setUser(null); // 网络异常时保持未登录状态
      } finally {
        setIsInitialized(true); // 最终标记初始化读取完成，允许界面渲染，彻底防止登录态闪烁
      }
    };

    initializeAuth(); // 启动验证
  }, [pathname]); // 依赖于路径变化，在进入新页面时自动校验

  // ==========================================
  // 【核心修改】：2. 全局安全 Fetch 拦截器 (自动注入 credentials: 'include')
  // ==========================================
  useEffect(() => {
    if (typeof window === 'undefined') return; // 防范 Next.js 服务端渲染环境崩溃

    const rawFetch = window.fetch; // 缓存当前真实的全局 fetch 方法
    window.fetch = async (input, init) => { // 重写 window.fetch，为全局所有网络呼叫添加安全代理
      const requestUrl = typeof input === 'string' ? input : (input as Request).url; // 提取当前请求的目标物理 API 地址
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api'; // 提取基准 API URL

      let modifiedInit = init || {}; // 初始化配置容器

      // 判断如果当前请求是发往我们 C# 后端的，则强制注入 Cookie 传输凭证
      if (requestUrl.startsWith(API_BASE_URL)) {
        modifiedInit = {
          ...modifiedInit,
          credentials: 'include' // 强制让浏览器所有请求自动携带 Cookie 发往后端，无需手动编写
        };
      }

      const response = await rawFetch(input, modifiedInit); // 执行真正的底层网络呼叫

      // 当发生 401（未授权），且不是登录、注册或验证接口本身时，说明 Token 过期，自动踢出系统
      if (response.status === 401 && 
          !requestUrl.includes('/login') && 
          !requestUrl.includes('/register') && 
          !requestUrl.includes('/check-auth')) {
        console.warn("API请求被拒绝，身份 Cookie 失效，强制登出"); // 记录安全警告
        logout(); // 强制执行注销
      }
      return response; // 返回响应数据体
    };

    return () => {
      window.fetch = rawFetch; // 卸载或重构时，安全恢复原生引用，防止指针无限嵌套导致栈溢出
    };
  }, [logout]); 

  // ==========================================
  // 3. 登录成功回调方法
  // ==========================================
  // 【核心修复】：移除了多余的 token 参数。
  const login = (userData: AdminUser) => { 
    if (!userData) return; // 安全防御
    setUser(userData); // 将用户信息对象写入全局 React 状态中管理
  };

  return (
    <AdminAuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user, // 只要内存中的 user 对象存在，即代表已处于登录态
      isInitialized
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => { // 导出管理员鉴权自定义钩子
  const context = useContext(AdminAuthContext); // 引用上下文
  if (context === undefined) { // 防御性校验
    throw new Error('useAdminAuth must be used within an AdminAuthProvider'); // 强制要求必须在 Provider 内部使用
  }
  return context; // 返回上下文对象
};