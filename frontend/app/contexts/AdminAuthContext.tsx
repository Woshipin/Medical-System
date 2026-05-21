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
  token: string | null; // 当前管理员的 JWT 令牌
  login: (userData: AdminUser, token: string) => void; // 登录成功回调方法
  logout: () => void; // 退出登录方法
  isAuthenticated: boolean; // 是否已通过身份验证的标志
  isInitialized: boolean; // 上下文是否完成本地存储初始化读取的标志
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined); // 创建 React 上下文实例

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => { // 导出管理员上下文提供者组件
  const [user, setUser] = useState<AdminUser | null>(null); // 初始化管理员用户状态
  const [token, setToken] = useState<string | null>(null); // 初始化管理员 Token 状态
  const [isInitialized, setIsInitialized] = useState(false); // 初始化加载状态默认为 false
  const router = useRouter(); // 注册路由导航
  const pathname = usePathname(); // 监听当前浏览器所在的路由路径

  const logout = useCallback(() => { // 声明登出方法，并使用 useCallback 保证引用地址稳定
    setUser(null); // 清空当前内存中的用户对象
    setToken(null); // 清空内存中的令牌
    localStorage.removeItem('admin_user'); // 移除本地物理存储中的管理员用户信息
    localStorage.removeItem('admin_token'); // 移除本地物理存储中的管理员 Token
    router.push('/admin/login'); // 强制将页面引导至管理端登录页
  }, [router]); // 依赖于路由实例

  // ==========================================
  // 1. 初始化时加载本地存储
  // ==========================================
  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token'); // 从本地存储加载管理员 Token
    const storedUser = localStorage.getItem('admin_user'); // 从本地存储加载管理员用户信息

    if (storedToken && storedUser && storedUser !== "undefined") { // 如果数据均存在且有效
      try {
        setUser(JSON.parse(storedUser)); // 将用户 JSON 文本解析为对象并写入状态
        setToken(storedToken); // 将 Token 写入状态
      } catch (e) {
        logout(); // 解析发生异常则自动强制执行安全登出
      }
    }
    setIsInitialized(true); // 标记初始化加载已完成
  }, [logout]); 

  // ==========================================
  // 2. 监听路由变化，自动向后台查岗
  // ==========================================
  useEffect(() => {
    const checkUserStatus = async () => {
      const storedToken = localStorage.getItem('admin_token'); // 获取本地 Token
      // 如果没有 token，或者当前就在登录/注册页，则不需要发起状态检查
      if (!storedToken || pathname.includes('/login') || pathname.includes('/register')) return;

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062/api'; // 获取 API 基础地址
      
      try {
        const res = await fetch(`${API_BASE_URL}/admin/me`, {  // 呼叫后台探测接口
          headers: { 'Authorization': `Bearer ${storedToken}` } // 附带当前管理员 Token
        });
        
        if (res.status === 401) { // 如果后端返回 401，说明该账号已在数据库中被停用或删除
          console.warn("账号已被删除，强制踢出系统"); // 打印控制台警告
          logout(); // 强制执行登出重定向
        }
      } catch (e) {
        // 网络错误忽略
      }
    };

    checkUserStatus(); // 执行状态探测
  }, [pathname, logout]); 

  // ==========================================
  // 3. 【核心修复】：全局安全 Fetch 拦截器
  // ==========================================
  useEffect(() => {
    const originalFetch = window.fetch; // 缓存系统原生的 fetch 方法引用
    window.fetch = async (...args) => { // 开始安全重写全局 fetch 方法
      const response = await originalFetch(...args); // 调用原生方法获取接口响应
      
      // 【关键改动】：提取当前请求的真实 API 接口地址，而非浏览器地址栏路径
      const requestUrl = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;

      // 【关键改动】：只有当发生 401，且被请求的 API 接口本身不是登录或注册接口时，才触发强制登出
      if (response.status === 401 && !requestUrl.includes('/login') && !requestUrl.includes('/register')) {
        console.warn("API请求被拒绝，Token失效，强制登出"); // 打印失效警告
        logout(); // 强制清除状态并登出
      }
      return response; // 正常返回请求响应体
    };
    return () => {
      window.fetch = originalFetch; // 在组件销毁或重构时，安全地恢复原生的全局 fetch 引用，防指针错乱
    };
  }, [logout]); // 移除不稳定的 pathname 依赖，使拦截器在严格模式下更加稳定

  const login = (userData: AdminUser, authToken: string) => { // 声明登录成功保存状态的方法
    if (!userData || !authToken) return; // 安全防御
    setUser(userData); // 写入用户状态
    setToken(authToken); // 写入 Token 状态
    localStorage.setItem('admin_user', JSON.stringify(userData)); // 将用户信息转为 JSON 保存至物理存储
    localStorage.setItem('admin_token', authToken); // 将 Token 保存至物理存储
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

export const useAdminAuth = () => { // 导出管理员鉴权自定义钩子
  const context = useContext(AdminAuthContext); // 引用上下文
  if (context === undefined) { // 防御性校验
    throw new Error('useAdminAuth must be used within an AdminAuthProvider'); // 强制要求必须在 Provider 内部使用
  }
  return context; // 返回上下文对象
};