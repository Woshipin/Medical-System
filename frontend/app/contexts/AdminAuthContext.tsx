"use client";

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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
  2: "Doctor",
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5062/api";

const isAdminRole = (role?: string) => {
  const normalizedRole = role?.toLowerCase();
  return normalizedRole === "superadmin" || normalizedRole === "admin" || normalizedRole === "doctor";
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(async () => {
    try {
      await window.fetch(`${API_BASE_URL}/admin/logout`, {
        method: "POST",
        headers: localStorage.getItem("adminToken") ? { "Authorization": `Bearer ${localStorage.getItem("adminToken")}` } : {}
      });
    } catch { }

    setUser(null);
    setToken(null);
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
  }, [router]);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!pathname.startsWith("/admin")) {
        setIsInitialized(true);
        return;
      }

      if (pathname.includes("/admin/login") || pathname.includes("/admin/register")) {
        setIsInitialized(true);
        return;
      }

      const storedToken = localStorage.getItem("adminToken");
      if (!storedToken) {
        setUser(null);
        setIsInitialized(true);
        return;
      }

      try {
        // 【核心隔离机制】：发送认证头部校验身份，无视 Cookie
        const res = await window.fetch(`${API_BASE_URL}/admin/check-auth`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${storedToken}` }
        });

        if (!res.ok) {
          logout();
          return;
        }

        const result = await res.json();
        const loggedUser = result?.data?.user as AdminUser | undefined;

        if (result?.success && loggedUser && isAdminRole(loggedUser.role)) {
          setUser(loggedUser);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch {
        setUser(null);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [pathname, logout]);

  useEffect(() => {
    if (!isInitialized || !pathname.startsWith("/admin")) return;

    const isLoginOrRegister = pathname.includes("/admin/login") || pathname.includes("/admin/register");

    if (!user) {
      if (!isLoginOrRegister) router.replace("/admin/login");
      return;
    }

    if (!isAdminRole(user.role)) {
      logout();
      if (!isLoginOrRegister) router.replace("/admin/login");
      return;
    }

    if (isLoginOrRegister || pathname === "/admin") {
      router.replace("/admin/dashboard");
    }
  }, [user, isInitialized, pathname, router, logout]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawFetch = window.fetch;
    window.fetch = async (input, init) => {
      const requestUrl = typeof input === "string" ? input : (input as Request).url;
      let modifiedInit = { ...init };

      // 【核心隔离机制】：只要处于 /admin 路由下的操作，拦截所有 API 请求并强行植入后台的 Bearer Token
      // 后端 ASP.NET JWT 中间件只要看到 Authorization 头，就会无视并盖过浏览器发送的患者 Cookie！
      if (pathname.startsWith("/admin") && requestUrl.startsWith(API_BASE_URL)) {
        const adminToken = localStorage.getItem("adminToken");
        if (adminToken) {
          const headers = new Headers(modifiedInit.headers);
          headers.set("Authorization", `Bearer ${adminToken}`);
          modifiedInit.headers = headers;
        }
      }

      const response = await rawFetch(input, modifiedInit);

      if (
        pathname.startsWith("/admin")
        && requestUrl.startsWith(API_BASE_URL)
        && response.status === 401
        && !requestUrl.includes("/login")
        && !requestUrl.includes("/register")
        && !requestUrl.includes("/check-auth")
      ) {
        logout();
      }

      return response;
    };

    return () => {
      window.fetch = rawFetch;
    };
  }, [pathname, logout]);

  const login = (userData: AdminUser, authToken: string) => {
    if (!userData || !isAdminRole(userData.role) || !authToken) return;
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("adminUser", JSON.stringify(userData));
    localStorage.setItem("adminToken", authToken);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user,
        isInitialized,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};