import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Toast from '@/components/Toast';

export const metadata = {
  title: 'SpiceFest Cloud Kitchen',
  description: 'Order food for your parties and gatherings',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <Toast />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
