import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth.context';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'TARUKA GYM - Sistema de Gestión',
  description: 'Sistema de administración y control de acceso TARUKA GYM',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#171717',
                color: '#fff',
                border: '1px solid #404040',
                borderRadius: '12px',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
