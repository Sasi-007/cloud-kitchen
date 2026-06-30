import Link from 'next/link';

export const metadata = { title: 'Kitchen Admin — SpiceFest' };

export default function AdminLayout({ children }) {
  return (
    <>
      <header className="admin-nav">
        <span className="admin-nav-logo">👨‍🍳 Kitchen Admin</span>
        <Link href="/" className="admin-nav-back">← Customer View</Link>
      </header>
      <main>{children}</main>
    </>
  );
}
