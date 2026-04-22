// app/(frontend)/layout.tsx
import { Header } from '@/components/frontend/Header';
import { Footer } from '@/components/frontend/Footer';

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* 导航栏：不再需要传 setView */}
      <Header />
      
      <main className="flex-grow">
        {children}
      </main>
      
      {/* 页脚：不再需要传 setView */}
      <Footer />
    </div>
  );
}