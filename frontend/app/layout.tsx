import type { Metadata } from "next";
import "./globals.css";

// 引入前台 (Patient) 的 AuthProvider
import { AuthProvider } from "./contexts/AuthContext"; 
// 引入后台 (Admin) 的 AdminAuthProvider
import { AdminAuthProvider } from "./contexts/AdminAuthContext"; 


export const metadata: Metadata = {
  title: "Pin Medical Center",
  description: "您的健康，我们的优先",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className="antialiased">
        
        {/* 嵌套两个 Provider：它们各自独立管理状态，互不干扰 */}
        <AuthProvider>
          <AdminAuthProvider>
            {children}
          </AdminAuthProvider>
        </AuthProvider>
        
      </body>
    </html>
  );
}
