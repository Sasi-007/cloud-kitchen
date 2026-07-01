import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';

export const metadata = { title: 'Admin — SpiceFest Kitchen' };

export default function AdminLayout({ children }) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
