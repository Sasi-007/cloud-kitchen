import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import { PLATFORM_NAME } from '@/lib/config';

export const metadata = {
  title: { default: `Admin — ${PLATFORM_NAME}`, template: `%s — Admin | ${PLATFORM_NAME}` },
  robots: { index: false, follow: false }, // never index admin pages
};

export default function AdminLayout({ children }) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
