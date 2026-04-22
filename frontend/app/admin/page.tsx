import { redirect } from 'next/navigation';

export default function AdminPage() {
  // 访问 /admin 时自动跳转到 /admin/dashboard
  redirect('/admin/dashboard');
}