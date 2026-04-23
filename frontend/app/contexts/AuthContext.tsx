"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

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

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    // Defensive check
    if (storedToken && storedUser) {
      try {
        if (storedUser !== "undefined" && storedUser !== "null") {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error("Failed to parse user info from local storage:", error);
        localStorage.removeItem('user'); 
      }
    }
    
    setIsInitialized(true);
  }, []);

  const login = (userData: User, authToken: string) => {
    // Defense: Prevent crashing on next refresh if undefined is passed
    if (!userData || !authToken) {
      console.error("Login failed: User info or Token is missing");
      return;
    }

    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
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