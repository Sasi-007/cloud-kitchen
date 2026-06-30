import Nav from '@/components/Nav';

export default function CustomerLayout({ children }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
    </>
  );
}
