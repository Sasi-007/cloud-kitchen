import Nav from '@/components/Nav';
import { PLATFORM_NAME } from '@/lib/config';

export const metadata = {
  title: { default: `${PLATFORM_NAME} — Cloud Kitchen Ordering Platform`, template: `%s | ${PLATFORM_NAME}` },
  description: `${PLATFORM_NAME} helps cloud kitchens accept bulk party & event orders online. Real-time dashboard, WhatsApp notifications, and analytics.`,
};

export default function CustomerLayout({ children }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
    </>
  );
}
