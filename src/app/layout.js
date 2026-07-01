import './globals.css';
import { AppProvider }  from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import Toast from '@/components/Toast';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';

export const metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: 'Cloud Kitchen — Fresh Party Catering & Bulk Food Orders',
    template: '%s | Cloud Kitchen',
  },
  description:
    'Order fresh bulk food for parties, events and gatherings from the best cloud kitchens near you. Catering for 10 to 500+ people.',
  keywords: [
    'cloud kitchen', 'party catering', 'bulk food order', 'event catering',
    'biryani delivery', 'Indian food catering', 'corporate catering', 'food delivery',
  ],
  authors: [{ name: 'Cloud Kitchen Platform' }],
  openGraph: {
    type: 'website',
    siteName: 'Cloud Kitchen Platform',
    title: 'Cloud Kitchen — Fresh Party Catering',
    description: 'Order fresh bulk food for parties, events and gatherings.',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cloud Kitchen — Fresh Party Catering',
    description: 'Order fresh bulk food for parties, events and gatherings.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  category: 'food',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppProvider>
            <Toast />
            {children}
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
