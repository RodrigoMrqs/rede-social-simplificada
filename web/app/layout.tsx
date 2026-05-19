import type { Metadata } from 'next';
import { AuthProvider } from '@/store/AuthContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Ágora',
  description: 'Plataforma de microblogging',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
