// app/page.tsx
import { redirect } from 'next/navigation';

/**
 * 【重要改进说明】
 * 在新的架构中，你不再需要手动维护 renderView 和 currentView。
 * 1. 所有的“视图切换”现在由 Next.js 的文件夹路由自动处理。
 * 2. 访问 "/" 根路径时，我们直接重定向到 "/home"。
 * 3. 这样可以确保你的 URL 始终与内容同步（例如：访问 /about 就看到关于页面）。
 */
export default function RootPage() {
  // 访问根地址时，自动跳转到 (frontend)/home/page.tsx
  redirect('/home');
}