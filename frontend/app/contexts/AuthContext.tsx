"use client";

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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
  3: "Patient",
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5062/api";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(async () => {
    try {
      await window.fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore network errors on logout
    }

    setUser(null);
    localStorage.removeItem("user");
    router.push("/login");
  }, [router]);

  useEffect(() => {
    const initializeAuth = async () => {
      if (pathname.startsWith("/admin")) {
        setIsInitialized(true);
        return;
      }

      try {
        const res = await window.fetch(`${API_BASE_URL}/auth/check-auth`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const result = await res.json();
        
        // 核心修复：即使后端误放行，前端在此执行二次硬拦截，只允许 Patient 身份
        if (result?.success && result?.data?.user) {
          const fetchedUser = result.data.user;
          const isPatient = fetchedUser.roleValue === 3 || (fetchedUser.role && fetchedUser.role.toLowerCase() === 'patient');
          
          if (isPatient) {
             setUser(fetchedUser);
             localStorage.setItem("user", JSON.stringify(fetchedUser));
          } else {
             // 身份串台，强制清理
             setUser(null);
             localStorage.removeItem("user");
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawFetch = window.fetch;
    window.fetch = async (input, init) => {
      const requestUrl = typeof input === "string" ? input : (input as Request).url;
      const modifiedInit = requestUrl.startsWith(API_BASE_URL)
        ? { ...init, credentials: "include" as RequestCredentials }
        : init;

      const response = await rawFetch(input, modifiedInit);

      if (pathname.startsWith("/admin")) {
        return response;
      }

      if (
        response.status === 401
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
  }, [logout, pathname]);

  const login = (userData: User, authToken?: string) => {
    if (!userData) return;
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: null,
        login,
        logout,
        isAuthenticated: !!user,
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};